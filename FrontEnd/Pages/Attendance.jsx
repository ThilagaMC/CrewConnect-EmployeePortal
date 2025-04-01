import { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button, Spinner, Toast, Badge, Alert } from "react-bootstrap";
import { CheckCircleFill, XCircleFill, ClockFill, HouseFill, BuildingFill, SunFill, ArrowRightCircleFill, ArrowLeftCircleFill, CupHotFill } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";

const API_BASE_URL = "https://crewconnect-employeeportal.onrender.com";

const Attendance = () => {
  const [userID, setUserID] = useState("");
  const [userName, setUserName] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ show: false, type: "", value: "" });
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cachedID = await getUserIdFromCache();
        if (!cachedID) {
          throw new Error("No user ID found in cache");
        }
        setUserID(cachedID);
        await fetchAttendanceRecords(cachedID);
      } catch (err) {
        setError(err.message || "Failed to load user data");
        console.error("Error in fetchUserData:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const getUserIdFromCache = async () => {
    if (!("caches" in window)) return null;
    try {
      const cache = await caches.open("user-cache");
      const response = await cache.match("userID");
      if (!response) return null;
      return (await response.json()).userID;
    } catch (error) {
      console.error("Cache retrieval error:", error);
      return null;
    }
  };

  const fetchAttendanceRecords = async (userId) => {
    try {
      const [attendanceRes, userRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/attendance/${userId}`),
        axios.get(`${API_BASE_URL}/employees/email/${userId}`)
      ]);
      
      if (!attendanceRes.data || !Array.isArray(attendanceRes.data)) {
        throw new Error("Invalid attendance data format");
      }
      
      setAttendanceRecords(attendanceRes.data);
      setUserName(userRes.data?.username || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch attendance records");
      console.error("Error in fetchAttendanceRecords:", err);
    }
  };

  const handleUpdate = async () => {
    if (!userID) return;
    
    try {
      const payload = {
        userId: userID,
        userName: userName,
        [modal.type]: modal.value,
        timestamp: currentDateTime.toISOString()
      };
      console.log(payload);
      await axios.post(`${API_BASE_URL}/api/attendance/update-${modal.type}`, payload);
      await fetchAttendanceRecords(userID);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed. Please try again.");
      console.error("Error in handleUpdate:", err);
    } finally {
      setModal({ show: false, type: "", value: "" });
    }
  };

  const statusColors = {
    Present: "success",
    WFH: "info",
    WFO: "primary",
    "Day Off": "warning",
    "Check-in": "success",
    "Check-out": "danger",
    Break: "secondary",
    Active: "primary",
    Absent: "danger"
  };

  const statusIcons = {
    "WFH": <HouseFill className="me-2" />,
    "WFO": <BuildingFill className="me-2" />,
    "Day Off": <SunFill className="me-2" />,
    "Check-in": <ArrowRightCircleFill className="me-2" />,
    "Check-out": <ArrowLeftCircleFill className="me-2" />,
    "Break": <CupHotFill className="me-2" />
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-80">
        <Spinner animation="border" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Current Time Display */}
      <div className="text-end mb-3">
        <Badge bg="light" text="dark" className="p-2">
          <ClockFill className="me-2" />
          {currentDateTime.toLocaleString()}
        </Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <XCircleFill className="me-2" />
          {error}
        </Alert>
      )}

      {/* Success Toast */}
      {!error && attendanceRecords.length > 0 && (
        <Toast show={true} autohide delay={3000} onClose={() => {}} className="mb-4">
          <Toast.Header closeButton={false} className="bg-success text-white">
            <CheckCircleFill className="me-2" />
            <strong className="me-auto">Welcome back, {userName}</strong>
          </Toast.Header>
          <Toast.Body>
            You have {attendanceRecords.length} attendance records this period.
          </Toast.Body>
        </Toast>
      )}

      <div className="card shadow border-0">
        <div className="card-header bg-primary text-white">
          <h2 className="text-center mb-0">
            <i className="bi bi-calendar-check me-2"></i>
            Attendance Dashboard
          </h2>
        </div>
        
        <div className="card-body">
          {/* Action Buttons */}
          <div className="mb-4">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <h5 className="card-title text-muted">
                      <i className="bi bi-tags me-2"></i>
                      Work Category
                    </h5>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {["WFH", "WFO", "Day Off"].map((category) => (
                        <Button
                          key={category}
                          variant={`outline-${statusColors[category]}`}
                          className="rounded-pill"
                          onClick={() => setModal({ 
                            show: true, 
                            type: "category", 
                            value: category 
                          })}
                        >
                          {statusIcons[category]}
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-body text-center">
                    <h5 className="card-title text-muted">
                      <i className="bi bi-clock-history me-2"></i>
                      Status Update
                    </h5>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {["Check-in", "Check-out", "Break"].map((status) => (
                        <Button
                          key={status}
                          variant={statusColors[status]}
                          className="rounded-pill"
                          onClick={() => setModal({ 
                            show: true, 
                            type: "status", 
                            value: status 
                          })}
                        >
                          {statusIcons[status]}
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date}</td>
                      <td>
                        <Badge pill bg={statusColors[record.category]}>
                          {record.category}
                        </Badge>
                      </td>
                      <td>{record.checkInTime || "-"}</td>
                      <td>{record.checkOutTime || "-"}</td>
                      <td>
                        <Badge pill bg={statusColors[record.status]}>
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <div className="text-muted">
                        <i className="bi bi-calendar-x fs-1"></i>
                        <p className="mt-2">No attendance records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={modal.show} onHide={() => setModal({ show: false, type: "", value: "" })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Update</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are about to update your {modal.type} to:</p>
          <h4 className="text-center my-3">
            <Badge bg={statusColors[modal.value]}>
              {modal.value}
            </Badge>
          </h4>
          <p className="text-muted small">
            Current time: {currentDateTime.toLocaleTimeString()}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModal({ show: false, type: "", value: "" })}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Confirm Update
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Attendance;