require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');
const workflowService = require('./services/workflowService');

async function testFixedWorkflow() {
  try {
    console.log('Testing fixed workflow...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find the project we just fixed
    const project = await Project.findOne({ 
      name: 'E-commerce',
      'workflow.stage': 'blueprint',
      'workflow.status': 'pending'
    });

    if (!project) {
      console.log('No project found in blueprint/pending state');
      return;
    }

    console.log(`Testing workflow for project: ${project.name}`);
    console.log(`Current stage: ${project.workflow.stage}`);
    console.log(`Current status: ${project.workflow.status}`);

    // Test the workflow runNextStage
    console.log('\n🔄 Running blueprint generation...');
    
    const result = await workflowService.runNextStage(project._id, project.owner);

    console.log('✅ Blueprint generation completed!');
    console.log('Success:', result.success);
    console.log('New stage:', result.stage);

    // Check the updated project
    const updatedProject = await Project.findById(project._id);
    console.log(`\nUpdated project stage: ${updatedProject.workflow.stage}`);
    console.log(`Updated project status: ${updatedProject.workflow.status}`);
    console.log(`Blueprint ID: ${updatedProject.blueprint}`);

    if (updatedProject.blueprint) {
      console.log('🎉 Blueprint successfully created!');
    } else {
      console.log('❌ Blueprint not created');
    }

  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

testFixedWorkflow();