// services/retryService.js
// Exponential backoff retries for AI calls

async function withRetry(fn, retries = 3, delay = 500) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Retry ${i + 1} failed:`, err.message);
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i))); 
    }
  }
  throw lastError;
}

module.exports = { withRetry };
