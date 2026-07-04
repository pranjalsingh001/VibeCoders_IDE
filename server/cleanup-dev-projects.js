require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');

async function cleanupDevProjects() {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI);
    console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find projects with string owner IDs
    const stringOwnerProjects = await Project.find({ owner: { $type: "string" } });
    console.log(`Found ${stringOwnerProjects.length} projects with string owner IDs`);

    if (stringOwnerProjects.length > 0) {
      console.log('Projects to clean up:');
      stringOwnerProjects.forEach(project => {
        console.log(`- Project: ${project.name}, Owner: ${project.owner} (${typeof project.owner})`);
      });

      // Option 1: Delete all projects with string owner IDs
      const deleteResult = await Project.deleteMany({ owner: { $type: "string" } });
      console.log(`Deleted ${deleteResult.deletedCount} projects with string owner IDs`);
    }

    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

cleanupDevProjects();