require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');
const workflowService = require('./services/workflowService');

async function testHLDGeneration() {
  try {
    console.log('Testing LLD generation...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find a project in LLD stage with pending status
    const project = await Project.findOne({ 
      'workflow.stage': 'lld',
      'workflow.status': 'pending'
    });

    if (!project) {
      console.log('No project found in LLD/pending state');
      return;
    }

    console.log(`Testing LLD generation for project: ${project.name}`);
    console.log(`Current stage: ${project.workflow.stage}`);
    console.log(`Current status: ${project.workflow.status}`);
    console.log(`Blueprint ID: ${project.blueprint}`);

    // Test the workflow runNextStage for LLD
    console.log('\n🔄 Running LLD generation...');
    
    const result = await workflowService.runNextStage(project._id, project.owner);

    console.log('✅ LLD generation completed!');
    console.log('Success:', result.success);
    console.log('New stage:', result.stage);

    // Check the updated project
    const updatedProject = await Project.findById(project._id);
    console.log(`\nUpdated project stage: ${updatedProject.workflow.stage}`);
    console.log(`Updated project status: ${updatedProject.workflow.status}`);
    console.log(`Design ID: ${updatedProject.design}`);

    if (updatedProject.design) {
      console.log('🎉 LLD successfully created!');
      console.log('Ready for codegen generation');
    } else {
      console.log('❌ LLD not created');
    }

  } catch (error) {
    console.error('❌ LLD generation failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

testHLDGeneration();