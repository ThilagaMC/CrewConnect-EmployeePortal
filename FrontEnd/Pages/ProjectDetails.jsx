import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";


const BASE_URL ='https://crewconnect-employeeportal.onrender.com'
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

const ProjectManagement = () => {
  // State management
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState({
    name: "",
    description: "",
    startDate: "",
    budget: "",
    resources: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive design handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsResponse, userResponse] = await Promise.all([
          axios.get(`${BASE_URL}/projects`),
          getUserIdFromCache().then((userID) =>
            userID
              ? axios.get(`${BASE_URL}/employees/email/${userID}`)
              : null
          ),
        ]);

        setProjects(
          Array.isArray(projectsResponse.data) ? projectsResponse.data : []
        );

        if (userResponse) {
          setUserRole(userResponse.data.role || "");
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({
      ...prev,
      [name]:
        name === "resources"
          ? value.split(",").map((item) => item.trim())
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userRole !== "Manager") {
      alert("Only admins can manage projects.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/projects/${editingId}`, project);
        setProjects((prev) =>
          prev.map((p) => (p._id === editingId ? { ...p, ...project } : p))
        );
      } else {
        const res = await axios.post(`${BASE_URL}/projects`, project);
        setProjects((prev) => [...prev, res.data]);
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(
        `Failed to ${
          editingId ? "update" : "create"
        } project. Please try again.`
      );
    }
  };

  // Project CRUD operations
  const handleEdit = (id) => {
    if (userRole !== "Manager") {
      alert("Only admins can edit projects.");
      return;
    }

    const selectedProject = projects.find((p) => p._id === id);
    if (!selectedProject) return;

    setProject({
      name: selectedProject.name,
      description: selectedProject.description,
      startDate: new Date(selectedProject.startDate)
        .toISOString()
        .split("T")[0],
      budget: selectedProject.budget,
      resources: Array.isArray(selectedProject.resources)
        ? selectedProject.resources.join(", ")
        : selectedProject.resources,
    });
    setEditingId(id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (userRole !== "Manager") {
      alert("Only admins can delete projects.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      await axios.delete(`${BASE_URL}/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setProject({
      name: "",
      description: "",
      startDate: "",
      budget: "",
      resources: [],
    });
    setEditingId(null);
    setShowModal(false);
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter((project) =>
    Object.values(project).some((value) => {
      if (Array.isArray(value)) {
        return value.some((item) =>
          item.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <h5 className="alert-heading">Error loading data</h5>
              <p>{error}</p>
              <button
                className="btn btn-outline-danger"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header Section */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-primary text-white rounded-top-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              <i className="bi bi-kanban-fill fs-2 me-3"></i>
              <div>
                <h1 className="h3 mb-0">Project Management</h1>
                <p className="mb-0 opacity-75">
                  Track and manage all your projects
                </p>
              </div>
            </div>
            {userRole === "Manager" && (
              <button
                className="btn btn-light btn-lg rounded-pill px-4 py-2"
                onClick={() => setShowModal(true)}
              >
                <i className="bi bi-plus-lg me-2"></i>
                {isMobile ? "New" : "New Project"}
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search projects by name, description, or team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-6 d-flex align-items-center justify-content-md-end">
              <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2">
                <span className="me-2 text-muted">Showing:</span>
                <span className="badge bg-primary rounded-pill">
                  {filteredProjects.length}/{projects.length}
                </span>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="row g-4">
            {filteredProjects.map((project) => (
              <div key={project._id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{project.name}</h5>
                    {userRole === "Manager" && (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-circle p-2"
                          onClick={() => handleEdit(project._id)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-circle p-2"
                          onClick={() => handleDelete(project._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <small className="text-muted">Description</small>
                      <p className="mb-0 text-truncate-2">
                        {project.description}
                      </p>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <small className="text-muted">Start Date</small>
                        <p className="mb-0">
                          <i className="bi bi-calendar3 me-2 text-muted"></i>
                          {new Date(project.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <small className="text-muted">Budget</small>
                        <p className="mb-0">
                          <span className="badge bg-success bg-opacity-10 text-success">
                            ${parseFloat(project.budget).toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <small className="text-muted">Team Members</small>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {Array.isArray(project.resources) ? (
                          project.resources.slice(0, 3).map((member, i) => (
                            <span
                              key={i}
                              className="badge bg-info bg-opacity-10 text-info"
                            >
                              {member}
                            </span>
                          ))
                        ) : (
                          <span className="badge bg-info bg-opacity-10 text-info">
                            {project.resources}
                          </span>
                        )}
                        {Array.isArray(project.resources) && project.resources.length > 3 && (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary">
                            +{project.resources.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="card-footer bg-transparent border-top-0">
                    {userRole === "Manager" ?(<button 
                      className="btn btn-outline-primary w-100"
                      onClick={() => handleEdit(project._id)}
                    >
                      View Details
                    </button>):("")}
                    

                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-folder-x text-muted" style={{ fontSize: "3rem" }}></i>
              <h4 className="mt-3">No projects found</h4>
              <p className="text-muted">Try adjusting your search or create a new project</p>
              {userRole === "Manager" && (
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setShowModal(true)}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Create Project
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Project Modal */}
      {showModal && (
        <div
          className="modal-backdrop fade show"
          onClick={handleCloseModal}
        ></div>
      )}
      <div
        className={`modal fade ${showModal ? "show d-block" : ""}`}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-primary text-white rounded-top-3">
              <h5 className="modal-title">
                <i className="bi bi-kanban me-2"></i>
                {editingId ? "Edit Project" : "New Project"}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleCloseModal}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-bold">Project Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    name="name"
                    value={project.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter project name"
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="4"
                    value={project.description}
                    onChange={handleChange}
                    required
                    placeholder="Describe the project goals and objectives"
                  ></textarea>
                </div>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <label className="form-label fw-bold">Start Date</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-calendar"></i>
                      </span>
                      <input
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={project.startDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Budget ($)</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        name="budget"
                        value={project.budget}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold">Team Members</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-people"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      name="resources"
                      value={project.resources}
                      onChange={handleChange}
                      placeholder="John Doe, Jane Smith, Mike Johnson"
                    />
                  </div>
                  <div className="form-text">Separate names with commas</div>
                </div>
                <div className="d-flex justify-content-end gap-3 mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2 rounded-pill"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 rounded-pill"
                  >
                    {editingId ? (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Save Changes
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-lg me-2"></i>
                        Create Project
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .text-truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1040;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        .card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }

        .badge {
          font-weight: 500;
          padding: 0.35em 0.65em;
        }
      `}</style>
    </div>
  );
};

export default ProjectManagement;