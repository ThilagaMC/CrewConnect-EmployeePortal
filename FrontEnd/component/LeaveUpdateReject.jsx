import { XCircle } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css/animate.min.css";

const LeaveRejectSuccess = () => {
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
            <XCircle 
              className="text-danger" 
              size={80} 
              strokeWidth={1.5}
            />
            <div className="position-absolute top-0 start-100 translate-middle p-2 bg-danger rounded-circle">
              <div className="position-absolute top-50 start-50 translate-middle" style={{ width: "10px", height: "10px" }}></div>
            </div>
          </div>
        </div>

        <h1 className="text-danger fw-bold mb-3">Request Rejected!</h1>
        
        <p className="lead text-muted mb-4">
          The leave request has been rejected. The employee has been notified via email.
        </p>

        <div className="progress mb-4" style={{ height: "6px" }}>
          <div 
            className="progress-bar bg-danger" 
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
          .btn-danger {
            transition: all 0.3s ease;
            background-color: #dc3545;
            border-color: #dc3545;
          }
          .btn-danger:hover {
            background-color: #c82333;
            border-color: #bd2130;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
          }
          .btn-danger:active {
            transform: translateY(0);
          }
        `}</style>
      </div>
    </div>
  );
};

export default LeaveRejectSuccess;