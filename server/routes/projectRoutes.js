const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// All routes require authentication
router.use(protect);

// Create a new project
router.post('/', createProject);

// Get user's projects
router.get('/', getUserProjects);

// Get project by ID
router.get('/:id', getProjectById);

// Update project
router.put('/:id', updateProject);

// Delete project
router.delete('/:id', deleteProject);

module.exports = router;