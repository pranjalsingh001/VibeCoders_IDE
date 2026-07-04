// utils/queue.js - Enhanced job queue for codegen tasks with better error handling
class JobQueue {
  constructor() {
    this.jobs = new Map(); // jobId -> job
    this.waiting = []; // jobIds waiting to be processed
    this.processing = new Set(); // jobIds currently being processed
    this.completed = new Map(); // jobId -> result
    this.failed = new Map(); // jobId -> error
    this.handlers = new Map(); // jobType -> handler function
    this.isProcessing = false;
    this.processingStartTime = new Map(); // jobId -> start time
    this.maxProcessingTime = 5 * 60 * 1000; // 5 minutes max processing time
  }

  // Register a handler for a job type
  registerHandler(jobType, handler) {
    this.handlers.set(jobType, handler);
  }

  // Add a job to the queue
  async add(jobType, data, options = {}) {
    const jobId = `${jobType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      type: jobType,
      data,
      options: {
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 1000,
        ...options
      },
      attempts: 0,
      createdAt: new Date(),
      status: 'waiting'
    };

    this.jobs.set(jobId, job);
    this.waiting.push(jobId);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return jobId;
  }

  // Process the queue
  async processQueue() {
    if (this.isProcessing || this.waiting.length === 0) return;

    this.isProcessing = true;

    while (this.waiting.length > 0) {
      const jobId = this.waiting.shift();
      const job = this.jobs.get(jobId);

      if (!job || job.status !== 'waiting') continue;

      this.processing.add(jobId);
      job.status = 'processing';

      try {
        const handler = this.handlers.get(job.type);
        if (!handler) {
          throw new Error(`No handler registered for job type: ${job.type}`);
        }

        const result = await handler(job.data, job);
        job.status = 'completed';
        job.result = result;
        this.completed.set(jobId, result);

      } catch (error) {
        job.attempts++;
        job.lastError = error.message;

        if (job.attempts < job.options.maxRetries) {
          // Requeue with exponential backoff
          const delay = job.options.retryDelay * Math.pow(2, job.attempts - 1);
          setTimeout(() => {
            job.status = 'waiting';
            this.waiting.push(jobId);
            this.processing.delete(jobId);
            this.processQueue();
          }, delay);
        } else {
          // Max retries reached
          job.status = 'failed';
          this.failed.set(jobId, error);
          this.processing.delete(jobId);
        }
      } finally {
        if (job.status !== 'waiting') {
          this.processing.delete(jobId);
        }
      }
    }

    this.isProcessing = false;
  }

  // Get job status
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  // Get all jobs by status
  getJobsByStatus(status) {
    const jobs = [];
    for (const [jobId, job] of this.jobs) {
      if (job.status === status) {
        jobs.push(job);
      }
    }
    return jobs;
  }

  // Get queue stats
  getStats() {
    return {
      total: this.jobs.size,
      waiting: this.waiting.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size
    };
  }

  // Clear completed jobs (for memory management)
  clearCompleted() {
    for (const jobId of this.completed.keys()) {
      this.jobs.delete(jobId);
    }
    this.completed.clear();
  }
}

module.exports = JobQueue;
