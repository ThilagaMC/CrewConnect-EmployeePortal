import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Form,
  Badge,
  Row,
  Col,
  Alert,
  Spinner,
  ProgressBar,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock as ClockIcon,
  Tag,
  Flag,
  CheckSquare,
  PieChart,
  Filter,
  Sliders,
} from "react-feather";
import "./TodoList.css";

const TodoList = () => {
  // State
  const [todos, setTodos] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Meeting",
    priority: "medium",
    status: "not-started",
    estimatedHours: 1,
    startDate: new Date(),
    endDate: null,
  });
  const [userID, setUserID] = useState(null);
  const [editTodo, setEditTodo] = useState(null);
  const [filter, setFilter] = useState({
    category: "",
    status: "",
    priority: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTodo, setExpandedTodo] = useState(null);

  // Stats calculation
  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.status === "completed").length,
    inProgress: todos.filter((t) => t.status === "in-progress").length,
    overdue: todos.filter(
      (t) =>
        t.endDate &&
        new Date(t.endDate) < new Date() &&
        t.status !== "completed"
    ).length,
    get percentage() {
      return this.total > 0
        ? Math.round((this.completed / this.total) * 100)
        : 0;
    },
  };

  // Effects
  useEffect(() => {
    const loadData = async () => {
      try {
        const id = await getUserIdFromCache();
        if (id) {
          setUserID(id);
          await fetchTodos(id);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (userID) fetchTodos(userID);
  }, [filter, sortConfig, userID]);

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

  const fetchTodos = async (userId) => {
    try {
      const params = new URLSearchParams();
      if (filter.category) params.append("category", filter.category);
      if (filter.status) params.append("status", filter.status);
      if (filter.priority) params.append("priority", filter.priority);
      params.append("sortBy", sortConfig.key);
      params.append("sortOrder", sortConfig.direction);

      const res = await axios.get(
        `http://localhost:5000/todos/${userId}?${params.toString()}`
      );
      setTodos(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
      setError("Failed to load tasks. Please try again.");
    }
  };

  const handleTodoAction = async (action, id, data) => {
    try {
      const config = { headers: { "Content-Type": "application/json" } };
      let res;

      if (action === "create" || action === "update") {
        const payload = {
          ...data,
          userID,
          startDate: data.startDate
            ? new Date(data.startDate).toISOString()
            : null,
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        };

        if (action === "create") {
          res = await axios.post(
            "http://localhost:5000/todos",
            payload,
            config
          );
          setTodos((prev) => [...prev, res.data]);
        } else if (action === "update") {
          res = await axios.patch(
            `http://localhost:5000/todos/${id}`,
            payload,
            config
          );
          setTodos((prev) => prev.map((t) => (t._id === id ? res.data : t)));
          setEditTodo(null);
        }
      } else if (action === "delete") {
        res = await axios.delete(`http://localhost:5000/todos/${id}`, config);
        setTodos((prev) => prev.filter((t) => t._id !== id));
      }

      resetForm();
    } catch (err) {
      console.error(
        `Failed to ${action} todo:`,
        err.response?.data || err.message
      );
      setError(`Failed to ${action} task. Please try again.`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleTodoAction(editTodo ? "update" : "create", editTodo?._id, formData);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Meeting",
      priority: "medium",
      status: "not-started",
      estimatedHours: 1,
      startDate: new Date(),
      endDate: null,
    });
  };

  const handleEdit = (todo) => {
    setEditTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description,
      category: todo.category,
      priority: todo.priority,
      status: todo.status,
      estimatedHours: todo.estimatedHours,
      startDate: new Date(todo.startDate),
      endDate: todo.endDate ? new Date(todo.endDate) : null,
    });
    // Scroll to form
    document
      .getElementById("todo-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleExpandTodo = (id) => {
    setExpandedTodo(expandedTodo === id ? null : id);
  };

  // UI helpers
  const priorityBadges = {
    low: { variant: "info", icon: <Flag size={14} className="text-info" /> },
    medium: {
      variant: "primary",
      icon: <Flag size={14} className="text-primary" />,
    },
    high: {
      variant: "warning",
      icon: <Flag size={14} className="text-warning" />,
    },
    critical: {
      variant: "danger",
      icon: <Flag size={14} className="text-danger" />,
    },
  };

  const statusBadges = {
    "not-started": {
      variant: "secondary",
      icon: <Clock size={14} className="text-secondary" />,
    },
    "in-progress": {
      variant: "primary",
      icon: (
        <span
          className="spinner-border spinner-border-sm text-primary"
          role="status"
        />
      ),
    },
    completed: {
      variant: "success",
      icon: <CheckCircle size={14} className="text-success" />,
    },
    "on-hold": {
      variant: "warning",
      icon: <AlertTriangle size={14} className="text-warning" />,
    },
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading your tasks...</span>
      </div>
    );
  }

  return (
    <div className="container py-4 todo-container">
      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="mb-4"
        >
          <AlertTriangle size={18} className="me-2" />
          {error}
        </Alert>
      )}

      {/* Todo Form */}
      <Card className="mb-4 shadow-sm border-0" id="todo-form">
        <Card.Header className="bg-primary text-white py-3">
          <div className="d-flex align-items-center">
            <PieChart size={20} className="me-2" />
            <h5 className="mb-0">{editTodo ? "Edit Task" : "Add New Task"}</h5>
          </div>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="title" className="mb-3">
                  <Form.Label className="fw-medium">Title*</Form.Label>
                  <Form.Control
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter task title"
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="category" className="mb-3">
                  <Form.Label className="fw-medium">Category*</Form.Label>
                  <div className="d-flex align-items-center position-relative">
                    <Tag
                      size={18}
                      className="position-absolute ms-2 text-muted"
                    />
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="py-2 ps-4"
                    >
                      {[
                        "Meeting",
                        "Training",
                        "Internal Project",
                        "External Project",
                        "Other",
                      ].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="description" className="mb-3">
                  <Form.Label className="fw-medium">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Add task details..."
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group controlId="priority" className="mb-3">
                  <Form.Label className="fw-medium">Priority*</Form.Label>
                  <div className="d-flex align-items-center position-relative">
                    <Flag
                      size={18}
                      className="position-absolute ms-2 text-muted"
                    />
                    <Form.Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      required
                      className="py-2 ps-4"
                    >
                      {Object.entries(priorityBadges).map(([key]) => (
                        <option key={key} value={key}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group controlId="status" className="mb-3">
                  <Form.Label className="fw-medium">Status*</Form.Label>
                  <div className="d-flex align-items-center position-relative">
                    <CheckSquare
                      size={18}
                      className="position-absolute ms-2 text-muted"
                    />
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="py-2 ps-4"
                    >
                      {Object.entries(statusBadges).map(([key]) => (
                        <option key={key} value={key}>
                          {key
                            .split("-")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group controlId="estimatedHours" className="mb-3">
                  <Form.Label className="fw-medium">
                    Estimated Hours*
                  </Form.Label>
                  <div className="d-flex align-items-center position-relative">
                    <ClockIcon
                      size={18}
                      className="position-absolute ms-2 text-muted"
                    />
                    <Form.Control
                      type="number"
                      name="estimatedHours"
                      min="0.5"
                      step="0.5"
                      value={formData.estimatedHours}
                      onChange={handleInputChange}
                      required
                      className="py-2 ps-4"
                    />
                  </div>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group controlId="startDate" className="mb-3">
                  <Form.Label className="fw-medium">Start Date*</Form.Label>
                  <div className="d-flex align-items-center position-relative">
                    <Calendar
                      size={18}
                      className="position-absolute ms-2 text-muted"
                    />
                    <DatePicker
                      selected={formData.startDate}
                      onChange={(date) => handleDateChange(date, "startDate")}
                      className="form-control py-2 ps-4"
                      dateFormat="MMM d, yyyy"
                      minDate={new Date()}
                      required
                    />
                  </div>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group controlId="endDate" className="mb-3">
                  <Form.Label className="fw-medium">Due Date</Form.Label>
                  <div className="d-flex align-items-center position-relative">
                    <Calendar
                      size={18}
                      className="position-absolute ms-2 text-muted"
                    />
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(date) => handleDateChange(date, "endDate")}
                      className="form-control py-2 ps-4"
                      dateFormat="MMM d, yyyy"
                      minDate={formData.startDate}
                      isClearable
                      placeholderText="Optional"
                    />
                  </div>
                </Form.Group>
              </Col>

              <Col md={12} className="mt-2">
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    className="flex-grow-1 py-2 d-flex align-items-center justify-content-center"
                  >
                    {editTodo ? (
                      <>
                        <Edit2 size={18} className="me-2" />
                        Update Task
                      </>
                    ) : (
                      <>
                        <Plus size={18} className="me-2" />
                        Add Task
                      </>
                    )}
                  </Button>
                  {editTodo && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setEditTodo(null);
                        resetForm();
                      }}
                      className="py-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Stats & Filters */}
      <div className="d-flex flex-column flex-md-row gap-3 mb-4">
        {/* Stats Card */}
        <Card className="shadow-sm border-0 stats-card flex-grow-1">
          <Card.Body className="p-3">
            {/* Mobile View - Stacked Layout */}
            <div className="d-block d-md-none">
              <div className="row g-2 text-center">
                <div className="col-6">
                  <div className="p-2">
                    <h3 className="mb-1 fw-bold">{stats.total}</h3>
                    <small className="text-muted">Total Tasks</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-2">
                    <h3 className="mb-1 fw-bold text-success">
                      {stats.completed}
                    </h3>
                    <small className="text-muted">Completed</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-2">
                    <h3 className="mb-1 fw-bold text-primary">
                      {stats.inProgress}
                    </h3>
                    <small className="text-muted">In Progress</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-2">
                    <h3 className="mb-1 fw-bold text-danger">
                      {stats.overdue}
                    </h3>
                    <small className="text-muted">Overdue</small>
                  </div>
                </div>
                <div className="col-12">
                  <div className="p-2">
                    <h3 className="mb-1 fw-bold">{stats.percentage}%</h3>
                    <small className="text-muted">Completion</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop View - Horizontal Layout */}
            <div className="d-none d-md-flex justify-content-between text-center">
              <div className="flex-grow-1 border-end pe-3">
                <h3 className="mb-1 fw-bold">{stats.total}</h3>
                <small className="text-muted">Total Tasks</small>
              </div>
              <div className="flex-grow-1 border-end px-3">
                <h3 className="mb-1 fw-bold text-success">{stats.completed}</h3>
                <small className="text-muted">Completed</small>
              </div>
              <div className="flex-grow-1 border-end px-3">
                <h3 className="mb-1 fw-bold text-primary">
                  {stats.inProgress}
                </h3>
                <small className="text-muted">In Progress</small>
              </div>
              <div className="flex-grow-1 border-end px-3">
                <h3 className="mb-1 fw-bold text-danger">{stats.overdue}</h3>
                <small className="text-muted">Overdue</small>
              </div>
              <div className="flex-grow-1 ps-3">
                <h3 className="mb-1 fw-bold">{stats.percentage}%</h3>
                <small className="text-muted">Completion</small>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar
                now={stats.percentage}
                variant="success"
                className="rounded-pill"
                style={{ height: "8px" }}
              />
            </div>
          </Card.Body>
        </Card>

        {/* Filters Card */}
        <Card className="shadow-sm border-0 filters-card flex-grow-1">
          <Card.Header className="bg-light border-0 py-2 px-3">
            <div className="d-flex align-items-center">
              <Filter size={18} className="me-2 text-muted" />
              <h6 className="mb-0">Filters</h6>
            </div>
          </Card.Header>
          <Card.Body className="p-3">
            <Row className="g-2">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Category</Form.Label>
                  <div className="d-flex align-items-center position-relative">
                    <Tag
                      size={16}
                      className="position-absolute ms-2 text-muted"
                    />
                    <Form.Select
                      value={filter.category}
                      onChange={(e) =>
                        setFilter({ ...filter, category: e.target.value })
                      }
                      className="py-2 ps-4"
                    >
                      <option value="">All Categories</option>
                      {[
                        "Meeting",
                        "Training",
                        "Internal Project",
                        "External Project",
                        "Other",
                      ].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Status</Form.Label>
                  <div className="d-flex align-items-center position-relative">
                    <CheckSquare
                      size={16}
                      className="position-absolute ms-2 text-muted"
                    />
                    <Form.Select
                      value={filter.status}
                      onChange={(e) =>
                        setFilter({ ...filter, status: e.target.value })
                      }
                      className="py-2 ps-4"
                    >
                      <option value="">All Statuses</option>
                      {Object.entries(statusBadges).map(([key]) => (
                        <option key={key} value={key}>
                          {key
                            .split("-")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Priority</Form.Label>
                  <div className="d-flex align-items-center position-relative">
                    <Flag
                      size={16}
                      className="position-absolute ms-2 text-muted"
                    />
                    <Form.Select
                      value={filter.priority}
                      onChange={(e) =>
                        setFilter({ ...filter, priority: e.target.value })
                      }
                      className="py-2 ps-4"
                    >
                      <option value="">All Priorities</option>
                      {Object.entries(priorityBadges).map(([key]) => (
                        <option key={key} value={key}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>

      {/* Sort Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <h5 className="mb-2 mb-md-0 d-flex align-items-center">
          <Sliders size={18} className="me-2 text-muted" />
          My Tasks
        </h5>
        <div className="btn-group sort-buttons">
          <Button
            variant={
              sortConfig.key === "createdAt" ? "primary" : "outline-secondary"
            }
            onClick={() => handleSort("createdAt")}
            className="d-flex align-items-center"
          >
            {sortConfig.key === "createdAt" &&
            sortConfig.direction === "asc" ? (
              <ChevronUp size={16} className="me-1" />
            ) : (
              <ChevronDown size={16} className="me-1" />
            )}
            Recently Added
          </Button>
          <Button
            variant={
              sortConfig.key === "priority" ? "primary" : "outline-secondary"
            }
            onClick={() => handleSort("priority")}
            className="d-flex align-items-center"
          >
            {sortConfig.key === "priority" && sortConfig.direction === "asc" ? (
              <ChevronUp size={16} className="me-1" />
            ) : (
              <ChevronDown size={16} className="me-1" />
            )}
            Priority
          </Button>
          <Button
            variant={
              sortConfig.key === "endDate" ? "primary" : "outline-secondary"
            }
            onClick={() => handleSort("endDate")}
            className="d-flex align-items-center"
          >
            {sortConfig.key === "endDate" && sortConfig.direction === "asc" ? (
              <ChevronUp size={16} className="me-1" />
            ) : (
              <ChevronDown size={16} className="me-1" />
            )}
            Deadline
          </Button>
        </div>
      </div>

      {/* Todo List */}
      {todos.length === 0 ? (
        <Card className="text-center shadow-sm py-5 empty-state border-0">
          <CheckCircle size={48} className="text-muted mb-3 mx-auto" />
          <h5>No tasks found</h5>
          <p className="text-muted mb-3">Add a new task to get started</p>
          <Button
            variant="primary"
            onClick={() => {
              document.getElementById("title").focus();
              document
                .getElementById("todo-form")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2"
          >
            <Plus size={18} className="me-2" />
            Create Your First Task
          </Button>
        </Card>
      ) : (
        <Row className="g-3">
          {todos.map((todo) => {
            const isOverdue =
              todo.endDate &&
              new Date(todo.endDate) < new Date() &&
              todo.status !== "completed";
            const priority = priorityBadges[todo.priority];
            const status = statusBadges[todo.status];

            return (
              <Col key={todo._id} xs={12} md={6} lg={4} xl={3}>
                <Card
                  className={`shadow-sm h-100 ${
                    isOverdue
                      ? "border-start border-danger border-3"
                      : "border-0"
                  }`}
                >
                  <Card.Body
                    className="cursor-pointer"
                    onClick={() => toggleExpandTodo(todo._id)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <Badge
                          bg={priority.variant}
                          className="d-flex align-items-center px-2 py-1"
                          pill
                        >
                          {priority.icon}
                          <span className="ms-1">
                            {todo.priority.charAt(0).toUpperCase() +
                              todo.priority.slice(1)}
                          </span>
                        </Badge>
                        <Badge
                          bg={status.variant}
                          className="d-flex align-items-center px-2 py-1"
                          pill
                        >
                          {status.icon}
                          <span className="ms-1">
                            {todo.status
                              .split("-")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </span>
                        </Badge>
                      </div>
                      <div className="d-flex gap-1">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(todo);
                          }}
                          title="Edit"
                          className="text-muted p-1"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTodoAction("delete", todo._id);
                          }}
                          title="Delete"
                          className="text-danger p-1"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <h5 className="mb-2 task-title">{todo.title}</h5>

                    {todo.description && (
                      <div
                        className={`mb-3 small text-muted task-description ${
                          expandedTodo === todo._id ? "" : "text-truncate"
                        }`}
                      >
                        {todo.description}
                      </div>
                    )}

                    <div className="small text-muted">
                      <div className="d-flex align-items-center mb-1">
                        <Tag size={14} className="me-2 flex-shrink-0" />
                        <span>{todo.category}</span>
                      </div>
                      <div className="d-flex align-items-center mb-1">
                        <ClockIcon size={14} className="me-2 flex-shrink-0" />
                        <span>{todo.estimatedHours} hours estimated</span>
                      </div>
                      {todo.endDate && (
                        <div
                          className={`d-flex align-items-center ${
                            isOverdue ? "text-danger" : ""
                          }`}
                        >
                          <Calendar size={14} className="me-2 flex-shrink-0" />
                          <span>
                            Due: {formatDate(todo.endDate)}
                            {isOverdue && " (Overdue)"}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default TodoList;
