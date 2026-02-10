import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ROUTE_PATHS } from "./routh-path";

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: boolean;
};

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth: AuthState = {
    isLoading: false,
    isAuthenticated: true,
    error: false,
  };

  if (auth.isLoading) {
    return <p>Checking authentication...</p>;
  }

  if (auth.error) {
    console.error(auth.error);
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  return <>{children}</>;
}
