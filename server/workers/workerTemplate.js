const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

// Cross-platform Docker connection
const docker = new Docker(
  process.platform === 'win32'
    ? { socketPath: '//./pipe/docker_engine' } // Windows
    : { socketPath: '/var/run/docker.sock' }  // Linux/macOS
);

// List of fallback images if primary fails
const IMAGE_FALLBACKS = {
  node: ['node:18-alpine', 'node:18', 'node:lts-alpine'],
  python: ['python:3.9-alpine', 'python:3.9', 'python:latest']
};

/**
 * Runs user code inside a Docker container
 * @param {string} code - The code to execute
 * @param {string} language - Programming language ('node' or 'python')
 * @param {number} timeout - Execution timeout in milliseconds (default: 5000)
 * @returns {Promise<{status: string, output: string}>} Execution result
 */
async function runCodeInDocker(code, language = 'node', timeout = 5000) {
  const tempDir = path.join(__dirname, 'temp');
  const tempFilePath = path.join(tempDir, `tempCode.${language === 'node' ? 'js' : 'py'}`);

  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Save code to temporary file
  fs.writeFileSync(tempFilePath, code);

  try {
    // Try each fallback image until one works
    const images = IMAGE_FALLBACKS[language] || IMAGE_FALLBACKS.node;
    let lastError = null;

    for (const image of images) {
      try {
        const cmd = language === 'node' 
          ? ['node', `/temp/tempCode.js`]
          : ['python', `/temp/tempCode.py`];

        const container = await docker.createContainer({
          Image: image,
          Cmd: cmd,
          HostConfig: {
            Binds: [`${tempFilePath}:/temp/tempCode.${language === 'node' ? 'js' : 'py'}:ro`],
            AutoRemove: true,
            Memory: 100 * 1024 * 1024, // 100MB memory limit
            NetworkMode: 'none' // Disable network access
          },
          WorkingDir: '/temp',
          StopTimeout: Math.floor(timeout / 1000)
        });

        await container.start();

        // Set execution timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Execution timed out after ${timeout}ms`));
          }, timeout);
        });

        // Wait for container to finish
        const waitPromise = container.wait();
        const result = await Promise.race([waitPromise, timeoutPromise]);

        // Get container logs
        const logs = await container.logs({
          stdout: true,
          stderr: true,
          timestamps: false
        });

        return {
          status: result.StatusCode === 0 ? 'success' : 'runtime_error',
          output: logs.toString().trim()
        };
      } catch (err) {
        lastError = err;
        // If it's not an image-related error, stop trying fallbacks
        if (!err.message.includes('No such image')) {
          break;
        }
        console.warn(`Image ${image} not found, trying next fallback...`);
      }
    }

    throw lastError || new Error('No suitable image found');
  } catch (error) {
    console.error('Docker execution failed:', error.message);
    return {
      status: 'error',
      output: `Error: ${error.message}`
    };
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up temp file:', cleanupError.message);
    }
  }
}

module.exports = runCodeInDocker;