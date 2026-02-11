import { AuthProvider } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

const oidcConfig = {
  authority: import.meta.env.VITE_APP_COGNITO_AUTHORITY,
  client_id: import.meta.env.VITE_APP_COGNITO_CLIENT_ID,

  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: `${window.location.origin}/login`,

  response_type: "code",
  scope: "openid email phone",

  automaticSilentRenew: false,
  useRefreshToken: true,
  loadUserInfo: false,
  revokeTokensOnSignout: true,

  accessTokenExpiringNotificationTime: 60,

  userStore: new WebStorageStateStore({
    store: window.sessionStorage,
  }),

  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>;
}
