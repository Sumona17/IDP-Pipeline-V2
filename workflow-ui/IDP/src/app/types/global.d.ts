import { User } from "oidc-client-ts";

declare global {
  interface Window {
    __oidc_user?: User;
  }
}

export {};
