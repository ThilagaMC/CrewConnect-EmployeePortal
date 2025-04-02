import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Employee.css";
import { format } from 'date-fns';

const UserList = () => {
  const BASE_URL='https://crewconnect-employeeportal.onrender.com'
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    // imgURL: "",
    dob: null,
    yearOfJoin: null,
    status: "Active",
    currentPackage: null,
    currentProject: "",
    rating: null,
    motherName: "",
    fatherName: "",
    panNumber: "",
    lastAppraisalDate: null,
    department: "",
    position: "",
    phone: "",
    totalLeave: 25,
    availableLeave: 25,
    completedLeave: 0,
    role: "User",
    checkedIn: false,
    imgURL: "https://randomuser.me/api/portraits/lego/1.jpg",
    LOP: 0,
    isActive: true,
    leaveRequests: []
  });

  // Get user ID from cache
  const getUserIdFromCache = async () => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('user-cache');
        const response = await cache.match('userID');
        if (response) {
          const data = await response.json();
          setUserId(data.userID);
          return data.userID;
        }
      } catch (error) {
        console.error('Cache retrieval error:', error);
      }
    }
    return null;
  };

  // Fetch all data including user role
  const fetchAllData = async (userId) => {
    try {
      setLoading(true);
      
      // Fetch employees
      const empResponse = await axios.get(`${BASE_URL}/employees`);
      let employeesArray = [];
      
      if (Array.isArray(empResponse.data)) {
        employeesArray = empResponse.data;
      } 
      else if (empResponse.data && Array.isArray(empResponse.data.employees)) {
        employeesArray = empResponse.data.employees;
      }
      else if (empResponse.data && Array.isArray(empResponse.data.data)) {
        employeesArray = empResponse.data.data;
      }
      else if (empResponse.data && typeof empResponse.data === 'object') {
        employeesArray = [empResponse.data];
      }
      
      setEmployees(employeesArray);
      
      // Fetch user role if userId exists
      if (userId) {
        try {
          const userResponse = await axios.get(`${BASE_URL}/employees/email/${userId}`);
          setUserRole(userResponse.data.role);
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      const id = await getUserIdFromCache();
      await fetchAllData(id);
    };
    initializeData();
  }, []);

  // Refresh data function
  const refreshData = async () => {
    const id = await getUserIdFromCache();
    await fetchAllData(id);
  };

  // Validation functions
  const validate = (fieldName, value) => {
    const newErrors = { ...errors };
    
    switch (fieldName) {
      case 'username':
        if (!value.trim()) newErrors.username = 'Full name is required';
        else if (value.trim().length < 2) newErrors.username = 'Name must be at least 2 characters';
        else delete newErrors.username;
        break;
        
      case 'email':
        if (!value) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'Invalid email format';
        else delete newErrors.email;
        break;
        
      case 'phone':
        if (value && !/^[0-9]{10,15}$/.test(value)) newErrors.phone = 'Invalid phone number';
        else delete newErrors.phone;
        break;
        
      case 'dob':
        if (value) {
          const dobDate = new Date(value);
          const age = new Date().getFullYear() - dobDate.getFullYear();
          if (age < 18) newErrors.dob = 'Employee must be at least 18 years old';
          else delete newErrors.dob;
        }
        break;
        
      case 'position':
        if (!value.trim()) newErrors.position = 'Position is required';
        else delete newErrors.position;
        break;
        
      case 'department':
        if (!value) newErrors.department = 'Department is required';
        else delete newErrors.department;
        break;
        
      case 'role':
        if (!['Admin', 'User', 'Manager', 'HR'].includes(value)) newErrors.role = 'Invalid role';
        else delete newErrors.role;
        break;
        
      case 'yearOfJoin':
        if (value && (value < 2000 || value > new Date().getFullYear())) {
          newErrors.yearOfJoin = `Year must be between 2000 and ${new Date().getFullYear()}`;
        } else delete newErrors.yearOfJoin;
        break;
        
      case 'currentPackage':
        if (value && value < 0) newErrors.currentPackage = 'Salary cannot be negative';
        else delete newErrors.currentPackage;
        break;
        
      case 'totalLeave':
      case 'availableLeave':
      case 'completedLeave':
      case 'LOP':
        if (value < 0) newErrors[fieldName] = 'Cannot be negative';
        else delete newErrors[fieldName];
        break;
        
      case 'panNumber':
        if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
          newErrors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
        } else delete newErrors.panNumber;
        break;
        
      case 'rating':
        if (value && (value < 1 || value > 5)) {
          newErrors.rating = 'Rating must be between 1 and 5';
        } else delete newErrors.rating;
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    validate('username', formData.username);
    validate('email', formData.email);
    validate('position', formData.position);
    validate('department', formData.department);
    validate('role', formData.role);
    
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    validate(name, value);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setFormData({
      username: "",
      email: "",
      // imgURL: "",
      dob: null,
      yearOfJoin: null,
      status: "Active",
      currentPackage: null,
      currentProject: "",
      rating: null,
      motherName: "",
      fatherName: "",
      panNumber: "",
      lastAppraisalDate: null,
      department: "",
      position: "",
      phone: "",
      totalLeave: 25,
      availableLeave: 25,
      completedLeave: 0,
      role: "User",
      checkedIn: false,
      imgURL: "https://randomuser.me/api/portraits/lego/1.jpg",
      LOP: 0,
      isActive: true,
      leaveRequests: []
    });
    setErrors({});
    setTouched({});
    new window.bootstrap.Modal(document.getElementById("editModal")).show();
  };

  const handleEditClick = (employee) => {
    if (userRole !== "Admin" && userRole !== "HR") {
      alert("Only Admin or HR can edit employees.");
      return;
    }

    setSelectedEmployee(employee);
    setFormData({
      username: employee.username || "",
      email: employee.email || "",
      // imgURL: employee.imgURL || "",
      dob: employee.dob || "",
      yearOfJoin: employee.yearOfJoin || null,
      status: employee.status || "Active",
      currentPackage: employee.currentPackage || null,
      currentProject: employee.currentProject || "",
      rating: employee.rating || null,
      motherName: employee.motherName || "",
      fatherName: employee.fatherName || "",
      panNumber: employee.panNumber || "",
      lastAppraisalDate: employee.lastAppraisalDate ? format(new Date(employee.lastAppraisalDate), 'yyyy-MM-dd') : null,
      department: employee.department || "",
      position: employee.position || "",
      phone: employee.phone || "",
      totalLeave: employee.totalLeave ?? 25,
      availableLeave: employee.availableLeave ?? 25,
      completedLeave: employee.completedLeave ?? 0,
      role: employee.role || "User",
      checkedIn: employee.checkedIn ?? false,
      imgURL: employee.imgURL || "https://randomuser.me/api/portraits/lego/1.jpg",
      LOP: employee.LOP ?? 0,
      isActive: employee.isActive ?? true,
      leaveRequests: Array.isArray(employee.leaveRequests) ? employee.leaveRequests : []
    });
    setErrors({});
    setTouched({});
    new window.bootstrap.Modal(document.getElementById("editModal")).show();
  };

  const confirmDelete = (employee) => {
    if (userRole !== "Admin" && userRole !== "HR") {
      alert("Only Admin or HR can delete employees.");
      return;
    }
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (['yearOfJoin', 'currentPackage', 'totalLeave', 'availableLeave', 'completedLeave', 'LOP', 'rating'].includes(name)) {
      processedValue = value === '' ? '' : Number(value);
    }
    
    setFormData({ ...formData, [name]: processedValue });
    
    if (touched[name]) {
      validate(name, processedValue);
    }
  };

  const handleAddEmployee = async () => {
    setTouched({
      username: true,
      email: true,
      position: true,
      department: true,
      role: true
    });
    
    if (!validateForm()) {
      alert('Please fix the validation errors before submitting.');
      return;
    }
    
    try {
      await axios.post(`${BASE_URL}/employees`, formData);
      await refreshData();
      const modal = window.bootstrap.Modal.getInstance(document.getElementById("editModal"));
      modal.hide();
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Failed to add employee. Please try again.");
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      alert('Please fix the validation errors before submitting.');
      return;
    }
    
    try {
      await axios.put(
        `${BASE_URL}/employees/email/${selectedEmployee._id}`,
        formData
      );
      await refreshData();
      const modal = window.bootstrap.Modal.getInstance(document.getElementById("editModal"));
      modal.hide();
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await axios.delete(`${BASE_URL}/employees/${selectedEmployee._id}`);
      await refreshData();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee. Please try again.");
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = 
      employee?.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      employee?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "" || employee?.role === roleFilter;
    const matchesDept = departmentFilter === "" || employee?.department === departmentFilter;
    
    return matchesSearch && matchesRole && matchesDept;
  });
  
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];

  const getLeaveStats = (employee) => {
    const leaveRequests = Array.isArray(employee.leaveRequests) ? employee.leaveRequests : [];
    const approvedLeaves = leaveRequests.filter(req => req.status === 'Approved').length;
    const pendingLeaves = leaveRequests.filter(req => req.status === 'Pending').length;
    return { approvedLeaves, pendingLeaves };
  };

  return (
    <div className="container employee-management-system" style={{marginTop:"25px"}}>
      <div className="container-fluid px-4 py-3">
        {/* Header Section */}
        <div className="ems-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-1">Employee Directory</h1>
              <p className="text-muted mb-0">Manage your organization&apos;s workforce</p>
            </div>
            <div className="m-2 align-items-center">
              <span className="me-3 text-muted">Total Employees:</span>
              <span className="badge rounded-pill bg-primary fs-6">
                {filteredEmployees.length}
              </span>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="ems-controls card mb-4 p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <select
                className="form-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-2 d-flex justify-content-end">
              {(userRole === "Admin" || userRole === "HR") && (
                <button
                  className="btn btn-primary d-flex align-items-center"
                  onClick={handleAdd}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Add Employee
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="text-center my-5 py-5">
            <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading employee data...</p>
          </div>
        ) : (
          <>
            {filteredEmployees.length === 0 ? (
              <div className="text-center my-5 py-5">
                <div className="empty-state">
                  <i className="bi bi-people fs-1 text-muted"></i>
                  <h4 className="mt-3">No employees found</h4>
                  <p className="text-muted">Try adjusting your search or filters</p>
                  {(userRole === "Admin" || userRole === "HR") && (
                    <button className="btn btn-primary mt-3" onClick={handleAdd}>
                      Add New Employee
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="ems-grid">
                {filteredEmployees.map((employee) => {
                  const { approvedLeaves, pendingLeaves } = getLeaveStats(employee);
                  
                  return (
                    <div key={employee._id} className={`ems-card ${employee.role.toLowerCase()}`}>
                      <div className="ems-card-header">
                        <div className="status-badge">
                          {employee.isActive ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-danger">Inactive</span>
                          )}
                        </div>
                        <img
                          src={employee.imgURL}
                          alt={employee.username}
                          className="ems-card-avatar"
                        />
                      </div>
                      <div className="ems-card-body">
                        <h3 className="ems-card-title">{employee.username}</h3>
                        <span className={`ems-card-role ems-role-badge ${employee.role.toLowerCase()}`}>
                          {employee.role}
                        </span>
                        <p className="ems-card-email">{employee.email}</p>
                        
                        <div className="employee-details">
                          <div className="detail-item">
                            <i className="bi bi-briefcase"></i>
                            <span>{employee.position || "Not specified"}</span>
                          </div>
                          <div className="detail-item">
                            <i className="bi bi-building"></i>
                            <span>{employee.department || "Not specified"}</span>
                          </div>
                          <div className="detail-item">
                            <i className="bi bi-calendar-check"></i>
                            <span>Leaves: {approvedLeaves} approved, {pendingLeaves} pending</span>
                          </div>
                        </div>
                      </div>
                      <div className="ems-card-footer">
                        {(userRole === "Admin" || userRole === "HR") && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditClick(employee)}
                            >
                              <i className="bi bi-pencil me-1"></i> Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => confirmDelete(employee)}
                            >
                              <i className="bi bi-trash me-1"></i> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        <div className={`modal fade ${showDeleteModal ? 'show d-block' : ''}`} id="deleteModal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-center mb-4">
                  <img
                    src={selectedEmployee?.imgURL}
                    alt={selectedEmployee?.username}
                    className="rounded-circle me-3"
                    width="60"
                    height="60"
                  />
                  <div>
                    <h6 className="mb-1">{selectedEmployee?.username}</h6>
                    <p className="text-muted mb-0">{selectedEmployee?.position}</p>
                  </div>
                </div>
                <p>
                  Are you sure you want to permanently delete this employee record? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <i className="bi bi-trash me-1"></i> Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
        {showDeleteModal && <div className="modal-backdrop fade show"></div>}

        {/* Add/Edit Employee Modal */}
        <div className="modal fade" id="editModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {selectedEmployee ? `Edit ${selectedEmployee.username}` : "Add New Employee"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name*</label>
                      <input
                        type="text"
                        className={`form-control ${touched.username && errors.username ? 'is-invalid' : ''}`}
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                      />
                      {touched.username && errors.username && (
                        <div className="invalid-feedback">{errors.username}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email*</label>
                      <input
                        type="email"
                        className={`form-control ${touched.email && errors.email ? 'is-invalid' : ''}`}
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                        disabled={!!selectedEmployee}
                      />
                      {touched.email && errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className={`form-control ${touched.phone && errors.phone ? 'is-invalid' : ''}`}
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                      />
                      {touched.phone && errors.phone && (
                        <div className="invalid-feedback">{errors.phone}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className={`form-control ${touched.dob && errors.dob ? 'is-invalid' : ''}`}
                        name="dob"
                        value={formData.dob || ''}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        max={format(new Date(), 'yyyy-MM-dd')}
                      />
                      {touched.dob && errors.dob && (
                        <div className="invalid-feedback">{errors.dob}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Position*</label>
                      <input
                        type="text"
                        className={`form-control ${touched.position && errors.position ? 'is-invalid' : ''}`}
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                      />
                      {touched.position && errors.position && (
                        <div className="invalid-feedback">{errors.position}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department*</label>
                      <select
                        className={`form-select ${touched.department && errors.department ? 'is-invalid' : ''}`}
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                      >
                        <option value="">Select Department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="HR">HR</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="Sales">Sales</option>
                      </select>
                      {touched.department && errors.department && (
                        <div className="invalid-feedback">{errors.department}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Role*</label>
                      <select
                        className={`form-select ${touched.role && errors.role ? 'is-invalid' : ''}`}
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        required
                      >
                        <option value="Admin">Admin</option>
                        <option value="User">User</option>
                        <option value="Manager">Manager</option>
                        <option value="HR">HR</option>
                      </select>
                      {touched.role && errors.role && (
                        <div className="invalid-feedback">{errors.role}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label">Total Leave Days</label>
                      <input
                        type="number"
                        className={`form-control ${touched.totalLeave && errors.totalLeave ? 'is-invalid' : ''}`}
                        name="totalLeave"
                        value={formData.totalLeave}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        min="0"
                      />
                      {touched.totalLeave && errors.totalLeave && (
                        <div className="invalid-feedback">{errors.totalLeave}</div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Available Leave</label>
                      <input
                        type="number"
                        className={`form-control ${touched.availableLeave && errors.availableLeave ? 'is-invalid' : ''}`}
                        name="availableLeave"
                        value={formData.availableLeave}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        min="0"
                      />
                      {touched.availableLeave && errors.availableLeave && (
                        <div className="invalid-feedback">{errors.availableLeave}</div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">LOP Days</label>
                      <input
                        type="number"
                        className={`form-control ${touched.LOP && errors.LOP ? 'is-invalid' : ''}`}
                        name="LOP"
                        value={formData.LOP}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        min="0"
                      />
                      {touched.LOP && errors.LOP && (
                        <div className="invalid-feedback">{errors.LOP}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Year of Joining</label>
                      <input
                        type="number"
                        className={`form-control ${touched.yearOfJoin && errors.yearOfJoin ? 'is-invalid' : ''}`}
                        name="yearOfJoin"
                        value={formData.yearOfJoin || ''}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        min="2000"
                        max={new Date().getFullYear()}
                      />
                      {touched.yearOfJoin && errors.yearOfJoin && (
                        <div className="invalid-feedback">{errors.yearOfJoin}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Current Salary</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className={`form-control ${touched.currentPackage && errors.currentPackage ? 'is-invalid' : ''}`}
                          name="currentPackage"
                          value={formData.currentPackage || ''}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {touched.currentPackage && errors.currentPackage && (
                        <div className="invalid-feedback">{errors.currentPackage}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Last Appraisal Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="lastAppraisalDate"
                        value={formData.lastAppraisalDate || ''}
                        onChange={handleInputChange}
                        max={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">PAN Number</label>
                      <input
                        type="text"
                        className={`form-control ${touched.panNumber && errors.panNumber ? 'is-invalid' : ''}`}
                        name="panNumber"
                        value={formData.panNumber || ''}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="ABCDE1234F"
                        maxLength="10"
                      />
                      {touched.panNumber && errors.panNumber && (
                        <div className="invalid-feedback">{errors.panNumber}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label">Profile Image URL</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          name="imgURL"
                          value={formData.imgURL}
                          onChange={handleInputChange}
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            imgURL: "https://randomuser.me/api/portraits/lego/" + 
                              Math.floor(Math.random() * 10) + ".jpg"
                          })}
                        >
                          Random
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={selectedEmployee ? handleUpdate : handleAddEmployee}
                  disabled={Object.keys(errors).length > 0}
                >
                  {selectedEmployee ? "Update Employee" : "Add Employee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;