const runCodeInDocker = require("./workerTemplate");

/**
 * Handles incoming code execution requests.
 * @param {Object} options
 * @param {string} options.code - The code to run
 * @param {string} [options.language='node'] - Programming language (default: Node.js)
 * @returns {Promise<Object>} - Execution result with status and output/error
 */
async function executeUserCode({ code, language = "node" }) {
  try {
    // Run code safely in Docker
    const result = await runCodeInDocker(code, language);

    return {
      status: "success",
      output: result,
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message || "Something went wrong during execution",
    };
  }
}

module.exports = {
  executeUserCode,
};
