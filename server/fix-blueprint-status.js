require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');

async function fixBlueprintStatus() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find projects that are in blueprint stage with completed status but no blueprint
    const stuckProjects = await Project.find({
      'workflow.stage': 'blueprint',
      'workflow.status': 'completed',
      blueprint: { $exists: false }
    });

    console.log(`Found ${stuckProjects.length} projects stuck in blueprint stage`);

    if (stuckProjects.length > 0) {
      console.log('Fixing stuck projects:');
      
      for (const project of stuckProjects) {
        console.log(`- Fixing project: ${project.name} (${project._id})`);
        
        // Reset to pending status so blueprint generation can run
        project.workflow.status = 'pending';
        await project.save();
        
        console.log(`  ✅ Reset to pending status`);
      }
      
      console.log(`\n🔧 Fixed ${stuckProjects.length} projects`);
    }

    console.log('Fix completed');
  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

fixBlueprintStatus();