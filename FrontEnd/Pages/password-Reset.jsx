import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import authImage from "../assets/auth-illustration.svg";

const PasswordResetPage = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      console.log("Sending reset request for:", email);
      const response = await axios.post(
        "http://localhost:5000/password-reset/request-reset",
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      console.log("Reset response:", response.data);
      setSuccessMessage(response.data.message);
      setEmail("");
    } catch (error) {
      console.error("Reset request error:", error);
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        "Failed to send reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-md-row align-items-center justify-content-center bg-light">
      <div className="d-none d-md-flex col-md-6 align-items-center justify-content-center p-4">
        <div className="text-center" style={{ maxWidth: "400px" }}>
          <img 
            src={authImage} 
            alt="Password reset illustration" 
            className="img-fluid mb-3" 
          />
          <h2 className="text-primary mb-2">Forgot Your Password?</h2>
          <p className="text-muted">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      <div className="col-12 col-md-6 p-4" style={{ maxWidth: "500px" }}>
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h3 className="fw-bold text-primary">Reset Password</h3>
              <p className="text-muted">
                Enter the email associated with your account
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
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-100 mb-3 py-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span 
                      className="spinner-border spinner-border-sm me-2" 
                      role="status" 
                      aria-hidden="true"
                    ></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Send Reset Link
                  </>
                )}
              </button>

              <div className="text-center">
                <button 
                  type="button"
                  className="btn btn-link text-decoration-none"
                  onClick={() => navigate("/login")}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;