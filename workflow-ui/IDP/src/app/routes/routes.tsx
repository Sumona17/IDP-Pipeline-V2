import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./protected-route";
import { lazy } from "react";
import { ROUTE_PATHS } from "./routh-path";
import Callback from "../pages/login/callback";
import { MainLayout } from "../layouts/main-layout";
import { AuthLayout } from "../layouts/auth-layout";

import Dashboard from "../pages/dashboard/dashboard";
import DocumentReview from "../pages/document-review/document-review";
import DocumentUploaded from "../pages/document/document";

const Login = lazy(() => import("../pages/login/login"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={ROUTE_PATHS.LOGIN} replace />,
  },
  {
    path: "/callback",
    element: <Callback />,
  },

  {
    element: <MainLayout />,
    children: [
      {
        path: ROUTE_PATHS.DASHBOARD,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_PATHS.DOCUMENT,
        element: (
          <ProtectedRoute>
            <DocumentUploaded />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_PATHS.DOCUMENT_REVIEW,
        element: (
          <ProtectedRoute>
            <DocumentReview />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTE_PATHS.LOGIN,
        element: <Login />,
      },
    ],
  },
  { path: ROUTE_PATHS.NOT_FOUND, element: <div>404 Not Found</div> },
]);
