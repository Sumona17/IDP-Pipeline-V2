import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { apiBaseUrl } from "../config/configuration";
import { getOidcAccessToken } from "./token-helper";

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
}
interface RequestConfig {
  useCustomUrl?: boolean;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuth?: boolean;
};

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

function ensureHeaders(req: RetryableRequest) {
  if (!req.headers) req.headers = new AxiosHeaders();
}

function setAuthHeader(headers: any, token: string) {
  if (!headers) return;
  if (typeof headers.set === "function") headers.set("Authorization", `Bearer ${token}`);
  else headers["Authorization"] = `Bearer ${token}`;
}

function isRefreshUrl(url?: string) {
  return !!url && url.includes("/auth/refresh");
}

export class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  private refreshRejecters: Array<(err: unknown) => void> = [];

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
    });

    this.client.interceptors.request.use(
      (req: RetryableRequest) => {
        ensureHeaders(req);
        if (req.skipAuth) return req;

        const accessToken = getOidcAccessToken();
        if (accessToken) setAuthHeader(req.headers, accessToken);

        return req;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config as RetryableRequest | undefined;
        if (!originalRequest) return Promise.reject(error);

        const status: number | undefined = error?.response?.status;
        const method = (originalRequest.method || "").toLowerCase();

        if (method === "options") return Promise.reject(error);
        if (isRefreshUrl(originalRequest.url)) return Promise.reject(error);
        if (status !== 401 && status !== 403) return Promise.reject(error);

        const refreshToken = sessionStorage.getItem("refresh_token");
        if (!refreshToken) {
          return Promise.reject(error);
        }

        if (originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.refreshSubscribers.push((newAccessToken: string) => {
              ensureHeaders(originalRequest);
              setAuthHeader(originalRequest.headers, newAccessToken);
              resolve(this.client(originalRequest));
            });
            this.refreshRejecters.push(reject);
          });
        }

        this.isRefreshing = true;

        try {
          const refreshResponse = await axios.post(
            `${config.baseURL}/auth/refresh`,
            { refresh_token: refreshToken },
            { timeout: config.timeout },
          );

          const { access_token, refresh_token: newRefreshToken } = refreshResponse.data ?? {};
          if (!access_token) throw new Error("No access_token returned from refresh.");

          sessionStorage.setItem("access_token", access_token);
          if (newRefreshToken) sessionStorage.setItem("refresh_token", newRefreshToken);

          (this.client.defaults.headers as any).common =
            (this.client.defaults.headers as any).common || {};
          (this.client.defaults.headers as any).common["Authorization"] = `Bearer ${access_token}`;
          this.refreshSubscribers.forEach((cb) => cb(access_token));
          this.refreshSubscribers = [];
          this.refreshRejecters = [];
          this.isRefreshing = false;

          ensureHeaders(originalRequest);
          setAuthHeader(originalRequest.headers, access_token);

          return this.client(originalRequest);
        } catch (refreshError) {
          this.isRefreshing = false;
          this.refreshRejecters.forEach((rej) => rej(refreshError));
          this.refreshSubscribers = [];
          this.refreshRejecters = [];
          return Promise.reject(refreshError);
        }
      },
    );
  }

  login(tokens: { access_token: string; refresh_token?: string }) {
    sessionStorage.setItem("access_token", tokens.access_token);
    if (tokens.refresh_token) sessionStorage.setItem("refresh_token", tokens.refresh_token);
  }

  isAuthenticated(): boolean {
    return !!getOidcAccessToken();
  }

  async post<T>(endpoint: string, data?: any, cfg?: RequestConfig): Promise<T> {
    const url = cfg?.useCustomUrl ? endpoint : `/${endpoint}`;
    const response: AxiosResponse<T> = await this.client.post<T>(url, data, {
      headers: cfg?.headers,
      ...(cfg?.useCustomUrl && { baseURL: "" }),
      ...(cfg?.skipAuth && { skipAuth: true }),
    } as any);
    return response.data;
  }

  async get<T>(endpoint: string, cfg?: RequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(endpoint, {
      headers: cfg?.headers,
      ...(cfg?.skipAuth && { skipAuth: true }),
    } as any);
    return response.data;
  }

  async getMultiple<T>(endpoints: string[]): Promise<(T | null)[]> {
    const requests = endpoints.map((endpoint) =>
      this.client
        .get<T>(endpoint)
        .then((response) => response.data)
        .catch(() => null),
    );
    return Promise.all(requests);
  }
}

export const apiClient = new ApiClient({
  baseURL: apiBaseUrl,
  timeout: 180000,
});

export default apiClient;

export const authUtils = {
  getToken: () => getOidcAccessToken(),
  getRefreshToken: () => sessionStorage.getItem("refresh_token"),
  clearAuth: () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
  },
  SESSION_EXPIRED_EVENT,
};