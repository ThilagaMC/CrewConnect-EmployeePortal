import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { motion } from "framer-motion";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import axios from "axios";
import MoodTracker from "../component/MoodTracker.jsx";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const BASE_URL='https://crewconnect-employeeportal.onrender.com'
  const today = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingPercentage, setPendingPercentage] = useState(0);
  const [approvedPercentage, setApprovedPercentage] = useState(0);
  const [rejectedPercentage, setRejectedPercentage] = useState(0);
  const [departmentStats, setDepartmentStats] = useState({
    labels: [],
    data: [],
  });
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeUsersCount: 0,
    inactive: 0,
    onLeave: 0,
    pendingRequests: 0,
    birthdays: 0,
  });

  // Get user ID from cache
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

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const cachedID = await getUserIdFromCache();
        if (!cachedID) {
          throw new Error("No user ID found in cache");
        }
        setUserId(cachedID);
      } catch (err) {
        setError(err.message || "Failed to load user data");
        console.error("Error in fetchUserData:", err);
      }
    };

    fetchUserData();
  }, []);

  // Fetch all dashboard data when userId is available
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // API endpoints
        const endpoints = [
          axios.get(`${BASE_URL}/employees/TopRated`),
          axios.get(`${BASE_URL}/employees/email/${userId}`),
          axios.get(`${BASE_URL}/employees`),
          axios.get(`${BASE_URL}/leave-requests/employee/${userId}`),
          axios.get(`${BASE_URL}/todos/filtered/${userId}`),
        ];

        // Fetch all data in parallel
        const [empData, userData, allEmpData, leaveData, todosData] =
          await Promise.all(endpoints);

        // Process leave requests
        const leaveRequests = Array.isArray(leaveData.data?.leaveRequests)
          ? leaveData.data.leaveRequests
          : [];

        // Set basic states
        setEmployees(allEmpData.data.data || []);
        setUser(userData.data);
        setLeaveRequests(leaveRequests);
        setTodos(todosData.data || []);

        // Calculate leave percentages
        if (leaveRequests.length > 0) {
          const total = leaveRequests.length;
          const pending = leaveRequests.filter(
            (l) => l.status === "Pending"
          ).length;
          const approved = leaveRequests.filter(
            (l) => l.status === "Approved"
          ).length;
          const rejected = leaveRequests.filter(
            (l) => l.status === "Rejected"
          ).length;

          setPendingPercentage(((pending / total) * 100).toFixed(2));
          setApprovedPercentage(((approved / total) * 100).toFixed(2));
          setRejectedPercentage(((rejected / total) * 100).toFixed(2));
        }

        // Calculate employee stats

        const allEmployees = allEmpData.data.data || [];
        setEmployees(allEmployees);

        // Calculate employee stats directly from allEmployees instead of employees state
        const activeUsersCount = allEmployees.filter(
          (e) => e.status === "Active"
        ).length;
        const inactiveUsersCount = allEmployees.filter(
          (e) => e.status === "Relieved"
        ).length;
        const birthdays = allEmployees.filter((e) => e.dob === today).length;

        const pending = leaveRequests.filter(
          (l) => l.status === "Pending"
        ).length;
        const onLeave = leaveRequests.filter(
          (l) => l.status === "Approved"
        ).length;

        setStats({
          totalEmployees: allEmployees.length,
          activeUsersCount,
          inactive: inactiveUsersCount,
          onLeave,
          pendingRequests: pending,
          birthdays,
        });

        // Calculate department statistics
        const departmentLabels = [
          "Engineering",
          "HR",
          "Marketing",
          "Sales",
          "Finance",
        ];
        const departmentCounts = departmentLabels.reduce((acc, dept) => {
          acc[dept] = 0;
          return acc;
        }, {});

        (allEmpData.data.data || []).forEach((emp) => {
          if (departmentLabels.includes(emp.department)) {
            departmentCounts[emp.department]++;
          }
        });

        setDepartmentStats({
          labels: departmentLabels,
          data: departmentLabels.map((dept) => departmentCounts[dept]),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Can't get data at this moment. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Calculate working days between two dates
  const calculateWorkingDays = (fromDate, toDate) => {
    if (!fromDate || !toDate) return 0;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start) || isNaN(end)) return 0;

    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // Format date function
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { month: "short", day: "2-digit", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  // Chart data configurations
  const employeeStats = {
    labels: departmentStats.labels,
    datasets: [
      {
        label: "Employees by Department",
        data: departmentStats.data,
        backgroundColor: [
          "rgba(101, 116, 205, 0.7)",
          "rgba(40, 208, 148, 0.7)",
          "rgba(255, 193, 69, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(153, 102, 255, 0.7)",
        ],
        borderColor: [
          "rgba(101, 116, 205, 1)",
          "rgba(40, 208, 148, 1)",
          "rgba(255, 193, 69, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const leaveDistribution = {
    labels: ["Approved", "Pending", "Rejected"],
    datasets: [
      {
        data: [approvedPercentage, pendingPercentage, rejectedPercentage],
        backgroundColor: [
          "rgba(40, 208, 148, 0.7)",
          "rgba(255, 193, 69, 0.7)",
          "rgba(255, 99, 132, 0.7)",
        ],
        borderColor: [
          "rgba(40, 208, 148, 1)",
          "rgba(255, 193, 69, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Loading state
  if (loading) {
    return (
      <div className="container p-2 d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fs-5 text-muted">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mt-5 ps-4 shadow rounded bg-light">
        <div className="text-center p-4 bg-white rounded shadow-sm">
          <i className="bi bi-exclamation-triangle fs-1 text-danger mb-3"></i>
          <h4 className="mb-3">Unable to Load Data</h4>
          <p className="text-muted mb-4">{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container dashboard-container bg-light"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        marginTop: "25px",
      }}
    >
      {/* Main Content */}
      <div className="container py-4">
        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="d-flex align-items-center mb-4 p-4 rounded-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(101, 116, 205, 0.1) 0%, rgba(101, 116, 205, 0.2) 100%)",
            borderLeft: "5px solid #6574cd",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          }}
        >
          <div>
            <h1 className="display-6 fw-bold mb-2" style={{ color: "#2c3e50" }}>
              Workforce Wellness Dashboard
            </h1>
            <p className="mb-0 text-muted">
              <i className="bi bi-calendar-check me-1"></i>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="ms-auto">
            <div className="avatar bg-white p-3 rounded-circle shadow-sm">
              <i
                className="bi bi-graph-up-arrow fs-3"
                style={{ color: "#6574cd" }}
              ></i>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Metrics */}
        <div className="row mb-4">
          {/* Active Employees Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            }}
            className="col-xl-3 col-md-6 mb-4"
          >
            <div
              className="card border-0 h-100 shadow-sm rounded-3"
              style={{
                borderLeft: "4px solid #6574cd",
                background:
                  "linear-gradient(to right, rgba(101, 116, 205, 0.05) 0%, rgba(101, 116, 205, 0.01) 100%)",
              }}
            >
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col">
                    <h6 className="text-uppercase text-muted mb-2 small fw-bold">
                      Active Employees
                    </h6>
                    <h3 className="mb-0 fw-bold" style={{ color: "#6574cd" }}>
                      {stats.activeUsersCount}
                    </h3>
                    <p className="mb-0 small text-muted">
                      +2.5% from last month
                    </p>
                  </div>
                  <div className="col-auto">
                    <div
                      className="icon-shape rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "rgba(101, 116, 205, 0.2)",
                      }}
                    >
                      <i
                        className="bi bi-people fs-4"
                        style={{ color: "#6574cd" }}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Relieved Employees Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            }}
            className="col-xl-3 col-md-6 mb-4"
          >
            <div
              className="card border-0 h-100 shadow-sm rounded-3"
              style={{
                borderLeft: "4px solid #28d094",
                background:
                  "linear-gradient(to right, rgba(40, 208, 148, 0.05) 0%, rgba(40, 208, 148, 0.01) 100%)",
              }}
            >
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col">
                    <h6 className="text-uppercase text-muted mb-2 small fw-bold">
                      Relieved Employees
                    </h6>
                    <h3 className="mb-0 fw-bold" style={{ color: "#28d094" }}>
                      {stats.inactive}
                    </h3>
                    <p className="mb-0 small text-muted">
                      -1.2% from last year
                    </p>
                  </div>
                  <div className="col-auto">
                    <div
                      className="icon-shape rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "rgba(40, 208, 148, 0.2)",
                      }}
                    >
                      <i
                        className="bi bi-calendar-x fs-4"
                        style={{ color: "#28d094" }}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pending Leave Requests Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            }}
            className="col-xl-3 col-md-6 mb-4"
          >
            <div
              className="card border-0 h-100 shadow-sm rounded-3"
              style={{
                borderLeft: "4px solid #ffc145",
                background:
                  "linear-gradient(to right, rgba(255, 193, 69, 0.05) 0%, rgba(255, 193, 69, 0.01) 100%)",
              }}
            >
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col">
                    <h6 className="text-uppercase text-muted mb-2 small fw-bold">
                      Pending Leave Requests
                    </h6>
                    <h3 className="mb-0 fw-bold" style={{ color: "#ffc145" }}>
                      {stats.pendingRequests}
                    </h3>
                    <p className="mb-0 small text-muted">
                      +3.8% from yesterday
                    </p>
                  </div>
                  <div className="col-auto">
                    <div
                      className="icon-shape rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "rgba(255, 193, 69, 0.2)",
                      }}
                    >
                      <i
                        className="bi bi-hourglass-split fs-4"
                        style={{ color: "#ffc145" }}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Birthdays Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            }}
            className="col-xl-3 col-md-6 mb-4"
          >
            <div
              className="card border-0 h-100 shadow-sm rounded-3"
              style={{
                borderLeft: "4px solid #5b7cff",
                background:
                  "linear-gradient(to right, rgba(91, 124, 255, 0.05) 0%, rgba(91, 124, 255, 0.01) 100%)",
              }}
            >
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col">
                    <h6 className="text-uppercase text-muted mb-2 small fw-bold">
                      Birthdays
                    </h6>
                    <h3 className="mb-0 fw-bold" style={{ color: "#5b7cff" }}>
                      {stats.birthdays}
                    </h3>
                    <p className="text-muted small mb-0">
                      <i className="bi bi-gift me-1"></i> {today}
                    </p>
                  </div>
                  <div className="col-auto">
                    <div
                      className="icon-shape rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "rgba(91, 124, 255, 0.2)",
                      }}
                    >
                      <i
                        className="bi bi-gift fs-4"
                        style={{ color: "#5b7cff" }}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="row mb-4">
          {/* Employee Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="col-lg-8 mb-4"
          >
            <div className="card shadow-sm h-100 border-0 rounded-3 overflow-hidden">
              <div className="card-header bg-white border-bottom-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-dark fw-bold">
                  <i
                    className="bi bi-bar-chart me-2"
                    style={{ color: "#6574cd" }}
                  ></i>
                  Employee Distribution
                </h5>
              </div>
              <div className="card-body pt-0">
                <div className="chart-container" style={{ height: "300px" }}>
                  {departmentStats.labels.length > 0 ? (
                    <Bar
                      data={employeeStats}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top",
                            labels: {
                              color: "#6c757d",
                              font: {
                                family: "'Inter', sans-serif",
                                weight: "500",
                              },
                            },
                          },
                          tooltip: {
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            titleFont: {
                              size: 14,
                              weight: "bold",
                            },
                            bodyFont: {
                              size: 12,
                            },
                            callbacks: {
                              label: function (context) {
                                return `${context.dataset.label}: ${context.raw}`;
                              },
                            },
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: "rgba(0, 0, 0, 0.05)",
                            },
                            ticks: {
                              color: "#6c757d",
                              precision: 0,
                              font: {
                                family: "'Inter', sans-serif",
                              },
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                            ticks: {
                              color: "#6c757d",
                              font: {
                                family: "'Inter', sans-serif",
                              },
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <p className="text-muted">No department data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Leave Status Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="col-lg-4 mb-4"
          >
            <div className="card shadow-sm h-100 border-0 rounded-3 overflow-hidden">
              <div className="card-header bg-white border-bottom-0 py-3">
                <h5 className="mb-0 text-dark fw-bold">
                  <i
                    className="bi bi-pie-chart me-2"
                    style={{ color: "#6574cd" }}
                  ></i>
                  Leave Status
                </h5>
              </div>
              <div className="card-body pt-0 d-flex flex-column">
                <div className="chart-container" style={{ height: "250px" }}>
                  {leaveRequests.length > 0 ? (
                    <Pie
                      data={leaveDistribution}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              color: "#6c757d",
                              font: {
                                family: "'Inter', sans-serif",
                                weight: "500",
                              },
                              padding: 20,
                            },
                          },
                          tooltip: {
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            titleFont: {
                              size: 14,
                              weight: "bold",
                            },
                            bodyFont: {
                              size: 12,
                            },
                            callbacks: {
                              label: function (context) {
                                return `${context.label}: ${context.raw}%`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <p className="text-muted">No leave data available</p>
                    </div>
                  )}
                </div>
                {leaveRequests.length > 0 && (
                  <div className="mt-auto pt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="d-flex align-items-center">
                        <span className="badge-dot bg-success me-2"></span>
                        <span>Approved</span>
                      </span>
                      <span className="fw-bold">{approvedPercentage}%</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="d-flex align-items-center">
                        <span className="badge-dot bg-warning me-2"></span>
                        <span>Pending</span>
                      </span>
                      <span className="fw-bold">{pendingPercentage}%</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="d-flex align-items-center">
                        <span className="badge-dot bg-danger me-2"></span>
                        <span>Rejected</span>
                      </span>
                      <span className="fw-bold">{rejectedPercentage}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mood History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden"
        >
          <div className="card-header bg-white border-bottom-0 py-3">
            <h5 className="mb-0 text-dark fw-bold">
              <i
                className="bi bi-emoji-smile me-2"
                style={{ color: "#6574cd" }}
              ></i>
              Mood Tracker
            </h5>
          </div>
          <div className="card-body">
            {user && <MoodTracker username={user.username} userId={user.id} />}
          </div>
        </motion.div>

        {/* Employee and Events Row */}
        <div className="row mb-4">
          {/* Top Performers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-lg-6 mb-4"
          >
            <div className="card shadow-sm h-100 border-0 rounded-3 overflow-hidden">
              <div className="card-header bg-white border-bottom-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-dark fw-bold">
                  <i
                    className="bi bi-trophy me-2"
                    style={{ color: "#ffc145" }}
                  ></i>
                  Top Performers
                </h5>
              </div>
              <div className="card-body pt-0">
                {employees.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="border-top-0 ps-3">Employee</th>
                          <th className="border-top-0">Department</th>
                          <th className="border-top-0">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees
                          .sort((a, b) => b.rating - a.rating)
                          .slice(0, 5)
                          .map((emp) => (
                            <motion.tr
                              key={emp.id || emp._id}
                              whileHover={{
                                backgroundColor: "rgba(101, 116, 205, 0.05)",
                              }}
                            >
                              <td className="ps-3">
                                <div className="d-flex align-items-center">
                                  <div className="avatar me-3">
                                    <div
                                      className="rounded-circle bg-light d-flex align-items-center justify-content-center shadow-sm"
                                      style={{
                                        width: "40px",
                                        height: "40px",
                                        backgroundColor:
                                          "rgba(101, 116, 205, 0.1)",
                                      }}
                                    >
                                      <i
                                        className="bi bi-person-circle fs-5"
                                        style={{ color: "#6574cd" }}
                                      ></i>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="fw-bold">
                                      {emp.username}
                                    </div>
                                    <small className="text-muted">
                                      {emp.role}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge rounded-pill bg-light text-dark">
                                  {emp.department}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div
                                    className="progress progress-sm me-2"
                                    style={{ width: "80px", height: "6px" }}
                                  >
                                    <div
                                      className="progress-bar"
                                      role="progressbar"
                                      style={{
                                        width: `${(emp.rating / 5) * 100}%`,
                                        backgroundColor:
                                          emp.rating >= 4.5
                                            ? "#28d094"
                                            : emp.rating >= 4.0
                                            ? "#5b7cff"
                                            : "#ffc145",
                                      }}
                                      aria-valuenow={emp.rating}
                                      aria-valuemin="0"
                                      aria-valuemax="5"
                                    ></div>
                                  </div>
                                  <span className="fw-bold">{emp.rating}</span>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">No employee data available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* My Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-lg-6 mb-4"
          >
            <div className="card shadow-sm h-100 border-0 rounded-3 overflow-hidden">
              <div className="card-header bg-white border-bottom-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-dark fw-bold">
                  <i
                    className="bi bi-list-check me-2"
                    style={{ color: "#6574cd" }}
                  ></i>
                  My Tasks - High Priority and Critical
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {todos?.success &&
                  Array.isArray(todos.data) &&
                  todos.data.length > 0 ? (
                    todos.data.map((todo) => (
                      <motion.div
                        key={todo._id}
                        className="list-group-item border-0 py-3 px-4"
                        whileHover={{
                          backgroundColor: "rgba(101, 116, 205, 0.05)",
                        }}
                      >
                        <div className="d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex flex-wrap align-items-center gap-2">
                              {/* Priority Badge */}
                              <div
                                className={`badge rounded-pill ${
                                  todo.priority === "critical"
                                    ? "bg-danger"
                                    : todo.priority === "high"
                                    ? "bg-warning"
                                    : "bg-info"
                                }`}
                              >
                                {todo.priority.toUpperCase()}
                              </div>

                              {/* Category Badge */}
                              <div
                                className={`badge rounded-pill ${
                                  todo.category === "Meeting"
                                    ? "bg-primary"
                                    : todo.category === "Training"
                                    ? "bg-success"
                                    : "bg-secondary"
                                }`}
                              >
                                {todo.category}
                              </div>

                              {/* Status Badge */}
                              <small
                                className={`badge ms-auto ${
                                  todo.status === "in-progress"
                                    ? "bg-primary"
                                    : todo.status === "completed"
                                    ? "bg-success"
                                    : todo.status === "on-hold"
                                    ? "bg-warning"
                                    : "bg-secondary"
                                }`}
                              >
                                {todo.status.replace("-", " ")}
                              </small>
                            </div>
                          </div>

                          <h6 className="mb-2 fw-bold">{todo.title}</h6>

                          {todo.description && (
                            <p className="mb-2 small text-muted">
                              {todo.description}
                            </p>
                          )}

                          <div className="d-flex flex-wrap gap-3 align-items-center">
                            {/* Date Range */}
                            <small className="text-muted">
                              <i className="bi bi-calendar me-1"></i>
                              {new Date(todo.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                              {new Date(todo.startDate).toDateString() !==
                                new Date(todo.endDate).toDateString() && (
                                <>
                                  {" - "}
                                  {new Date(todo.endDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </>
                              )}
                            </small>

                            {/* Time Range */}
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {new Date(todo.startDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(todo.endDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          </div>

                          {/* Estimated Hours */}
                          {todo.estimatedHours && (
                            <small className="text-muted">
                              <i className="bi bi-hourglass me-1"></i>
                              {todo.estimatedHours}{" "}
                              {todo.estimatedHours === 1 ? "hour" : "hours"}
                            </small>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="list-group-item border-0 py-5 text-center text-muted">
                      <i className="bi bi-inbox fs-1"></i>
                      <p className="mt-2 mb-0">No todos found</p>
                      {!todos?.success && (
                        <small className="text-danger">
                          Failed to load todos
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Links and Leave Requests */}
        <div className="row">
          {/* Quick Links & Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-12 col-lg-6 mb-4"
          >
            <div className="card shadow-sm h-100 border-0 rounded-3 overflow-hidden">
              <div className="card-header bg-white border-bottom-0 py-3">
                <h5 className="mb-0 text-dark fw-bold">
                  <i
                    className="bi bi-link-45deg me-2"
                    style={{ color: "#6574cd" }}
                  ></i>
                  Quick Links & Contacts
                </h5>
              </div>
              <div className="card-body pt-0">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="p-2 p-sm-3 bg-light rounded-3 h-100">
                      <h6 className="text-uppercase text-muted mb-2 mb-sm-3 fw-bold small">
                        Quick Access
                      </h6>
                      <div className="d-grid gap-1 gap-sm-2">
                        <motion.a
                          whileHover={{ x: 5 }}
                          href="#"
                          className="btn btn-outline-primary btn-sm text-start rounded-pill px-2 px-sm-3 py-1 py-sm-2 d-flex align-items-center"
                        >
                          <i className="bi bi-file-earmark-text me-2 fs-6"></i>
                          <span className="text-truncate">Documentation</span>
                        </motion.a>
                        <motion.a
                          whileHover={{ x: 5 }}
                          href="#"
                          className="btn btn-outline-primary btn-sm text-start rounded-pill px-2 px-sm-3 py-1 py-sm-2 d-flex align-items-center"
                        >
                          <i className="bi bi-calendar-event me-2 fs-6"></i>
                          <span className="text-truncate">Calendar</span>
                        </motion.a>
                        <motion.a
                          whileHover={{ x: 5 }}
                          href="#"
                          className="btn btn-outline-primary btn-sm text-start rounded-pill px-2 px-sm-3 py-1 py-sm-2 d-flex align-items-center"
                        >
                          <i className="bi bi-people me-2 fs-6"></i>
                          <span className="text-truncate">Team Directory</span>
                        </motion.a>
                        <motion.a
                          whileHover={{ x: 5 }}
                          href="#"
                          className="btn btn-outline-primary btn-sm text-start rounded-pill px-2 px-sm-3 py-1 py-sm-2 d-flex align-items-center"
                        >
                          <i className="bi bi-graph-up me-2 fs-6"></i>
                          <span className="text-truncate">Analytics</span>
                        </motion.a>
                        <motion.a
                          whileHover={{ x: 5 }}
                          href="#"
                          className="btn btn-outline-primary btn-sm text-start rounded-pill px-2 px-sm-3 py-1 py-sm-2 d-flex align-items-center"
                        >
                          <i className="bi bi-gear me-2 fs-6"></i>
                          <span className="text-truncate">Settings</span>
                        </motion.a>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6 mt-3 mt-md-0">
                    <div className="p-2 p-sm-3 bg-light rounded-3 h-100">
                      <h6 className="text-uppercase text-muted mb-2 mb-sm-3 fw-bold small">
                        Contact Support
                      </h6>
                      <ul className="list-unstyled mb-3 mb-sm-4">
                        <li className="mb-2 mb-sm-3 d-flex align-items-start">
                          <div className="icon-circle bg-primary-light text-primary me-2 me-sm-3 flex-shrink-0">
                            <i className="bi bi-envelope fs-5"></i>
                          </div>
                          <div className="w-100">
                            <small className="text-muted d-block">Email</small>
                            <a
                              href="mailto:support@example.com"
                              className="text-decoration-none text-truncate d-block"
                            >
                              support@example.com
                            </a>
                          </div>
                        </li>
                        <li className="mb-2 mb-sm-3 d-flex align-items-start">
                          <div className="icon-circle bg-primary-light text-primary me-2 me-sm-3 flex-shrink-0">
                            <i className="bi bi-telephone fs-5"></i>
                          </div>
                          <div className="w-100">
                            <small className="text-muted d-block">Phone</small>
                            <a
                              href="tel:+15551234567"
                              className="text-decoration-none text-truncate d-block"
                            >
                              +1 (555) 123-4567
                            </a>
                          </div>
                        </li>
                        <li className="d-flex align-items-start">
                          <div className="icon-circle bg-primary-light text-primary me-2 me-sm-3 flex-shrink-0">
                            <i className="bi bi-geo-alt fs-5"></i>
                          </div>
                          <div className="w-100">
                            <small className="text-muted d-block">
                              Address
                            </small>
                            <span className="text-truncate d-block">
                              123 Main St, City
                            </span>
                          </div>
                        </li>
                      </ul>

                      <div className="mt-3 mt-sm-4">
                        <h6 className="text-uppercase text-muted mb-2 mb-sm-3 fw-bold small">
                          Follow Us
                        </h6>
                        <div className="d-flex gap-1 gap-sm-2 flex-wrap">
                          <motion.a
                            whileHover={{ y: -3 }}
                            href="#"
                            className="btn btn-icon btn-sm btn-outline-primary rounded-circle"
                          >
                            <i className="bi bi-facebook"></i>
                          </motion.a>
                          <motion.a
                            whileHover={{ y: -3 }}
                            href="#"
                            className="btn btn-icon btn-sm btn-outline-primary rounded-circle"
                          >
                            <i className="bi bi-twitter-x"></i>
                          </motion.a>
                          <motion.a
                            whileHover={{ y: -3 }}
                            href="#"
                            className="btn btn-icon btn-sm btn-outline-primary rounded-circle"
                          >
                            <i className="bi bi-linkedin"></i>
                          </motion.a>
                          <motion.a
                            whileHover={{ y: -3 }}
                            href="#"
                            className="btn btn-icon btn-sm btn-outline-primary rounded-circle"
                          >
                            <i className="bi bi-instagram"></i>
                          </motion.a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pending Leave Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-lg-6 mb-4"
          >
            <div className="card shadow-sm h-100 border-0 rounded-3 overflow-hidden">
              <div className="card-header bg-white border-bottom-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-dark fw-bold">
                  <i
                    className="bi bi-hourglass-split me-2"
                    style={{ color: "#ffc145" }}
                  ></i>
                  Pending Leave Requests
                </h5>
                <span className="badge rounded-pill bg-danger">
                  {stats.pendingRequests}
                </span>
              </div>
              <div className="card-body pt-0">
                {leaveRequests.filter((req) => req.status === "Pending")
                  .length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th className="border-top-0 ps-3">Type</th>
                          <th className="border-top-0">From Date</th>
                          <th className="border-top-0">To Date</th>
                          <th className="border-top-0">Days</th>
                          <th className="border-top-0 pe-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveRequests
                          .filter((req) => req.status === "Pending")
                          .map((leave) => (
                            <motion.tr
                              key={leave.id || leave._id}
                              whileHover={{
                                backgroundColor: "rgba(101, 116, 205, 0.05)",
                              }}
                            >
                              <td className="ps-3">
                                {leave.leaveType || leave.type}
                              </td>
                              <td>{formatDate(leave.fromDate)}</td>
                              <td>{formatDate(leave.toDate)}</td>
                              <td>
                                {calculateWorkingDays(
                                  leave.fromDate,
                                  leave.toDate
                                )}
                              </td>
                              <td className="pe-3">
                                <span className="badge rounded-pill bg-warning text-dark">
                                  Pending
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">No pending leave requests</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .dashboard-container {
          font-family: "Inter", sans-serif;
        }
        .card {
          transition: all 0.3s ease;
          border: none;
        }
        .card-header {
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        .icon-shape {
          transition: transform 0.3s ease;
        }
        .badge-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .avatar {
          transition: transform 0.3s ease;
        }
        .avatar:hover {
          transform: scale(1.1);
        }
        .icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-primary-light {
          background-color: rgba(101, 116, 205, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
