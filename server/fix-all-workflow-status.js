require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Project = require('./models/Project');

async function fixAllWorkflowStatus() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Find projects that are in intermediate stages with completed status but missing required data
    const queries = [
      {
        description: 'Blueprint stage completed but no blueprint',
        query: {
          'workflow.stage': 'blueprint',
          'workflow.status': 'completed',
          blueprint: { $exists: false }
        }
      },
      {
        description: 'HLD stage completed but no design doc',
        query: {
          'workflow.stage': 'hld', 
          'workflow.status': 'completed',
          design: { $exists: false }
        }
      },
      {
        description: 'LLD stage completed but no LLD doc',
        query: {
          'workflow.stage': 'lld',
          'workflow.status': 'completed'
          // Note: LLD creates a separate DesignDoc, harder to check directly
        }
      },
      {
        description: 'Codegen stage completed but no codegen plan',
        query: {
          'workflow.stage': 'codegen',
          'workflow.status': 'completed',
          codegenPlan: { $exists: false }
        }
      }
    ];

    let totalFixed = 0;

    for (const { description, query } of queries) {
      console.log(`\n🔍 Checking: ${description}`);
      
      const stuckProjects = await Project.find(query);
      console.log(`Found ${stuckProjects.length} projects`);

      if (stuckProjects.length > 0) {
        console.log('Fixing projects:');
        
        for (const project of stuckProjects) {
          console.log(`- Fixing: ${project.name} (${project._id})`);
          
          // Reset to pending status so the stage can run again
          project.workflow.status = 'pending';
          await project.save();
          
          console.log(`  ✅ Reset to pending status`);
          totalFixed++;
        }
      }
    }

    // Also check for any projects stuck in "in-progress" status
    console.log(`\n🔍 Checking for projects stuck in 'in-progress' status`);
    const inProgressProjects = await Project.find({
      'workflow.status': 'in-progress'
    });

    console.log(`Found ${inProgressProjects.length} projects stuck in progress`);
    
    if (inProgressProjects.length > 0) {
      for (const project of inProgressProjects) {
        console.log(`- Resetting: ${project.name} (${project._id}) from ${project.workflow.stage} stage`);
        
        project.workflow.status = 'pending';
        await project.save();
        
        console.log(`  ✅ Reset to pending status`);
        totalFixed++;
      }
    }

    console.log(`\n🔧 Total projects fixed: ${totalFixed}`);
    console.log('Fix completed');

  } catch (error) {
    console.error('Error during fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

fixAllWorkflowStatus();