import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProviderWrapper } from "./app/pages/login/auth-provider-wrapper";
import { router } from "./app/routes/routes";

import "react-toastify/dist/ReactToastify.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Suspense>
    <AuthProviderWrapper>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </AuthProviderWrapper>
  </Suspense>,
);
