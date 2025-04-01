import PropTypes from 'prop-types';
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { IonIcon } from "@ionic/react";
import { useNavigate } from "react-router-dom";
import {
  menuOutline,
  gridOutline,
  personOutline,
  readerOutline,
  checkmarkDoneCircleOutline,
  bicycleOutline,
  golfOutline,
  checkboxOutline,
  happyOutline,
  logOutOutline,
  barChartOutline,
  chevronDownOutline,
  chevronUpOutline,
  analyticsOutline,
  happyOutline as moodOutline,
} from "ionicons/icons";
import "./navbar.css";

const Navbar = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveExpanded, setLeaveExpanded] = useState(false);
  const [reportExpanded, setReportExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    document.body.style.overflow = menuOpen ? "auto" : "hidden";
  };

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.style.overflow = "auto";
  };

  const toggleLeaveMenu = () => {
    setLeaveExpanded(!leaveExpanded);
  };

  const toggleReportMenu = () => {
    setReportExpanded(!reportExpanded);
  };

  const menuItems = [
    { path: "/dashboard", icon: gridOutline, label: "Dashboard" },
    { path: "/employees", icon: personOutline, label: "Employees" },
    { path: "/projects", icon: barChartOutline, label: "Projects" },
    { path: "/attendance", icon: checkmarkDoneCircleOutline, label: "Attendance" },
  ];

  const reportMenuItems = [
    { path: "/attendance-report", icon: readerOutline, label: "Attendance Report" },
    { path: "/mood-report", icon: moodOutline, label: "Mood Report" },
  ];

  const leaveMenuItems = [
    { path: "/leave-application", icon: golfOutline, label: "Apply Leave" },
    { path: "/leave-track", icon: golfOutline, label: "Track Leave" },
    { path: "/public-holidays", icon: golfOutline, label: "Public Holidays" },
  ];

  const settingsItems = [
    { path: "/ToDo", icon: checkboxOutline, label: "To Do List" },
    { path: "/profile", icon: happyOutline, label: "Profile" },
  ];

  const deleteUserId = async () => {
    try {
      if ("caches" in window) {
        const cache = await caches.open("user-cache");
        await cache.delete("/userID");
      }
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogout = () => {
    deleteUserId();
    localStorage.removeItem("authToken");
    navigate("/");
  };

  return (
    <>
      {isMobile && (
        <div className="mobile-header">
          <button className="menu-toggle" onClick={toggleMenu}>
            <IonIcon icon={menuOutline} />
          </button>
          <div className="mobile-logo">CrewConnect</div>
        </div>
      )}

      <div className={`sidebar ${isMobile ? "mobile" : ""} ${menuOpen ? "open" : ""}`}>
        {!isMobile && (
          <div className="brand-section">
            <h3>CrewConnect</h3>
          </div>
        )}

        <nav className="nav-container">
          <ul className="nav-links">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? "active" : ""}
                  onClick={isMobile ? closeMenu : undefined}
                >
                  <IonIcon icon={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}

            <li className="report-section">
              <button 
                className={`report-toggle ${reportExpanded ? "expanded" : ""}`}
                onClick={toggleReportMenu}
              >
                <IonIcon icon={analyticsOutline} />
                <span>Reports</span>
                <IonIcon icon={reportExpanded ? chevronUpOutline : chevronDownOutline} />
              </button>
              
              <div className={`report-items ${reportExpanded ? "show" : ""}`}>
                {reportMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`report-item ${location.pathname === item.path ? "active" : ""}`}
                    onClick={isMobile ? closeMenu : undefined}
                  >
                    <IonIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </li>

            <li className="leave-section">
              <button 
                className={`leave-toggle ${leaveExpanded ? "expanded" : ""}`}
                onClick={toggleLeaveMenu}
              >
                <IonIcon icon={bicycleOutline} />
                <span>Leave</span>
                <IonIcon icon={leaveExpanded ? chevronUpOutline : chevronDownOutline} />
              </button>
              
              <div className={`leave-items ${leaveExpanded ? "show" : ""}`}>
                {leaveMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`leave-item ${location.pathname === item.path ? "active" : ""}`}
                    onClick={isMobile ? closeMenu : undefined}
                  >
                    <IonIcon icon={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </li>


            {settingsItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? "active" : ""}
                  onClick={isMobile ? closeMenu : undefined}
                >
                  <IonIcon icon={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}


          </ul>

          <div className="logout-section">
            <button className="logout-btn" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {isMobile && menuOpen && (
        <div className="sidebar-overlay" onClick={closeMenu} />
      )}

      <main className={`main-content ${isMobile && menuOpen ? "menu-open" : ""}`}>
        {children}
      </main>
    </>
  );
};

Navbar.propTypes = {
  children: PropTypes.node,
};

export default Navbar;