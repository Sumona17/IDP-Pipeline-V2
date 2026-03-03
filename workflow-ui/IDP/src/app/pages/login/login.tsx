import React, { useCallback, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import "./login.css";

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

  return (
    <div className="login-container">
      <div className="left-panel">
        <div className="left-content">
          <h1 className="brand-title">Intelligent Document Processing</h1>
          <p className="brand-subtitle">
            AI-powered document understanding for smarter automation
          </p>
        </div>
      </div>

      <div className="right-panel">
        <div className="login-card">
          <h2 className="title">Access IDP</h2>

          <button
            className="signin-btn mt-8 w-full"
            onClick={handleLogin}
            disabled={auth.isLoading}
          >
            {auth.isLoading ? "Redirecting..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
