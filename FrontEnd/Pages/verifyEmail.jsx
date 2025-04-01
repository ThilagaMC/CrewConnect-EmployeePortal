import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure this is imported correctly

const BASE_URL ='https://crewconnect-employeeportal.onrender.com'
const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");

    if (!token) {
      setMessage("Token is missing. Please check your email again.");
      return;
    }

    axios
      .get(`${BASE_URL}/verify?token=${token}`)
      .then((response) => {
        setMessage(response.data.message);
        setIsSuccess(response.data.success);
      })
      .catch((error) => {
        setMessage(
          error.response?.data?.message || "An error occurred during verification."
        );
      });
  }, [location]);

  const handleLogin = () => {
    navigate("/");
  };

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-body text-center">
          <h2 className="card-title mb-4">Email Verification</h2>
          <p className={`card-text ${isSuccess ? "text-success" : "text-danger"}`}>{message}</p>
          {isSuccess && (
            <button className="btn btn-primary mt-3" onClick={handleLogin}>
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
