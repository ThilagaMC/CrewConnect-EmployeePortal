import express from 'express';
import Project from '../models/ProjectModel.js';

const ProjectRouter = express.Router();

// Helper function for API responses
const respond = (res, status, message, data = null) => {
  const response = { message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

// Input validation middleware
const validateProjectInput = (req, res, next) => {
  const { name, description, startDate, budget, resources } = req.body;
  
  if (!name || !description || !startDate || !budget || !resources) {
    return respond(res, 400, 'All fields are required');
  }

  if (isNaN(Number(budget))) {
    return respond(res, 400, 'Budget must be a number');
  }

  if (!Array.isArray(resources) && typeof resources !== 'string') {
    return respond(res, 400, 'Resources must be an array or comma-separated string');
  }

  next();
};

// Get all projects with filtering, sorting and pagination

  ProjectRouter.get('/',async(req,res)=>{
    try {
      const details = await Project.find();
      res.status(200).json(details)
    } catch (error) {
      
    }
  })
  
// Get a single project
ProjectRouter.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return respond(res, 404, 'Project not found');
    }
    respond(res, 200, 'Project retrieved successfully', project);
  } catch (error) {
    console.error('Error fetching project:', error);
    if (error.name === 'CastError') {
      return respond(res, 400, 'Invalid project ID');
    }
    respond(res, 500, 'Server error while fetching project');
  }
});

// Create a new project
ProjectRouter.post('/', validateProjectInput, async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      status: req.body.status || 'Planning',
      resources: Array.isArray(req.body.resources) ? 
        req.body.resources : 
        req.body.resources.split(',').map(r => r.trim())
    };

    const newProject = new Project(projectData);
    const savedProject = await newProject.save();
    
    respond(res, 201, 'Project created successfully', savedProject);
  } catch (error) {
    console.error('Error creating project:', error);
    if (error.name === 'ValidationError') {
      return respond(res, 400, error.message);
    }
    respond(res, 500, 'Server error while creating project');
  }
});

// Update a project
ProjectRouter.put('/:id', validateProjectInput, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return respond(res, 404, 'Project not found');
    }

    const updateData = {
      ...req.body,
      resources: Array.isArray(req.body.resources) ? 
        req.body.resources : 
        req.body.resources.split(',').map(r => r.trim())
    };

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    respond(res, 200, 'Project updated successfully', updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    if (error.name === 'ValidationError') {
      return respond(res, 400, error.message);
    }
    if (error.name === 'CastError') {
      return respond(res, 400, 'Invalid project ID');
    }
    respond(res, 500, 'Server error while updating project');
  }
});

// Delete a project
ProjectRouter.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return respond(res, 404, 'Project not found');
    }
    respond(res, 200, 'Project deleted successfully');
  } catch (error) {
    console.error('Error deleting project:', error);
    if (error.name === 'CastError') {
      return respond(res, 400, 'Invalid project ID');
    }
    respond(res, 500, 'Server error while deleting project');
  }
});

export default ProjectRouter;