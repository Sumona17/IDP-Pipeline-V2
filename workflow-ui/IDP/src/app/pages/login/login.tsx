import React, { useCallback, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import "./login.css";
import Logo from "../../../../public/assets/Exasure Icon.svg";


const Login: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  const handleLogin = useCallback(async () => {
    try {
      await auth.signinRedirect({
        extraQueryParams: {
          prompt: "login",
        },
      });
    } catch (err) {
      console.error("OIDC sign-in error:", err);
    }
  }, [auth]);

  // Intelligent Document Processing IDP

  return (
     <div className="login-container flex h-screen w-full">
      <div className="left-panel flex flex-col justify-center items-center text-white">
        {/* <div className="logo-circle">
          <img src={Logo} alt="Exasure Logo" className="w-20 h-20" />
        </div> */}

        <h2 className="title mt-6 font-semibold text-2xl">Intelligent Document Processing</h2>

        <p className="subtitle mt-2 text-sm opacity-90 text-center">
          AI-powered document understanding for smarter automation
        </p>
      </div>

      <div className="right-panel flex flex-col justify-center items-start px-24 w-full max-w-lg">
        <h1 className="text-2xl font-medium mb-6 text-center">Sign in to IDP</h1>

        <button className="signin-btn mt-8 w-full" onClick={handleLogin} disabled={auth.isLoading}>
          {auth.isLoading ? "Redirecting..." : "Sign In"}
        </button>

        {auth.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg w-full">
            <p className="text-sm text-red-800">{auth.error.message}</p>
          </div>
        )}

        <p className="footer-text mt-16">© 2025 Exasure by Exavalu. All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default Login;
