// testContainer.js
const dockerService = require("../services/dockerService");

async function testContainer(containerId) {
  console.log(`Testing container: ${containerId}`);
  
  // Check status
  const status = await dockerService.getContainerStatus(containerId);
  console.log("Container status:", status);
  
  // Get logs
  const logs = await dockerService.getContainerLogs(containerId, 50);
  if (logs.success) {
    console.log("Container logs:");
    console.log(logs.logs);
  } else {
    console.log("Failed to get logs:", logs.message);
  }
}

// Run with: node testContainer.js <containerId>
const containerId = process.argv[2];
if (containerId) {
  testContainer(containerId);
} else {
  console.log("Please provide a container ID");
}