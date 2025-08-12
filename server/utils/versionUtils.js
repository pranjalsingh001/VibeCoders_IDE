/**
 * Handles versioning logic for project blueprints.
 */

/**
 * Returns the next version string given the current one.
 * @param {string} currentVersion - e.g., "v1", "v2"
 * @returns {string} - e.g., "v2" -> "v3"
 */
function getNextVersion(currentVersion) {
  const number = parseInt(currentVersion?.replace('v', '')) || 0;
  return `v${number + 1}`;
}

module.exports = {
  getNextVersion,
};
