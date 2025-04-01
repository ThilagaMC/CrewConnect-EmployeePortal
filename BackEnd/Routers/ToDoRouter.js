import express from 'express';
import { check, validationResult } from 'express-validator';
import Todo from '../models/ToDoModel.js'

const ToDoRouter = express.Router();

// Validation middleware
const validateTodo = [
  check('title').not().isEmpty().withMessage('Title is required'),
  check('category').isIn(['work', 'personal', 'shopping', 'health', 'other']),
  check('priority').isIn(['low', 'medium', 'high', 'critical']),
  check('status').isIn(['not-started', 'in-progress', 'completed', 'on-hold']),
  check('estimatedHours').isFloat({ min: 0, max: 1000 }),
  check('startDate').isISO8601().toDate(),
  check('endDate').optional({ nullable: true }).isISO8601().toDate()
];

//Filtered ToDo
ToDoRouter.get("/filtered/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    // Find todos with priority "high" or "critical" for the specific user
    const highPriorityTodos = await Todo.find({
      userID: id,
      priority: { $in: ["high", "critical"] }
    });

    
    res.status(200).json({
      success: true,
      count: highPriorityTodos.length,
      data: highPriorityTodos
    });
    
  } catch (error) {
    console.error("Error fetching high priority todos:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch high priority todos",
      error: error.message
    });
  }
});

// Get all todos with filtering and sorting for specific user
ToDoRouter.get('/:userID', async (req, res) => {
  try {
    const { category, status, priority, sortBy } = req.query;
    const { userID } = req.params; // Destructure userID from params    
    // Always filter by userID first
    const filter = { userID }; 
    
    // Add additional filters if provided
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Set sort options
    let sortOption = { createdAt: -1 }; // Default sort
    if (sortBy === 'priority') sortOption = { priority: 1 };
    if (sortBy === 'endDate') sortOption = { endDate: 1 };
    if (sortBy === 'estimatedHours') sortOption = { estimatedHours: -1 };

    // Query database with both user filter and additional filters
    const todos = await Todo.find(filter).sort(sortOption);
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new todo
ToDoRouter.post('/', async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const todo = new Todo({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      priority: req.body.priority,
      status: req.body.status,
      estimatedHours: req.body.estimatedHours,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      userID:req.body.userID
    });

    const newTodo = await todo.save();

    res.status(201).json(newTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a todo
ToDoRouter.patch('/:id', async (req, res) => {
  const {id}=req.params;  
  try {

    const todo = await Todo.findById(id);

    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    // Update fields
    todo.title = req.body.title || todo.title;
    todo.description = req.body.description || todo.description;
    todo.category = req.body.category || todo.category;
    todo.priority = req.body.priority || todo.priority;
    todo.status = req.body.status || todo.status;
    todo.estimatedHours = req.body.estimatedHours || todo.estimatedHours;
    todo.startDate = req.body.startDate || todo.startDate;
    todo.endDate = req.body.endDate !== undefined ? req.body.endDate : todo.endDate;

    const updatedTodo = await todo.save();    
    res.json(updatedTodo);
  } catch (err) {
    console.log(err);
    
    res.status(400).json({ message: err.message });
  }
});

// Delete a todo
ToDoRouter.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default ToDoRouter;