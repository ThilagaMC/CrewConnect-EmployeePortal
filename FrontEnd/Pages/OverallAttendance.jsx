import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toast, Badge, Spinner } from "react-bootstrap";
import { 
  BsCalendarCheck, 
  BsCalendarX,
  BsClock,
  BsClockHistory,
  BsPersonCheck,
  BsPersonDash
} from "react-icons/bs";

const API_BASE_URL = "http://localhost:5000";

const OverallAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date().toLocaleDateString());

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/attendance`);
        setAttendanceRecords(response.data);
      } catch (err) {
        showAlert("Failed to fetch attendance records. Please try again later.", "danger");
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceRecords();
  }, []);

  const statusColors = {
    Present: "success",
    WFH: "info",
    WFO: "primary",
    "Day Off": "warning",
    "Check-in": "success",
    "Check-out": "danger",
    Break: "secondary",
    Active: "primary",
    Absent: "danger",
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "Present":
      case "Check-in":
        return <BsPersonCheck className="me-1" />;
      case "Check-out":
      case "Absent":
        return <BsPersonDash className="me-1" />;
      case "WFH":
      case "WFO":
        return <BsClock className="me-1" />;
      default:
        return <BsClockHistory className="me-1" />;
    }
  };

  return (
    <div className="container">
    <div className="container py-4" style={{ maxWidth: "100%" }}>
      {/* Alert Toast */}
      {alert && (
        <Toast 
          onClose={() => setAlert(null)} 
          show={!!alert} 
          delay={5000} 
          autohide
          className={`position-fixed top-0 end-0 m-2 bg-${alert.type} text-white`}
          style={{ 
            zIndex: 9999, 
            minWidth: "280px", 
            maxWidth: "90%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          <Toast.Header 
            className={`bg-${alert.type} text-white d-flex justify-content-between`}
            closeButton={false}
          >
            <strong className="me-auto">Notification</strong>
            <button 
              type="button" 
              className="btn-close btn-close-white m-0" 
              onClick={() => setAlert(null)}
              aria-label="Close"
            ></button>
          </Toast.Header>
          <Toast.Body className="fw-medium">{alert.message}</Toast.Body>
        </Toast>
      )}

      <div className="card shadow-lg border-0 rounded-3 overflow-hidden">
        {/* Card Header */}
        <div 
          className="card-header text-white text-center py-3 px-4" 
          style={{ 
            background: "linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)",
            borderBottom: "none"
          }}
        >
          <div className="d-flex align-items-center justify-content-center">
            <BsCalendarCheck className="fs-3 me-2" />
            <h3 className="fw-bold mb-0">Attendance Report</h3>
          </div>
          <p className="mb-0 mt-2 opacity-75 small">
            Last updated: {currentDate}
          </p>
        </div>

        {/* Card Body */}
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5" style={{ minHeight: "300px" }}>
              <Spinner 
                animation="border" 
                variant="primary" 
                style={{ width: "3rem", height: "3rem" }} 
              />
              <p className="mt-3 fw-medium">Loading attendance records...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 fw-semibold text-center" style={{ minWidth: "110px" }}>Date</th>
                    <th className="py-3 fw-semibold text-center" style={{ minWidth: "130px" }}>Employee</th>
                    <th className="py-3 fw-semibold text-center" style={{ minWidth: "110px" }}>Category</th>
                    <th className="py-3 fw-semibold text-center" style={{ minWidth: "110px" }}>Check-in</th>
                    <th className="py-3 fw-semibold text-center" style={{ minWidth: "110px" }}>Check-out</th>
                    <th className="py-3 fw-semibold text-center" style={{ minWidth: "110px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record, index) => (
                      <tr 
                        key={index} 
                        className={index % 2 === 0 ? "bg-white" : "bg-light"}
                        style={{ transition: "background-color 0.2s ease" }}
                      >
                        <td className="py-3 text-center fw-medium">{record.date}</td>
                        <td className="py-3 text-center">
                          <span className="d-inline-block text-truncate" style={{ maxWidth: "120px" }}>
                            {record.UserName || "-"}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <Badge 
                            pill 
                            bg={statusColors[record.category] || "secondary"} 
                            className="px-3 py-2"
                          >
                            {record.category}
                          </Badge>
                        </td>
                        <td className="py-3 text-center fw-medium">
                          {record.checkInTime || "-"}
                        </td>
                        <td className="py-3 text-center fw-medium">
                          {record.checkOutTime || "-"}
                        </td>
                        <td className="py-3 text-center">
                          <Badge 
                            pill 
                            bg={statusColors[record.status] || "secondary"} 
                            className="px-3 py-2 d-flex align-items-center justify-content-center"
                          >
                            {getStatusIcon(record.status)}
                            {record.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <BsCalendarX className="fs-1 text-muted mb-3" />
                        <h5 className="text-muted">No attendance records found</h5>
                        <p className="text-muted small mt-2">
                          There are no records to display at this time
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Card Footer */}
        {!loading && attendanceRecords.length > 0 && (
          <div 
            className="card-footer bg-light py-3 px-4" 
            style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                Showing <strong>{attendanceRecords.length}</strong> records
              </span>
              <span className="text-muted small">
                <i className="bi bi-info-circle me-1"></i>
                Scroll horizontally to view all data
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default OverallAttendance;