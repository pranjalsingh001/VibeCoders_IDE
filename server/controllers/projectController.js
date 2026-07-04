const Project = require('../models/Project');
const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');

// Create a new project
const createProject = async (req, res) => {
  try {
    const { name, idea } = req.body;
    const owner = req.user.userId; // Assuming req.user is set by authMiddleware

    if (!name || !idea) {
      return res.status(400).json({ message: 'Name and idea are required' });
    }

    const project = new Project({
      owner,
      name,
      idea,
      status: 'clarifying',
      workflow: {
        stage: 'planning',
        status: 'pending'
      }
    });

    const savedProject = await project.save();

    const projectsRoot = path.join(__dirname, '..', 'projects');
    const projectDir = path.join(projectsRoot, owner.toString(), savedProject._id.toString());
    await fs.mkdir(projectDir, { recursive: true });

    res.status(201).json({ project: savedProject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get projects for the authenticated user
const getUserProjects = async (req, res) => {
  try {
    const owner = req.user.userId;
    console.log(`🔍 [Projects] Fetching projects for user: ${owner}`);
    console.log(`🔍 [Projects] User object:`, req.user);
    
    // Validate that owner is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      console.error(`❌ [Projects] Invalid ObjectId for owner: ${owner}`);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Try without populate first to avoid reference errors
    const projects = await Project.find({ owner }).sort({ updatedAt: -1 });
    console.log(`✅ [Projects] Found ${projects.length} projects`);
    
    // Try to populate references safely
    const populatedProjects = [];
    for (const project of projects) {
      try {
        const populated = await Project.findById(project._id)
          .populate('blueprint')
          .populate('design');
        populatedProjects.push(populated);
      } catch (populateError) {
        console.warn(`⚠️ [Projects] Failed to populate references for project ${project._id}:`, populateError.message);
        // Use the original project without population
        populatedProjects.push(project);
      }
    }
    
    res.json({ projects: populatedProjects });
  } catch (error) {
    console.error(`❌ [Projects] Error fetching projects:`, error);
    console.error(`❌ [Projects] Full error stack:`, error.stack);
    res.status(500).json({ message: error.message });
  }
};

// Get a single project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const project = await Project.findOne({ _id: id, owner: req.user.userId }).populate('blueprint design');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const updates = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: id, owner: req.user.userId },
      updates,
      { new: true, runValidators: true }
    ).populate('blueprint design');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const project = await Project.findOneAndDelete({ _id: id, owner: req.user.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject
};