import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import authImage from "../assets/auth-illustration.svg";

const PasswordResetVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const token = decodeURIComponent(searchParams.get("token") || "");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setErrorMessage("Invalid or missing token");
        return;
      }

      try {
        console.log("Verifying token:", token);
        const response = await axios.post(
          "http://localhost:5000/password-reset/verify-token",
          { token },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Verification response:", response.data);
        if (response.data.success) {
          setTokenValid(true);
          setEmail(response.data.email);
        } else {
          setErrorMessage(response.data.message || "Token verification failed");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setErrorMessage(
          error.response?.data?.message || 
          "Invalid or expired token"
        );
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      console.log("Resetting password for:", email);
      const response = await axios.post(
        "http://localhost:5000/password-reset/reset-password",
        { token, newPassword },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Password reset response:", response.data);
      setSuccessMessage(response.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      setErrorMessage(
        error.response?.data?.message || 
        "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid && !errorMessage) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column flex-md-row align-items-center justify-content-center bg-light">
      <div className="d-none d-md-flex col-md-6 align-items-center justify-content-center p-4">
        <div className="text-center" style={{ maxWidth: "400px" }}>
          <img 
            src={authImage} 
            alt="Password reset illustration" 
            className="img-fluid mb-3" 
          />
          <h2 className="text-primary mb-2">Set New Password</h2>
          <p className="text-muted">
            Create a new password for your account
          </p>
        </div>
      </div>

      <div className="col-12 col-md-6 p-4" style={{ maxWidth: "500px" }}>
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h3 className="fw-bold text-primary">New Password</h3>
              {email && <p className="text-muted mb-1">For: {email}</p>}
              <p className="text-muted">
                Enter and confirm your new password
              </p>
            </div>

            {errorMessage && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-circle me-2"></i>
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2"></i>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
                <small className="form-text text-muted">
                  Must be at least 6 characters long
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-100 py-2"
                disabled={loading || !tokenValid}
              >
                {loading ? (
                  <>
                    <span 
                      className="spinner-border spinner-border-sm me-2" 
                      role="status" 
                      aria-hidden="true"
                    ></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-key me-2"></i>
                    Reset Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetVerifyPage;