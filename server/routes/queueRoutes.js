const express = require('express');
const router = express.Router();
const {
  getQueueStatus,
  getJobDetails,
  retryFailedJobs,
  clearCompletedJobs
} = require('../controllers/queueController');

// GET /api/queue/status - Get overall queue status
router.get('/status', getQueueStatus);

// GET /api/queue/job/:jobId - Get details of a specific job
router.get('/job/:jobId', getJobDetails);

// POST /api/queue/retry-failed - Retry all failed jobs
router.post('/retry-failed', retryFailedJobs);

// POST /api/queue/clear-completed - Clear completed jobs from memory
router.post('/clear-completed', clearCompletedJobs);

module.exports = router;
