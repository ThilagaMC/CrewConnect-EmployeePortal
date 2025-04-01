import "bootstrap/dist/css/bootstrap.min.css";
import { FaCalendarAlt, FaGift, FaFire, FaTree, FaFlag, FaMoon, FaSun } from "react-icons/fa";
import { motion } from "framer-motion";

const publicHolidays2025 = [
  { date: "January 1", day: "Wednesday", name: "New Year's Day", icon: <FaGift className="text-danger" /> },
  { date: "January 14", day: "Tuesday", name: "Pongal", icon: <FaFire className="text-warning" /> },
  { date: "January 15", day: "Wednesday", name: "Thiruvalluvar Day", icon: <FaSun className="text-info" /> },
  { date: "January 16", day: "Thursday", name: "Uzhavar Thirunal", icon: <FaSun className="text-success" /> },
  { date: "January 26", day: "Sunday", name: "Republic Day", icon: <FaFlag className="text-danger" /> },
  { date: "March 31", day: "Monday", name: "Eid al-Fitr (Ramzan)", icon: <FaMoon className="text-primary" /> },
  { date: "April 14", day: "Monday", name: "Tamil New Year & Dr. Ambedkar Jayanti", icon: <FaCalendarAlt className="text-info" /> },
  { date: "April 18", day: "Friday", name: "Good Friday", icon: <FaTree className="text-success" /> },
  { date: "May 1", day: "Thursday", name: "May Day", icon: <FaSun className="text-warning" /> },
  { date: "June 7", day: "Saturday", name: "Eid al-Adha (Bakrid)", icon: <FaFire className="text-danger" /> },
  { date: "July 28", day: "Monday", name: "Muharram", icon: <FaMoon className="text-secondary" /> },
  { date: "August 15", day: "Friday", name: "Independence Day", icon: <FaFlag className="text-danger" /> },
  { date: "September 6", day: "Saturday", name: "Ganesh Chaturthi", icon: <FaTree className="text-primary" /> },
  { date: "October 2", day: "Thursday", name: "Gandhi Jayanti", icon: <FaSun className="text-success" /> },
  { date: "October 3", day: "Friday", name: "Maha Navami", icon: <FaMoon className="text-warning" /> },
  { date: "October 4", day: "Saturday", name: "Vijayadashami (Dussehra)", icon: <FaFire className="text-danger" /> },
  { date: "October 20", day: "Monday", name: "Diwali (Deepavali)", icon: <FaFire className="text-warning" /> },
  { date: "December 25", day: "Thursday", name: "Christmas Day", icon: <FaTree className="text-danger" /> },
];

const PublicHolidays = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="public-holidays-container py-5">
      <div className="container">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-5"
        >
          <h2 className="display-5 fw-bold text-gradient mb-3">
            <span className="text-primary">🎉</span> Public Holidays in India (2025) <span className="text-danger">🎉</span>
          </h2>
          <p className="lead text-muted">Plan your year with these important dates</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="row g-4"
        >
          {publicHolidays2025.map((holiday, index) => (
            <motion.div 
              variants={itemVariants}
              className="col-lg-4 col-md-6 col-sm-12" 
              key={index}
            >
              <div className="card border-0 shadow-sm holiday-card h-100 hover-effect">
                <div className="card-body text-center p-4 d-flex flex-column">
                  <div className="holiday-icon mb-3" style={{ fontSize: "2rem" }}>
                    {holiday.icon}
                  </div>
                  <h5 className="card-title fw-bold mb-3">{holiday.name}</h5>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-center align-items-center">
                      <FaCalendarAlt className="me-2 text-muted" />
                      <span className="text-muted">{holiday.date}</span>
                    </div>
                    <div className="badge bg-light text-dark mt-2 px-3 py-1 rounded-pill">
                      {holiday.day}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-5">
          <div className="badge bg-primary text-white px-4 py-2 rounded-pill">
            Total: {publicHolidays2025.length} Public Holidays
          </div>
        </div>
      </div>

      <style jsx>{`
        .holiday-card {
          border-radius: 15px;
          transition: all 0.3s ease;
          background: white;
          border-top: 4px solid #4361ee;
        }
        .holiday-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .text-gradient {
          background: linear-gradient(45deg, #4361ee, #3a0ca3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        .hover-effect {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .hover-effect:hover {
          border-top-color: #f72585;
        }
      `}</style>
    </div>
  );
};

export default PublicHolidays;