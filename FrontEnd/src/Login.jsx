import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authImage from "../assets/auth-illustration.svg"; // You'll need to add this image

const AuthPage = () => {
  const initialState = { username: "", email: "", password: "", role: "" };
  const [formData, setFormData] = useState(initialState);
  const [isLogin, setIsLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const BASE_URL='https://crewconnect-employeeportal.onrender.com'
  const storeUserIdInCache = async (userID) => {
    try {
      const cache = await caches.open("user-cache");
      await cache.put(
        "/userID",
        new Response(JSON.stringify({ userID }), {
          headers: { "Content-Type": "application/json" },
        })
      );
      console.log("UserID stored in cache:", userID);
    } catch (error) {
      console.error("Error storing userID in cache:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, role } = formData;

    // Validation remains the same
    if (!email.trim() || !password.trim() || (!isLogin && (!username.trim() || !role.trim()))) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const apiUrl = BASE_URL;
    const endpoint = isLogin ? "/login" : "/register";
    const requestBody = isLogin ? { email, password } : { username, email, password, role };

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "An error occurred. Please try again.");
      }

      await storeUserIdInCache(data.userID);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authStatus", "true");

      setSuccessMessage(isLogin ? "Login successful!" : "Registration successful! Verify your email.");
      setErrorMessage("");
      setFormData(initialState);

      if (isLogin) {
        
        navigate(`/profile`);
        window.location.reload(); // Ensures the page reloads

      }
    } catch (error) {
      setErrorMessage(error.message);
      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-vh-100 d-flex flex-column flex-md-row align-items-center justify-content-center bg-light">
      {/* Left side with illustration - now with constrained height */}
      <div className="d-none d-md-flex col-md-6 align-items-center justify-content-center p-4" style={{ maxHeight: "100vh" }}>
        <div className="text-center" style={{ maxWidth: "400px" }}>
          <img 
            src={authImage} 
            alt="Authentication illustration" 
            className="img-fluid mb-3" 
            style={{ maxHeight: "300px" }}
          />
          <h2 className="text-primary mb-2 fs-4">
            {isLogin ? "Welcome Back!" : "Join Us Today"}
          </h2>
          <p className="text-muted fs-6">
            {isLogin 
              ? "Sign in to access your personalized dashboard." 
              : "Create an account to get started with our platform."}
          </p>
        </div>
      </div>

      {/* Right side with form - now more compact */}
      <div className="col-12 col-md-6 p-3 p-md-4" style={{ maxWidth: "500px" }}>
        <div className="card border-0 shadow-sm rounded-lg overflow-hidden">
          <div className="card-body p-3 p-md-4">
            <div className="text-center mb-3">
              <h3 className="fw-bold text-primary mt-2 fs-5">
                {isLogin ? "Sign In to Your Account" : "Create New Account"}
              </h3>
              <p className="text-muted fs-6">
                {isLogin 
                  ? "Enter your credentials to continue" 
                  : "Fill in the form to get started"}
              </p>
            </div>

            {/* Error/Success messages - now more compact */}
            {errorMessage && (
              <div className="alert alert-danger alert-dismissible fade show py-2" role="alert">
                <small>{errorMessage}</small>
                <button 
                  type="button" 
                  className="btn-close" 
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => setErrorMessage("")}
                ></button>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show py-2" role="alert">
                <small>{successMessage}</small>
                <button 
                  type="button" 
                  className="btn-close" 
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => setSuccessMessage("")}
                ></button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
              {/* Form fields with reduced spacing */}
              {!isLogin && (
                <>
                  <div className="mb-2">
                    <label htmlFor="username" className="form-label small">Full Name</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text py-1">
                        <i className="bi bi-person-fill fs-6"></i>
                      </span>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        className="form-control py-1"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label htmlFor="role" className="form-label small">Role</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text py-1">
                        <i className="bi bi-person-badge-fill fs-6"></i>
                      </span>
                      <select
                        id="role"
                        name="role"
                        className="form-select py-1"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select your role</option>
                        <option value="Admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="mb-2">
                <label htmlFor="email" className="form-label small">Email Address</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text py-1">
                    <i className="bi bi-envelope-fill fs-6"></i>
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control py-1"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label small">Password</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text py-1">
                    <i className="bi bi-lock-fill fs-6"></i>
                  </span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control py-1"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    minLength="6"
                  />
                </div>
                <small className="form-text text-muted">
                  Must be at least 6 characters long
                </small>
              </div>

              <button 
                type="submit" 
                className={`btn btn-primary w-100 py-1 mb-2 ${loading ? 'disabled' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </>
                ) : isLogin ? (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus-fill me-2"></i>
                    Sign Up
                  </>
                )}
              </button>

              <div className="text-center mt-3">
                <p className="text-muted small">
                  {isLogin ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button 
                        type="button" 
                        className="btn btn-link p-0 text-decoration-none small"
                        onClick={() => setIsLogin(false)}
                      >
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button 
                        type="button" 
                        className="btn btn-link p-0 text-decoration-none small"
                        onClick={() => setIsLogin(true)}
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </p>
                {isLogin && (
                  <button 
                    className="btn btn-link text-decoration-none small"
                    onClick={() => navigate("/password-reset")}
                  >
                    <i className="bi bi-key-fill me-1"></i>
                    Forgot Password?
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;