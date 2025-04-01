import { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";

function LeaveTracker() {
  const [userID, setUserID] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'https://crewconnect-employeeportal.onrender.com';

  // Calculate leave days excluding weekends (Saturday and Sunday)
  const calculateLeaveDays = (fromDate, toDate) => {
    if (!fromDate || !toDate) return 0;
    
    const start = moment(fromDate);
    const end = moment(toDate);
    let leaveDays = 0;

    // Validate dates
    if (!start.isValid() || !end.isValid()) return 0;
    if (end.isBefore(start)) return 0;

    // Calculate working days (Monday to Friday)
    let current = start.clone();
    while (current.isSameOrBefore(end, 'day')) {
      if (current.isoWeekday() <= 5) { // 1-5 = Monday to Friday
        leaveDays++;
      }
      current.add(1, 'day');
    }

    return leaveDays;
  };

  // Get user ID from cache or local storage
  const getUserIdFromCache = async () => {
    try {
      if ("caches" in window) {
        const cache = await caches.open("user-cache");
        const response = await cache.match("userID");
        if (response) {
          const data = await response.json();
          return data.userID;
        }
      }
      return localStorage.getItem("userID");
    } catch (error) {
      console.error("Cache access error:", error);
      return localStorage.getItem("userID");
    }
  };

  // Fetch user ID on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const cachedID = await getUserIdFromCache();
        if (cachedID) {
          setUserID(cachedID);
        } else {
          setError("User not authenticated");
        }
      } catch (error) {
        setError("Failed to fetch user ID");
        console.error("Error retrieving UserID:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch employee data when userID changes
  useEffect(() => {
    if (!userID) return;

    const fetchEmployeeData = async () => {
      setLoading(true);
      setError(null);

      try {
        const empResponse = await axios.get(`${API_BASE_URL}/employees/email/${userID}`);
        
        if (!empResponse.data) {
          throw new Error("No employee data found");
        }

        setEmployeeData(empResponse.data);
        
        // Process leave records
        if (empResponse.data.leaveRequests && Array.isArray(empResponse.data.leaveRequests)) {
          const updatedRecords = empResponse.data.leaveRequests.map(leave => ({
            ...leave,
            days: calculateLeaveDays(leave.fromDate, leave.toDate),
          })).sort((a, b) => moment(b.fromDate) - moment(a.fromDate)); // Sort by most recent first
          
          setLeaveRecords(updatedRecords);
        }
      } catch (error) {
        setError(error.response?.data?.message || error.message || "Error fetching employee data");
        console.error("API Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [userID]);

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="alert alert-danger mt-5">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
      </div>
    );
  }

  return (
    <div className="container mt-5 p-4 shadow rounded bg-light">
      <h2 className="text-center mb-4 text-primary fw-bold">
        <i className="bi bi-calendar-check me-2"></i>
        Leave Tracker
      </h2>

      {/* Leave Overview Cards */}
      <div className="row g-3 mb-4">
        {employeeData ? (
          [
            { key: "totalLeave", label: "Total Leave", icon: "bi-calendar-plus" },
            { key: "availableLeave", label: "Available Leave", icon: "bi-calendar-check" },
            { key: "LOP", label: "Loss of Pay", icon: "bi-calendar-x" },
          ].map(({ key, label, icon }, index) => (
            <div key={index} className="col-md-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body text-center">
                  <h5 className="card-title fw-bold">
                    <i className={`bi ${icon} me-2 text-primary`}></i>
                    {label}
                  </h5>
                  <p className="card-text display-6 text-primary">
                    {employeeData[key] || 0}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-4">
            <p className="text-muted">No employee data available</p>
          </div>
        )}
      </div>

      {/* Information Alert */}
      {employeeData && (
        <div className="alert alert-warning mt-4">
          <strong>
            <i className="bi bi-info-circle-fill me-2"></i>
            Note:
          </strong> 
          <span className="ms-2">
            Approved leaves exceeding available balance will be marked as 
            <span className="fw-bold text-danger"> Loss of Pay (LOP)</span>. 
            Please contact <span className="fw-bold">HR</span> and your 
            <span className="fw-bold"> Manager</span> for any discrepancies.
          </span>
        </div>
      )}

      {/* Leave Records Table */}
      <div className="mt-4">
        <h5 className="mb-3 fw-semibold">
          <i className="bi bi-list-check me-2"></i>
          Leave History
        </h5>
        
        {leaveRecords.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-primary">
                <tr>
                  {["From Date", "To Date", "Type", "Reason", "Status", "Days"].map((header, index) => (
                    <th key={index} className="text-nowrap text-center align-middle">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveRecords.map((leave, index) => (
                  <tr key={index}>
                    <td className="text-nowrap">{moment(leave.fromDate).format("DD MMM YYYY")}</td>
                    <td className="text-nowrap">{moment(leave.toDate).format("DD MMM YYYY")}</td>
                    <td>{leave.leaveType || "N/A"}</td>
                    <td className="text-truncate" style={{ maxWidth: "200px" }} title={leave.reason}>
                      {leave.reason || "N/A"}
                    </td>
                    <td>
                      <span 
                        className={`badge rounded-pill bg-${
                          leave.status === "Approved" ? "success" : 
                          leave.status === "Rejected" ? "danger" : 
                          "warning"
                        }`}
                      >
                        {leave.status || "Pending"}
                      </span>
                    </td>
                    <td className="fw-bold">{leave.days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="alert alert-info text-center">
            <i className="bi bi-calendar-event me-2"></i>
            No leave records found
          </div>
        )}
      </div>
    </div>
  );
}

LeaveTracker.propTypes = {
  // Add prop types if this component receives any props
};

export default LeaveTracker;