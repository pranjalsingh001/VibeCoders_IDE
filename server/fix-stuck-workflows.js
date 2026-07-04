require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');

async function fixStuckWorkflows() {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find projects with stuck "in-progress" status
    const stuckProjects = await Project.find({ 
      'workflow.status': 'in-progress' 
    });
    
    console.log(`Found ${stuckProjects.length} projects with stuck "in-progress" status`);

    if (stuckProjects.length > 0) {
      console.log('Stuck projects:');
      stuckProjects.forEach(project => {
        console.log(`- Project: ${project.name} (${project._id}), Stage: ${project.workflow.stage}, Status: ${project.workflow.status}`);
      });

      // Reset all stuck projects to "pending" status
      const updateResult = await Project.updateMany(
        { 'workflow.status': 'in-progress' },
        { 
          $set: { 
            'workflow.status': 'pending',
            'workflow.updatedAt': new Date()
          } 
        }
      );
      
      console.log(`Reset ${updateResult.modifiedCount} stuck workflows to "pending" status`);
    }

    // Also check for any projects that might be stuck in blueprint stage
    const blueprintStageProjects = await Project.find({ 
      'workflow.stage': 'blueprint',
      'workflow.status': { $in: ['pending', 'failed'] }
    });
    
    console.log(`Found ${blueprintStageProjects.length} projects in blueprint stage with pending/failed status`);
    
    if (blueprintStageProjects.length > 0) {
      blueprintStageProjects.forEach(project => {
        console.log(`- Blueprint stage project: ${project.name} (${project._id}), Status: ${project.workflow.status}`);
      });
    }

    console.log('Workflow fix completed');
  } catch (error) {
    console.error('Error during workflow fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

fixStuckWorkflows();