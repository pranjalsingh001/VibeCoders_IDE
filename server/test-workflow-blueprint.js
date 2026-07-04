require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');
const workflowService = require('./services/workflowService');

async function testWorkflowBlueprint() {
  try {
    console.log('Testing workflow blueprint generation...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find a project in blueprint stage
    let project = await Project.findOne({ 
      'workflow.stage': 'blueprint',
      'workflow.status': 'completed'
    });
    
    if (!project) {
      console.log('No projects in blueprint stage found. Looking for any project...');
      project = await Project.findOne().sort({ createdAt: -1 });
      
      if (project) {
        // Set it to blueprint stage for testing
        project.workflow.stage = 'blueprint';
        project.workflow.status = 'pending';
        await project.save();
        console.log(`Set project ${project.name} to blueprint stage for testing`);
      }
    }

    if (!project) {
      console.log('No projects found in database');
      return;
    }

    console.log(`Testing workflow for project: ${project.name}`);
    console.log(`Current stage: ${project.workflow.stage}`);
    console.log(`Current status: ${project.workflow.status}`);

    // Test the workflow runNextStage
    console.log('\n🔄 Running next workflow stage...');
    
    const result = await workflowService.runNextStage(project._id, project.owner);

    console.log('✅ Workflow stage completed successfully!');
    console.log('Result:', result);

    // Check the updated project
    const updatedProject = await Project.findById(project._id);
    console.log(`\nUpdated project stage: ${updatedProject.workflow.stage}`);
    console.log(`Updated project status: ${updatedProject.workflow.status}`);
    console.log(`Blueprint ID: ${updatedProject.blueprint}`);

  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

testWorkflowBlueprint();