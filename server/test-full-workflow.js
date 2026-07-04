require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');
const workflowService = require('./services/workflowService');

async function testFullWorkflow() {
  try {
    console.log('Testing full workflow progression...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Create a test project
    const testProject = new Project({
      owner: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      name: 'Workflow Test Project',
      idea: 'A test project to verify the complete workflow',
      status: 'clarifying',
      workflow: {
        stage: 'planning',
        status: 'pending'
      }
    });

    await testProject.save();
    console.log(`Created test project: ${testProject.name} (${testProject._id})`);

    const stages = ['planning', 'blueprint', 'hld', 'lld', 'codegen'];
    
    for (let i = 0; i < stages.length; i++) {
      const expectedStage = stages[i];
      
      // Get current project state
      const currentProject = await Project.findById(testProject._id);
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 Testing Stage ${i + 1}: ${expectedStage.toUpperCase()}`);
      console.log(`Current stage: ${currentProject.workflow.stage}`);
      console.log(`Current status: ${currentProject.workflow.status}`);
      
      if (currentProject.workflow.stage !== expectedStage) {
        console.log(`❌ Expected stage ${expectedStage}, but got ${currentProject.workflow.stage}`);
        break;
      }

      if (currentProject.workflow.status !== 'pending') {
        console.log(`❌ Expected status 'pending', but got ${currentProject.workflow.status}`);
        break;
      }

      try {
        // Run the next stage
        console.log(`\n🚀 Running ${expectedStage} stage...`);
        const result = await workflowService.runNextStage(testProject._id, testProject.owner);
        
        console.log(`✅ Stage completed successfully!`);
        console.log(`New stage: ${result.stage}`);
        
        // Verify the project was updated correctly
        const updatedProject = await Project.findById(testProject._id);
        console.log(`Updated status: ${updatedProject.workflow.status}`);
        
        if (expectedStage === 'planning') {
          console.log(`Blueprint stage ready: ${updatedProject.workflow.stage === 'blueprint'}`);
        } else if (expectedStage === 'blueprint') {
          console.log(`Blueprint created: ${updatedProject.blueprint ? 'Yes' : 'No'}`);
          console.log(`HLD stage ready: ${updatedProject.workflow.stage === 'hld'}`);
        } else if (expectedStage === 'hld') {
          console.log(`Design doc created: ${updatedProject.design ? 'Yes' : 'No'}`);
          console.log(`LLD stage ready: ${updatedProject.workflow.stage === 'lld'}`);
        } else if (expectedStage === 'lld') {
          console.log(`Codegen stage ready: ${updatedProject.workflow.stage === 'codegen'}`);
        } else if (expectedStage === 'codegen') {
          console.log(`Workflow completed: ${updatedProject.workflow.stage === 'completed'}`);
          console.log(`Final status: ${updatedProject.workflow.status}`);
        }
        
      } catch (error) {
        console.error(`❌ Stage ${expectedStage} failed:`, error.message);
        break;
      }
    }

    // Clean up - delete the test project
    await Project.findByIdAndDelete(testProject._id);
    console.log(`\n🧹 Cleaned up test project`);

    console.log(`\n🎉 Full workflow test completed!`);

  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

testFullWorkflow();