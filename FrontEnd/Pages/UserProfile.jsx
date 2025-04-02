import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./UserProfile.css";

const BASE_URL = "https://crewconnect-employeeportal.onrender.com";
const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userID, setUserID] = useState(null);
  const [editedUser, setEditedUser] = useState({
    username: "",
    email: "",
    image: "",
    dob: "",
    yearOfJoin: "",
    status: "",
    currentPackage: "",
    currentProject: "",
    rating: "",
    motherName: "",
    fatherName: "",
    panNumber: "",
    lastAppraisalDate: "",
    department: "",
    position: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [activeTab, setActiveTab] = useState("profile");

  const getUserIdFromCache = async () => {
    try {
      if ("caches" in window) {
        const cache = await caches.open("user-cache");
        const response = await cache.match("/userID");
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

  const deleteUserId = async () => {
    try {
      if ("caches" in window) {
        const cache = await caches.open("user-cache");
        await cache.delete("/userID");
      }
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        setIsLoading(true);
        const cachedID = await getUserIdFromCache();
        if (cachedID) {
          setUserID(cachedID);
        } else {
          navigate("/login");
        }
      } catch (error) {
        setError("Failed to fetch user ID");
        console.error("Error fetching user ID:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserId();
  }, [navigate]);

  useEffect(() => {
    if (!userID) return;

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${BASE_URL}/employees/email/${userID}`
        );
        setUser(response.data);
        setEditedUser({
          username: response.data.username || "",
          email: response.data.email || "",
          image:
            response.data.image ||
            "https://randomuser.me/api/portraits/lego/1.jpg",
          dob: response.data.dob || "",
          yearOfJoin: response.data.yearOfJoin || "",
          status: response.data.status || "",
          currentPackage: response.data.currentPackage || "",
          currentProject: response.data.currentProject || "",
          rating: response.data.rating || "",
          motherName: response.data.motherName || "",
          fatherName: response.data.fatherName || "",
          panNumber: response.data.panNumber || "",
          lastAppraisalDate: response.data.lastAppraisalDate || "",
          department: response.data.department || "",
          position: response.data.position || "",
          phone: response.data.phone || "",
        });
      } catch (error) {
        setError("Failed to load user data");
        console.error("Error fetching user details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userID]);

  const handleLogout = () => {
    deleteUserId();
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Create an object with only the fields we want to update
      const updateData = {
        ...editedUser,
        email: undefined, // Remove email from update data
      };
      delete updateData.email; // Ensure email isn't sent in the update
      console.log(updateData);

      const response = await axios.put(
        `${BASE_URL}/employees/email/${userID}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setUser(response.data);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      setError("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    try {
      setIsLoading(true);
      await axios.put(`${BASE_URL}/employees/email/${userID}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      alert("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setError(error.response?.data?.message || "Failed to change password");
      console.error("Error changing password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div
            className="spinner-grow text-primary"
            style={{ width: "4rem", height: "4rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fs-5 text-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center">
          <i className="bi bi-exclamation-octagon-fill me-3 fs-4"></i>
          <div className="flex-grow-1">
            <h5 className="alert-heading mb-2">Error loading profile</h5>
            <p className="mb-0">{error}</p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-danger px-4"
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center py-4">
          <i className="bi bi-person-x-fill me-2 fs-4"></i>
          <h4 className="d-inline">No user data available</h4>
          <p className="mt-2">Please try logging in again</p>
          <button
            className="btn btn-warning mt-2"
            onClick={() => navigate("/")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-lg border-0 overflow-hidden">
            {/* Card Header with Gradient Background */}
            <div className="card-header bg-gradient-primary text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <i className="bi bi-person-badge fs-2 me-3"></i>
                  <div>
                    <h3 className="mb-0">Employee Profile</h3>
                    <small className="opacity-75">
                      {user.department || "Employee"} Department
                    </small>
                  </div>
                </div>
                <button
                  className="btn btn-light btn-sm rounded-pill px-3"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </div>
            </div>

            {/* Card Body */}
            <div className="card-body p-0">
              {/* Navigation Tabs */}
              <ul className="nav nav-tabs nav-justified bg-light">
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "profile" ? "active fw-bold" : "text-dark"
                    }`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <i className="bi bi-person-lines-fill me-2"></i>Profile
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "security" ? "active fw-bold" : "text-dark"
                    }`}
                    onClick={() => setActiveTab("security")}
                  >
                    <i className="bi bi-shield-lock me-2"></i>Security
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === "profile" ? (
                  <>
                    <div className="row mb-4">
                      {/* Profile Picture Column */}
                      <div className="col-md-3 text-center">
                        <div className="position-relative mb-3">
                          <div className="profile-picture-container">
                            <img
                              src={
                                editedUser.image ||
                                "https://randomuser.me/api/portraits/lego/1.jpg"
                              }
                              alt="Profile"
                              className="rounded-circle shadow img-fluid profile-picture"
                              onError={(e) => {
                                e.target.src =
                                  "https://randomuser.me/api/portraits/lego/1.jpg";
                              }}
                            />
                          </div>
                        </div>
                        <h4 className="mb-1">{user.username}</h4>
                        <p className="text-muted mb-2">
                          <i className="bi bi-briefcase me-1"></i>
                          {user.position}
                        </p>
                        <div className="d-flex justify-content-center gap-2 mb-3">
                          <span
                            className={`badge rounded-pill ${
                              user.status === "Active"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {user.status || "Unknown"}
                          </span>
                          {user.rating && (
                            <span className="badge rounded-pill bg-warning text-dark">
                              <i className="bi bi-star-fill me-1"></i>
                              {user.rating}/5
                            </span>
                          )}
                        </div>

                        {!isEditing && (
                          <button
                            className="btn btn-outline-primary rounded-pill px-4"
                            onClick={() => setIsEditing(true)}
                          >
                            <i className="bi bi-pencil-square me-2"></i>Edit
                            Profile
                          </button>
                        )}
                      </div>

                      {/* Profile Details Column */}
                      <div className="col-md-9">
                        {isEditing ? (
                          <form onSubmit={handleProfileUpdate}>
                            <div className="row g-3">
                              {/* Personal Information Section */}
                              <div className="col-12">
                                <h5 className="border-bottom pb-2 mb-3 text-primary">
                                  <i className="bi bi-person me-2"></i>
                                  Personal Information
                                </h5>
                              </div>

                              <div className="col-md-6">
                                <label className="form-label">Username</label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-person"></i>
                                  </span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editedUser.username}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        username: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </div>
                              </div>

                              <div className="col-md-6">
                                <label className="form-label">
                                  Profile Image URL
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-link-45deg"></i>
                                  </span>
                                  <input
                                    type="url"
                                    className="form-control"
                                    value={editedUser.image}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        image: e.target.value,
                                      })
                                    }
                                    placeholder="https://example.com/profile.jpg"
                                  />
                                </div>
                              </div>

                              <div className="col-md-6">
                                <label className="form-label">Email</label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-envelope"></i>
                                  </span>
                                  <input
                                    type="email"
                                    className="form-control"
                                    value={editedUser.email}
                                    readOnly
                                    disabled
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">
                                  Date of Birth
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-calendar"></i>
                                  </span>
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={editedUser.dob}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        dob: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">
                                  Phone Number
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-telephone"></i>
                                  </span>
                                  <input
                                    type="tel"
                                    className="form-control"
                                    value={editedUser.phone}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        phone: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">
                                  Mother&apos;s Name
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-gender-female"></i>
                                  </span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editedUser.motherName}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        motherName: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">
                                  Father&apos;s Name
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-gender-male"></i>
                                  </span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editedUser.fatherName}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        fatherName: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">PAN Number</label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-credit-card"></i>
                                  </span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editedUser.panNumber}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        panNumber: e.target.value,
                                      })
                                    }
                                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                    title="Enter valid PAN (e.g., ABCDE1234F)"
                                  />
                                </div>
                              </div>

                              {/* Professional Information Section */}
                              <div className="col-12 mt-4">
                                <h5 className="border-bottom pb-2 mb-3 text-primary">
                                  <i className="bi bi-briefcase me-2"></i>
                                  Professional Information
                                </h5>
                              </div>

                              <div className="col-md-6">
                                <label className="form-label">
                                  Year of Joining
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-calendar-check"></i>
                                  </span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={editedUser.yearOfJoin}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        yearOfJoin: e.target.value,
                                      })
                                    }
                                    min="1900"
                                    max="2099"
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">
                                  Current Package
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-currency-rupee"></i>
                                  </span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editedUser.currentPackage}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        currentPackage: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">
                                  Current Project
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-kanban"></i>
                                  </span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editedUser.currentProject}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        currentProject: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">Rating</label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-star"></i>
                                  </span>
                                  <select
                                    className="form-select"
                                    value={editedUser.rating}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        rating: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="">Select Rating</option>
                                    <option value="1">1 Star</option>
                                    <option value="2">2 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="5">5 Stars</option>
                                  </select>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">
                                  Last Appraisal Date
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-graph-up"></i>
                                  </span>
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={editedUser.lastAppraisalDate}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        lastAppraisalDate: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">Department</label>
                                <span className="input-group-text">
                                  <i className="bi bi-building"></i>
                                </span>
                                <select
                                  className={`form-select input-group`}
                                  name="department"
                                  value={editedUser.department}
                                  onChange={setEditedUser}
                                  required
                                >
                                  <option value="">Select Department</option>
                                  <option value="Engineering">
                                    Engineering
                                  </option>
                                  <option value="HR">HR</option>
                                  <option value="Marketing">Marketing</option>
                                  <option value="Finance">Finance</option>
                                  <option value="Sales">Sales</option>
                                </select>
                                {/* <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-building"></i>
                                  </span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editedUser.department}
                                    onChange={(e) => 
                                      setEditedUser({...editedUser, department: e.target.value})
                                    }
                                  />
                                </div> */}
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">Position</label>
                                <div className="input-group">
                                  <span className="input-group-text">
                                    <i className="bi bi-person-badge"></i>
                                  </span>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editedUser.position}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        position: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="d-flex justify-content-end mt-4 gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-secondary rounded-pill px-4"
                                onClick={() => setIsEditing(false)}
                              >
                                <i className="bi bi-x-lg me-1"></i>Cancel
                              </button>
                              <button
                                type="submit"
                                className="btn btn-primary rounded-pill px-4"
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-1"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-check-lg me-1"></i>Save
                                    Changes
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="row">
                            {/* Personal Information */}
                            <div className="col-md-6">
                              <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-header bg-light">
                                  <h5 className="mb-0">
                                    <i className="bi bi-person-lines-fill text-primary me-2"></i>
                                    Personal Information
                                  </h5>
                                </div>
                                <div className="card-body">
                                  <div className="mb-3">
                                    <div className="d-flex mb-3">
                                      <div className="flex-shrink-0 me-3 text-muted">
                                        <i className="bi bi-person fs-5"></i>
                                      </div>
                                      <div>
                                        <h6 className="mb-0 text-muted">
                                          Username
                                        </h6>
                                        <p className="mb-0 fw-bold">
                                          {user.username}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="d-flex mb-3">
                                      <div className="flex-shrink-0 me-3 text-muted">
                                        <i className="bi bi-envelope fs-5"></i>
                                      </div>
                                      <div>
                                        <h6 className="mb-0 text-muted">
                                          Email
                                        </h6>
                                        <p className="mb-0">
                                          <a
                                            href={`mailto:${user.email}`}
                                            className="text-decoration-none"
                                          >
                                            {user.email}
                                          </a>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="d-flex mb-3">
                                      <div className="flex-shrink-0 me-3 text-muted">
                                        <i className="bi bi-calendar fs-5"></i>
                                      </div>
                                      <div>
                                        <h6 className="mb-0 text-muted">
                                          Date of Birth
                                        </h6>
                                        <p className="mb-0 fw-bold">
                                          {formatDate(user.dob)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="d-flex mb-3">
                                      <div className="flex-shrink-0 me-3 text-muted">
                                        <i className="bi bi-telephone fs-5"></i>
                                      </div>
                                      <div>
                                        <h6 className="mb-0 text-muted">
                                          Phone
                                        </h6>
                                        <p className="mb-0 fw-bold">
                                          {user.phone ? (
                                            <a
                                              href={`tel:${user.phone}`}
                                              className="text-decoration-none"
                                            >
                                              {user.phone}
                                            </a>
                                          ) : (
                                            "Not specified"
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="card border-0 shadow-sm">
                                <div className="card-header bg-light">
                                  <h5 className="mb-0">
                                    <i className="bi bi-people-fill text-primary me-2"></i>
                                    Family Information
                                  </h5>
                                </div>
                                <div className="card-body">
                                  <div className="d-flex mb-3">
                                    <div className="flex-shrink-0 me-3 text-muted">
                                      <i className="bi bi-gender-female fs-5"></i>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-muted">
                                        Mother&apos;s Name
                                      </h6>
                                      <p className="mb-0 fw-bold">
                                        {user.motherName || "Not specified"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex mb-3">
                                    <div className="flex-shrink-0 me-3 text-muted">
                                      <i className="bi bi-gender-male fs-5"></i>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-muted">
                                        Father&apos;s Name
                                      </h6>
                                      <p className="mb-0 fw-bold">
                                        {user.fatherName || "Not specified"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div className="flex-shrink-0 me-3 text-muted">
                                      <i className="bi bi-credit-card fs-5"></i>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-muted">
                                        PAN Number
                                      </h6>
                                      <p className="mb-0 fw-bold">
                                        {user.panNumber || "Not specified"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Professional Information */}
                            <div className="col-md-6">
                              <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-header bg-light">
                                  <h5 className="mb-0">
                                    <i className="bi bi-briefcase-fill text-primary me-2"></i>
                                    Professional Information
                                  </h5>
                                </div>
                                <div className="card-body">
                                  <div className="d-flex mb-3">
                                    <div className="flex-shrink-0 me-3 text-muted">
                                      <i className="bi bi-building fs-5"></i>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-muted">
                                        Department
                                      </h6>
                                      <p className="mb-0 fw-bold">
                                        {user.department || "Not specified"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex mb-3">
                                    <div className="flex-shrink-0 me-3 text-muted">
                                      <i className="bi bi-person-badge fs-5"></i>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-muted">
                                        Position
                                      </h6>
                                      <p className="mb-0 fw-bold">
                                        {user.position || "Not specified"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex mb-3">
                                    <div className="flex-shrink-0 me-3 text-muted">
                                      <i className="bi bi-calendar-check fs-5"></i>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-muted">
                                        Year of Joining
                                      </h6>
                                      <p className="mb-0 fw-bold">
                                        {user.yearOfJoin || "Not specified"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex mb-3">
                                    <div className="flex-shrink-0 me-3 text-muted">
                                      <i className="bi bi-currency-rupee fs-5"></i>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-muted">
                                        Current Package
                                      </h6>
                                      <p className="mb-0 fw-bold">
                                        {formatCurrency(user.currentPackage)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex mb-3">
                                    <div className="flex-shrink-0 me-3 text-muted">
                                      <i className="bi bi-kanban fs-5"></i>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-muted">
                                        Current Project
                                      </h6>
                                      <p className="mb-0 fw-bold">
                                        {user.currentProject || "Not assigned"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div className="flex-shrink-0 me-3 text-muted">
                                      <i className="bi bi-graph-up fs-5"></i>
                                    </div>
                                    <div>
                                      <h6 className="mb-0 text-muted">
                                        Last Appraisal
                                      </h6>
                                      <p className="mb-0 fw-bold">
                                        {formatDate(user.lastAppraisalDate)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="row justify-content-center">
                    <div className="col-md-8">
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-light">
                          <h5 className="mb-0">
                            <i className="bi bi-shield-lock text-primary me-2"></i>
                            Change Password
                          </h5>
                        </div>
                        <div className="card-body">
                          <form onSubmit={handlePasswordChange}>
                            <div className="mb-4">
                              <label className="form-label fw-bold">
                                Current Password
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">
                                  <i className="bi bi-lock"></i>
                                </span>
                                <input
                                  type="password"
                                  className="form-control"
                                  value={passwordData.currentPassword}
                                  onChange={(e) =>
                                    setPasswordData({
                                      ...passwordData,
                                      currentPassword: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="form-label fw-bold">
                                New Password
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">
                                  <i className="bi bi-key"></i>
                                </span>
                                <input
                                  type="password"
                                  className="form-control"
                                  value={passwordData.newPassword}
                                  onChange={(e) =>
                                    setPasswordData({
                                      ...passwordData,
                                      newPassword: e.target.value,
                                    })
                                  }
                                  required
                                  minLength="6"
                                />
                              </div>
                              <div className="form-text text-muted">
                                Password must be at least 6 characters long
                              </div>
                            </div>
                            <div className="mb-4">
                              <label className="form-label fw-bold">
                                Confirm New Password
                              </label>
                              <div className="input-group">
                                <span className="input-group-text">
                                  <i className="bi bi-key-fill"></i>
                                </span>
                                <input
                                  type="password"
                                  className="form-control"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) =>
                                    setPasswordData({
                                      ...passwordData,
                                      confirmPassword: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="btn btn-primary w-100 py-2 rounded-pill"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              ) : (
                                <i className="bi bi-shield-check me-2"></i>
                              )}
                              Update Password
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
