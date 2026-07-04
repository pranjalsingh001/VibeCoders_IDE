require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');

async function debugWorkflowStatus() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find all projects and their workflow status
    const projects = await Project.find().sort({ updatedAt: -1 });
    
    console.log(`Found ${projects.length} projects in database`);
    console.log('\n📊 Project Workflow Status:');
    console.log('='.repeat(80));

    projects.forEach((project, index) => {
      console.log(`${index + 1}. Project: ${project.name}`);
      console.log(`   ID: ${project._id}`);
      console.log(`   Idea: ${project.idea?.substring(0, 50)}...`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Workflow Stage: ${project.workflow.stage}`);
      console.log(`   Workflow Status: ${project.workflow.status}`);
      console.log(`   Blueprint ID: ${project.blueprint || 'None'}`);
      console.log(`   Design ID: ${project.design || 'None'}`);
      console.log(`   Created: ${project.createdAt}`);
      console.log(`   Updated: ${project.updatedAt}`);
      console.log('-'.repeat(40));
    });

    // Check for projects that should be ready for blueprint generation
    const readyForBlueprint = projects.filter(p => 
      p.workflow.stage === 'blueprint' && p.workflow.status === 'pending'
    );

    console.log(`\n🔄 Projects ready for blueprint generation: ${readyForBlueprint.length}`);
    readyForBlueprint.forEach(project => {
      console.log(`- ${project.name} (${project._id})`);
    });

    // Check for projects stuck in blueprint stage
    const stuckInBlueprint = projects.filter(p => 
      p.workflow.stage === 'blueprint' && p.workflow.status === 'in-progress'
    );

    console.log(`\n⚠️ Projects stuck in blueprint generation: ${stuckInBlueprint.length}`);
    stuckInBlueprint.forEach(project => {
      console.log(`- ${project.name} (${project._id}) - Status: ${project.workflow.status}`);
    });

  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

debugWorkflowStatus();