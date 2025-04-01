import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LeaveApplication = () => {
  const [formData, setFormData] = useState({
    userID: "",
    username: "",
    email: "",
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const cachedID = await getUserIdFromCache();
      if (cachedID) {
        setFormData((prev) => ({ ...prev, userID: cachedID }));
        try {
          const response = await axios.get(`http://localhost:5000/employees/email/${cachedID}`);
          setFormData((prev) => ({
            ...prev,
            username: response.data.username || "",
            email: response.data.email || "",
          }));
        } catch (error) {
          console.error("Error fetching user details:", error);
          toast.error("Failed to load user details");
        }
      }
    };

    fetchUser();
  }, []);

  const getUserIdFromCache = async () => {
    if ("caches" in window) {
      try {
        const cache = await caches.open("user-cache");
        const response = await cache.match("userID");
        if (response) {
          const data = await response.json();
          return data.userID;
        }
      } catch (error) {
        console.error("Error retrieving UserID from cache:", error);
        toast.error("Error loading your user information");
      }
    }
    return null;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      toast.error("End date cannot be before start date");
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/leave-requests", formData);
      toast.success(response.data.message || "Leave request submitted successfully!");
      setFormData((prev) => ({
        ...prev,
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: "",
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error submitting leave request. Please try again.";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="container py-4 py-lg-5" style={{marginTop:"22px"}}>
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-6">
          <div className="card border-0 shadow-lg overflow-hidden">
            <div className="card-header bg-primary text-white py-3">
              <h2 className="h4 mb-0 text-center fw-bold">
                <i className="bi bi-calendar-plus me-2"></i>
                Leave Application
              </h2>
            </div>
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small mb-1">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-person-fill text-primary"></i>
                    </span>
                    <input 
                      type="text" 
                      name="username" 
                      className="form-control form-control-lg bg-light" 
                      value={formData.username} 
                      readOnly 
                      required 
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small mb-1">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-envelope-fill text-primary"></i>
                    </span>
                    <input 
                      type="email" 
                      name="email" 
                      className="form-control form-control-lg bg-light" 
                      value={formData.email} 
                      readOnly 
                      required 
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small mb-1">Leave Type</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-card-checklist text-primary"></i>
                    </span>
                    <select 
                      name="leaveType" 
                      className="form-select form-select-lg" 
                      value={formData.leaveType} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select Leave Type</option>
                      <option value="Casual">Casual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Earned">Earned Leave</option>
                      <option value="Maternity">Maternity Leave</option>
                      <option value="Paternity">Paternity Leave</option>
                      <option value="Bereavement">Bereavement Leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted small mb-1">From Date</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-calendar-date text-primary"></i>
                      </span>
                      <input 
                        type="date" 
                        name="fromDate" 
                        className="form-control form-control-lg" 
                        value={formData.fromDate} 
                        onChange={handleChange} 
                        min={new Date().toISOString().split('T')[0]} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-muted small mb-1">To Date</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="bi bi-calendar-date text-primary"></i>
                      </span>
                      <input 
                        type="date" 
                        name="toDate" 
                        className="form-control form-control-lg" 
                        value={formData.toDate} 
                        onChange={handleChange} 
                        min={formData.fromDate || new Date().toISOString().split('T')[0]} 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small mb-1">Reason for Leave</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light align-items-start pt-2">
                      <i className="bi bi-chat-left-text text-primary"></i>
                    </span>
                    <textarea 
                      name="reason" 
                      className="form-control form-control-lg" 
                      value={formData.reason} 
                      onChange={handleChange} 
                      rows="4" 
                      placeholder="Please provide details about your leave request..."
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="d-grid mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg py-3 fw-bold shadow-sm"
                    disabled={loading || isSubmitting}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-2"></i>
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="text-center mt-4 text-muted small">
            <p>Need help? Contact HR at <a href="mailto:hr@example.com">hr@example.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplication;