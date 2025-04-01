import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import AuthPage from "./Login";
import Navbar from "./navbar";
import ProtectedRoute from "./ProtectedRoute";
import OverallAttendance from "../Pages/OverallAttendance";
import Employee from "../Pages/Employee";
import Dashboard from "../Pages/DashBoard";
import Attendance from "../Pages/Attendance";
import ProjectManagement from "../Pages/ProjectDetails";
import LeaveTracking from "../Pages/TrackLeave";
import EmployeeTodoList from "../Pages/ToDo";
import LeaveApplication from "../Pages/LeaveApplication";
import AccessDeniedPage from "../Pages/AccessDenied";
import UserProfile from "../Pages/UserProfile";
import VerifyEmail from "../Pages/verifyEmail";
import PublicHolidays from "../Pages/PublicHolidays";
import LeaveRejectSuccess from "../component/LeaveUpdateReject";
import "bootstrap/dist/css/bootstrap.min.css";
import PasswordResetVerifyPage from "../Pages/PasswordResetVerifyPage ";
import PasswordResetPage from "../Pages/password-Reset";
import LeaveUpdateSuccess from "../component/LeaveUpdateSuccess";
import ActionHandler from "../component/ActionHandler";
import ErrorPage from "../component/ErrorPage";
import OverallMood from "../Pages/OverallMoodTracker";
import axios from "axios";

const App = () => {
  const [userID, setUserID] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const cachedID = await getUserIdFromCache();
        if (cachedID) {
          setUserID(cachedID);
        }
      } catch (error) {
        console.error("Error retrieving UserID:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (userID) {
      const fetchEmployeeData = async () => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/employees/email/${userID}`
          );
          setEmployeeData(response.data);
        } catch (error) {
          console.error("Can't fetch user details:", error);
        }
      };
      fetchEmployeeData();
    }
  }, [userID, API_BASE_URL]);

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
        console.error("Cache retrieval error:", error);
      }
    }
    return null;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/password-reset/verify" element={< PasswordResetVerifyPage/>} />

        <Route path="/leave/action" element={<ActionHandler />} />
        <Route path="/leave/error" element={<ErrorPage />} />


        <Route
          path="/leave/success/approved"
          element={<LeaveUpdateSuccess />}
        />
        <Route
          path="/leave/success/rejected"
          element={<LeaveRejectSuccess />}
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Navbar>
                <div
                  className="container-fluid"
                  style={{
                    backgroundColor: "#D9ECF5",
                    minHeight: "100vh",
                    padding: "20px",
                  }}
                >
                  {employeeData && (
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/employees" element={<Employee />} />

                      {["HR", "Admin"].includes(employeeData.role) ? (
                        <>
                          <Route
                            path="/attendance-report"
                            element={<OverallAttendance />}
                          />
                        </>
                      ) : (
                        <Route
                          path="/attendance-report"
                          element={<AccessDeniedPage />}
                        />
                      )}

                      {["HR", "Admin"].includes(employeeData.role) ? (
                        <>
                          <Route
                            path="/mood-report"
                            element={<OverallMood />}
                          />
                        </>
                      ) : (
                        <Route
                          path="/mood-report"
                          element={<AccessDeniedPage />}
                        />
                      )}

                      <Route path="/projects" element={<ProjectManagement />} />
                      <Route path="/orders" element={<Order />} />
                      <Route
                        path="/public-holidays"
                        element={<PublicHolidays />}
                      />
                      <Route path="/leave-track" element={<LeaveTracking />} />
                      <Route path="/ToDo" element={<EmployeeTodoList />} />
                      <Route
                        path="/leave-application"
                        element={<LeaveApplication />}
                      />
                      <Route path="/profile" element={<UserProfile />} />
                      <Route path="/Attendance" element={<Attendance />} />
                    </Routes>
                  )}
                </div>
              </Navbar>
            </ProtectedRoute>
          }
        />
                    <Route path="*" element={"Page Not Found"} />

      </Routes>
    </Router>
  );
};

export default App;
