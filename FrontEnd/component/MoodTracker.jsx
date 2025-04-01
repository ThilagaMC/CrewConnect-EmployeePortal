import { useState, useEffect } from 'react';
import PropTypes from "prop-types";
import axios from 'axios';
import { 
  FaRegSmile, FaRegFrown, FaRegMeh, FaRegLaughSquint, 
  FaRegAngry, FaRegFlushed, FaCalendarAlt, FaEdit, 
  FaTrashAlt, FaPlus,
  FaExclamationTriangle
} from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MoodTracker.css';

const BASE_URL='https://crewconnect-employeeportal.onrender.com'

const moodIcons = {
  happy: FaRegSmile,
  sad: FaRegFrown,
  neutral: FaRegMeh,
  excited: FaRegLaughSquint,
  angry: FaRegAngry,
  anxious: FaRegFlushed
};

const moodColors = {
  happy: { bg: 'success', text: 'white' },
  sad: { bg: 'info', text: 'white' },
  neutral: { bg: 'secondary', text: 'white' },
  excited: { bg: 'warning', text: 'dark' },
  angry: { bg: 'danger', text: 'white' },
  anxious: { bg: 'purple', text: 'white' }
};

function MoodTracker({ username, userId }) {
  const [todayMood, setTodayMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(), 
    end: new Date() 
  });
  const [formData, setFormData] = useState({
    mood: 'neutral',
    intensity: 5,
    note: '',
    username,
    userId
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedEntry, setExpandedEntry] = useState(null);

  const moodApi = axios.create({
    baseURL:BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    if (userId) {
      fetchMoods();
    }
  }, [timeRange, userId]);

  const fetchMoods = async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayResponse, historyResponse] = await Promise.all([
        moodApi.get(`${BASE_URL}/moods/today/${userId}`),
        moodApi.get(`${BASE_URL}/moods/${userId}?range=${timeRange}`)
      ]);

      setTodayMood(todayResponse.data.data);
      
      const responseData = Array.isArray(historyResponse.data.data) 
        ? historyResponse.data.data 
        : [];

      const processedHistory = responseData
        .filter(entry => entry && entry.date)
        .map(entry => ({
          ...entry,
          date: new Date(entry.date)
        }));
      
      setMoodHistory(processedHistory);
      
      setDateRange({
        start: new Date(historyResponse.data.startDate),
        end: new Date(historyResponse.data.endDate)
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await moodApi.post(`${BASE_URL}/moods/${userId}`, formData);
      setTodayMood(response.data.data);
      await fetchMoods();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete today\'s mood entry?')) return;
    
    setLoading(true);
    setError(null);
    try {
      await moodApi.delete(`/api/moods/today/${userId}`);
      setTodayMood(null);
      await fetchMoods();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'intensity' ? parseInt(value) : value 
    }));
  };

  const handleApiError = (error) => {
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';
    console.error('API Error:', error);
    setError(errorMessage);
  };

  const formatDisplayDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return '';
    
    const options = { 
      month: 'short', 
      day: 'numeric',
    };
    
    if (date.getFullYear() !== new Date().getFullYear()) {
      options.year = 'numeric';
    }
    
    return date.toLocaleDateString('en-US', options);
  };

  const renderMoodIcon = (mood, size = 20) => {
    const IconComponent = moodIcons[mood] || FaRegMeh;
    return <IconComponent size={size} className="mood-icon" />;
  };

  const renderHistoryEntries = () => {
    if (loading && moodHistory.length === 0) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your history...</p>
        </div>
      );
    }

    if (moodHistory.length === 0) {
      return (
        <div className="text-center py-5">
          {renderMoodIcon('neutral', 48)}
          <h5 className="text-muted">No mood entries found</h5>
          <p className="text-muted">Track your moods to see them here</p>
        </div>
      );
    }

    return (
      <div className="list-group list-group-flush mood-history-list">
        {moodHistory.map(entry => (
          <div 
            key={entry._id || entry.date.getTime()}
            className={`list-group-item border-0 mood-entry ${expandedEntry === entry._id ? 'expanded' : ''}`}
            onClick={() => setExpandedEntry(expandedEntry === entry._id ? null : entry._id)}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <span className={`badge bg-${moodColors[entry.mood].bg} text-${moodColors[entry.mood].text} me-3 d-flex align-items-center mood-badge`}>
                  {renderMoodIcon(entry.mood)}
                </span>
                <div>
                  <div className="fw-medium">
                    {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                  </div>
                  <small className="text-muted">
                    {formatDisplayDate(entry.date)}
                  </small>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <small className="text-muted">{entry.intensity}/10</small>
                </div>
              </div>
            </div>
            {entry.note && (
              <div className={`mt-3 mood-note ${expandedEntry === entry._id ? 'show' : ''}`}>
                <div className="ps-4 border-start border-2 border-light">
                  <p className="mb-0 small">{entry.note}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mood-tracker-container">
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <div className="d-flex align-items-center">
            <FaExclamationTriangle size={18} className="me-2" />
            <div>{error}</div>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="row g-4">
        {/* Today's Mood Card */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header text-white d-flex justify-content-between align-items-center" style={{background:"#4361ee"}}>
              <h2 className="h5 mb-0 d-flex align-items-center">
                <FaCalendarAlt size={20} className="me-2" />
                Today&apos;s Status
              </h2>
              {todayMood && (
                <button 
                  onClick={handleDelete} 
                  className="btn btn-sm btn-outline-light d-flex align-items-center"
                  disabled={loading}
                >
                  <FaTrashAlt size={16} className="me-1" />
                  Delete
                </button>
              )}
            </div>
            <div className="card-body">
              {loading && !todayMood ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading your mood data...</p>
                </div>
              ) : todayMood ? (
                <>
                  <div className="d-flex align-items-center mb-3">
                    <span className={`badge bg-${moodColors[todayMood.mood].bg} text-${moodColors[todayMood.mood].text} fs-6 me-3 d-flex align-items-center`}>
                      {renderMoodIcon(todayMood.mood)}
                      <span className="ms-2">
                        {todayMood.mood.charAt(0).toUpperCase() + todayMood.mood.slice(1)}
                      </span>
                    </span>
                    <div className="progress flex-grow-1" style={{ height: '24px', borderRadius: '12px' }}>
                      <div 
                        className={`progress-bar bg-${moodColors[todayMood.mood].bg}`} 
                        role="progressbar" 
                        style={{ 
                          width: `${todayMood.intensity * 10}%`,
                          borderRadius: '12px'
                        }}
                        aria-valuenow={todayMood.intensity}
                        aria-valuemin="1"
                        aria-valuemax="10"
                      >
                        <span className="fw-medium">{todayMood.intensity}/10</span>
                      </div>
                    </div>
                  </div>
                  {todayMood.note && (
                    <div className="alert alert-light mb-3">
                      <p className="mb-0">{todayMood.note}</p>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setFormData({
                        mood: todayMood.mood,
                        intensity: todayMood.intensity,
                        note: todayMood.note || '',
                        username: todayMood.username,
                        userId: todayMood.userId
                      });
                      setTodayMood(null);
                    }} 
                    className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
                    disabled={loading}
                  >
                    <FaEdit size={16} className="me-2" />
                    Edit Today&apos;s Entry
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-medium">How are you feeling today?</label>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {Object.entries(moodColors).map(([mood, { bg }]) => (
                        <button
                          key={mood}
                          type="button"
                          className={`btn btn-${formData.mood === mood ? bg : 'outline-' + bg} rounded-pill d-flex align-items-center mood-icon-button`}
                          onClick={() => setFormData(prev => ({ ...prev, mood }))}
                        >
                          {renderMoodIcon(mood)}
                          <span className="ms-2">
                            {mood.charAt(0).toUpperCase() + mood.slice(1)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-medium d-flex justify-content-between">
                      <span>Intensity</span>
                      <span className="text-primary fw-bold">{formData.intensity}/10</span>
                    </label>
                    <input
                      type="range"
                      className="form-range mood-intensity-slider"
                      name="intensity"
                      min="1"
                      max="10"
                      value={formData.intensity}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-muted">Low</small>
                      <small className="text-muted">High</small>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="form-label fw-medium">Notes (optional)</label>
                    <textarea
                      name="note"
                      className="form-control mood-note-input"
                      rows="3"
                      value={formData.note}
                      onChange={handleChange}
                      maxLength="200"
                      disabled={loading}
                      placeholder="Add any additional thoughts about your mood..."
                    />
                    <small className="text-muted">{formData.note.length}/200 characters</small>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 fw-medium d-flex align-items-center justify-content-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaPlus size={18} className="me-2" />
                        Save My Mood
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* History Card */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header text-white" style={{background: "#4361ee"}}>
              <div className="d-flex flex-column">
                <h2 className="h5 mb-3 d-flex align-items-center">
                  <FaCalendarAlt size={20} className="me-2" />
                  Mood History - {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} View
                </h2>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-light">
                    {formatDisplayDate(dateRange.start)} - {formatDisplayDate(dateRange.end)}
                  </small>
                  <div className="btn-group btn-group-sm">
                    {['week', 'month'].map((range) => (
                      <button
                        key={range}
                        className={`btn ${timeRange === range ? 'btn-light' : 'btn-outline-light'}`}
                        onClick={() => setTimeRange(range)}
                        disabled={loading}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {renderHistoryEntries()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

MoodTracker.propTypes = {
  username: PropTypes.string,
  userId: PropTypes.string
};

export default MoodTracker;