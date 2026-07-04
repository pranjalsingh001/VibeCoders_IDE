require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');
const blueprintBuilder = require('./services/blueprintBuilder');

async function testBlueprintGeneration() {
  try {
    console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Not set');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find a project to test with
    const project = await Project.findOne().sort({ createdAt: -1 });
    
    if (!project) {
      console.log('No projects found in database');
      return;
    }

    console.log(`Testing blueprint generation for project: ${project.name}`);
    console.log(`Project idea: ${project.idea}`);
    console.log(`Current workflow stage: ${project.workflow.stage}`);
    console.log(`Current workflow status: ${project.workflow.status}`);

    // Test blueprint generation
    console.log('\n🔄 Starting blueprint generation test...');
    
    const result = await blueprintBuilder.generate({
      projectName: project.name,
      ideaDescription: project.idea,
      answers: project.planning?.answers || null,
    });

    console.log('✅ Blueprint generation successful!');
    console.log('Raw AI response length:', result.raw?.length || 0);
    console.log('Blueprint overview length:', result.overview?.length || 0);
    console.log('Blueprint components count:', result.components?.length || 0);
    console.log('Blueprint tech stack count:', result.techStack?.length || 0);
    
    if (result.raw) {
      console.log('\n📄 Raw AI response preview:');
      console.log(result.raw.substring(0, 500) + '...');
    }
    
    if (result.overview) {
      console.log('\n📋 Overview preview:', result.overview.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('❌ Blueprint generation failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

testBlueprintGeneration();