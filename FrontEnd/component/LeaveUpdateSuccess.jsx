import { CheckCircle } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css/animate.min.css";

const LeaveUpdateSuccess = () => {

  return (
    <div className="container-fluid d-flex vh-100 align-items-center justify-content-center bg-light">
      <div 
        className="text-center p-5 border-0 rounded-4 shadow bg-white animate__animated animate__fadeInUp" 
        style={{ 
          maxWidth: "450px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
        }}
      >
        <div className="mb-4">
          <div className="position-relative d-inline-block">
            <CheckCircle 
              className="text-success" 
              size={80} 
              strokeWidth={1.5}
            />
            <div className="position-absolute top-0 start-100 translate-middle p-2 bg-success rounded-circle">
              <div className="position-absolute top-50 start-50 translate-middle" style={{ width: "10px", height: "10px" }}></div>
            </div>
          </div>
        </div>

        <h1 className="text-success fw-bold mb-3">Request Accepted!</h1>
        
        <p className="lead text-muted mb-4">
          Your leave request has been successfully updated. A confirmation has been sent to your email.
        </p>

        <div className="progress mb-4" style={{ height: "6px" }}>
          <div 
            className="progress-bar bg-success" 
            role="progressbar" 
            style={{ width: "100%", animation: "progressBar 7s linear" }}
          ></div>
        </div>



        <p className="text-muted small mt-3">
          Thank You
        </p>

        <style>{`
          @keyframes progressBar {
            0% { width: 100%; }
            100% { width: 0%; }
          }
          .btn-success {
            transition: all 0.3s ease;
            background-color: #28a745;
            border-color: #28a745;
          }
          .btn-success:hover {
            background-color: #218838;
            border-color: #1e7e34;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
          }
          .btn-success:active {
            transform: translateY(0);
          }
        `}</style>
      </div>
    </div>
  );
};

export default LeaveUpdateSuccess;