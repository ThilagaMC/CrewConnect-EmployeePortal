import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toast, Badge, Spinner, ButtonGroup, Button } from "react-bootstrap";
import { 
  BsCalendarCheck, 
  BsCalendarX,
  BsEmojiFrown,
  BsEmojiSmile,
  BsEmojiNeutral,
  BsEmojiAngry,
  BsEmojiHeartEyes,
  BsFilter
} from "react-icons/bs";

const API_BASE_URL = 'https://crewconnect-employeeportal.onrender.com';

const OverallMood = () => {
  const [moodRecords, setMoodRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date().toLocaleDateString());
  const [activeFilter, setActiveFilter] = useState('all');

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchMoodRecords = async (filter = 'all') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/moods`, {
        params: { filter: filter === 'all' ? null : filter }
      });
      
      const records = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || []);
      
      setMoodRecords(records);
      setFilteredRecords(records);
      
      if (!records || records.length === 0) {
        showAlert(`No mood records found for ${getFilterLabel(filter)}`, "info");
      }
    } catch (err) {
      showAlert("Failed to fetch mood records. Please try again later.", "danger");
      console.error("Error fetching moods:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoodRecords(activeFilter);
  }, [activeFilter]);

  const getFilterLabel = (filter) => {
    switch(filter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'All Time';
    }
  };

  const moodColors = {
    happy: "success",
    sad: "info",
    neutral: "secondary",
    angry: "danger",
    excited: "warning",
    energetic: "primary",
    frustrated: "danger",
    tired: "warning",
    anxious: "info",
    relieved: "success",
    grateful: "success",
    stressed: "danger",
    calm: "info",
    relaxed: "success"
  };

  const getMoodIcon = (mood) => {
    if (!mood) return <BsEmojiNeutral className="me-1" />;
    
    switch(mood.toLowerCase()) {
      case "happy":
      case "excited":
      case "energetic":
      case "relieved":
      case "grateful":
        return <BsEmojiSmile className="me-1" />;
      case "sad":
      case "anxious":
      case "calm":
        return <BsEmojiFrown className="me-1" />;
      case "neutral":
      case "relaxed":
        return <BsEmojiNeutral className="me-1" />;
      case "angry":
      case "frustrated":
      case "stressed":
        return <BsEmojiAngry className="me-1" />;
      default:
        return <BsEmojiHeartEyes className="me-1" />;
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "No date";
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? "Invalid date" 
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Invalid date";
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
              <h3 className="fw-bold mb-0">Mood Report</h3>
            </div>
            <p className="mb-0 mt-2 opacity-75 small">
              Last updated: {currentDate}
            </p>
          </div>

          {/* Filter Controls */}
          <div className="px-4 pt-3 pb-2 bg-light border-bottom">
            <div className="d-flex align-items-center">
              <BsFilter className="me-2 fs-5" />
              <span className="me-2 fw-medium">Filter:</span>
              <ButtonGroup>
                <Button 
                  variant={activeFilter === 'all' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveFilter('all')}
                >
                  All
                </Button>
                <Button 
                  variant={activeFilter === 'today' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveFilter('today')}
                >
                  Today
                </Button>
                <Button 
                  variant={activeFilter === 'week' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveFilter('week')}
                >
                  This Week
                </Button>
                <Button 
                  variant={activeFilter === 'month' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveFilter('month')}
                >
                  This Month
                </Button>
              </ButtonGroup>
            </div>
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
                <p className="mt-3 fw-medium">Loading mood records...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3 fw-semibold text-center">Date</th>
                      <th className="py-3 fw-semibold text-center">Employee</th>
                      <th className="py-3 fw-semibold text-center">Mood</th>
                      <th className="py-3 fw-semibold text-center">Intensity</th>
                      <th className="py-3 fw-semibold text-center">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record, index) => (
                        <tr 
                          key={index} 
                          className={index % 2 === 0 ? "bg-white" : "bg-light"}
                          style={{ transition: "background-color 0.2s ease" }}
                        >
                          <td className="py-3 text-center fw-medium">
                            {formatDate(record.date)}
                          </td>
                          <td className="py-3 text-center">
                            {record.username || record.UserName || "-"}
                          </td>
                          <td className="py-3 text-center">
                            <Badge 
                              pill 
                              bg={moodColors[record.mood?.toLowerCase()] || "secondary"} 
                              className="px-3 py-2 d-flex align-items-center justify-content-center"
                            >
                              {getMoodIcon(record.mood)}
                              {record.mood ? 
                                record.mood.charAt(0).toUpperCase() + record.mood.slice(1) : 
                                "Unknown"}
                            </Badge>
                          </td>
                          <td className="py-3 text-center fw-medium">
                            {record.intensity ?? "-"}
                          </td>
                          <td className="py-3 text-center">
                            {record.note || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <BsCalendarX className="fs-1 text-muted mb-3" />
                          <h5 className="text-muted">No mood records found for {getFilterLabel(activeFilter)}</h5>
                          <p className="text-muted small mt-2">
                            There are no records to display for this time period
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
          {!loading && filteredRecords.length > 0 && (
            <div 
              className="card-footer bg-light py-3 px-4" 
              style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">
                  Showing <strong>{filteredRecords.length}</strong> records for {getFilterLabel(activeFilter)}
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

export default OverallMood;