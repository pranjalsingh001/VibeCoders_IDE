const { codegenQueue } = require("../workers/codegenWorker");

// Controller for monitoring and managing the codegen queue
exports.getQueueStatus = async (req, res) => {
  try {
    const stats = codegenQueue.getStats();
    const waitingJobs = codegenQueue.getJobsByStatus('waiting');
    const processingJobs = codegenQueue.getJobsByStatus('processing');
    const failedJobs = codegenQueue.getJobsByStatus('failed');

    res.json({
      success: true,
      stats,
      waitingJobs: waitingJobs.map(job => ({
        id: job.id,
        type: job.type,
        attempts: job.attempts,
        createdAt: job.createdAt,
        data: {
          projectId: job.data.projectId,
          filePath: job.data.fileSpec?.path
        }
      })),
      processingJobs: processingJobs.map(job => ({
        id: job.id,
        type: job.type,
        attempts: job.attempts,
        createdAt: job.createdAt,
        data: {
          projectId: job.data.projectId,
          filePath: job.data.fileSpec?.path
        }
      })),
      failedJobs: failedJobs.map(job => ({
        id: job.id,
        type: job.type,
        attempts: job.attempts,
        createdAt: job.createdAt,
        lastError: job.lastError,
        data: {
          projectId: job.data.projectId,
          filePath: job.data.fileSpec?.path
        }
      }))
    });
  } catch (error) {
    console.error("Error getting queue status:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get queue status",
      error: error.message
    });
  }
};

exports.getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = codegenQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    res.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        createdAt: job.createdAt,
        lastError: job.lastError,
        data: job.data
      }
    });
  } catch (error) {
    console.error("Error getting job details:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get job details",
      error: error.message
    });
  }
};

exports.retryFailedJobs = async (req, res) => {
  try {
    const failedJobs = codegenQueue.getJobsByStatus('failed');
    let retriedCount = 0;

    for (const job of failedJobs) {
      // Reset job status and requeue
      job.status = 'waiting';
      job.attempts = 0;
      job.lastError = null;

      // Add back to waiting queue
      codegenQueue.waiting.push(job.id);
      retriedCount++;

      // Start processing if not already running
      if (!codegenQueue.isProcessing) {
        codegenQueue.processQueue();
      }
    }

    res.json({
      success: true,
      message: `Retried ${retriedCount} failed jobs`,
      retriedCount
    });
  } catch (error) {
    console.error("Error retrying failed jobs:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retry failed jobs",
      error: error.message
    });
  }
};

exports.clearCompletedJobs = async (req, res) => {
  try {
    codegenQueue.clearCompleted();
    res.json({
      success: true,
      message: "Completed jobs cleared from memory"
    });
  } catch (error) {
    console.error("Error clearing completed jobs:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to clear completed jobs",
      error: error.message
    });
  }
};
