import { apiClient } from './api';

export interface QueueStats {
  total: number;
  waiting: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface JobInfo {
  id: string;
  type: string;
  attempts: number;
  createdAt: string;
  data?: {
    projectId?: string;
    filePath?: string;
  };
  lastError?: string;
}

export interface QueueStatusResponse {
  success: boolean;
  stats: QueueStats;
  waitingJobs: JobInfo[];
  processingJobs: JobInfo[];
  failedJobs: JobInfo[];
}

export interface JobDetailsResponse {
  success: boolean;
  job: JobInfo;
}

export interface QueueActionResponse {
  success: boolean;
  message: string;
  retriedCount?: number;
}

class QueueService {
  /**
   * Get overall queue status and statistics
   */
  async getQueueStatus(): Promise<QueueStatusResponse> {
    const response = await apiClient.get('/queue/status');
    return response.data;
  }

  /**
   * Get details of a specific job
   */
  async getJobDetails(jobId: string): Promise<JobDetailsResponse> {
    const response = await apiClient.get(`/queue/job/${jobId}`);
    return response.data;
  }

  /**
   * Retry all failed jobs
   */
  async retryFailedJobs(): Promise<QueueActionResponse> {
    const response = await apiClient.post('/queue/retry-failed');
    return response.data;
  }

  /**
   * Clear completed jobs from memory
   */
  async clearCompletedJobs(): Promise<QueueActionResponse> {
    const response = await apiClient.post('/queue/clear-completed');
    return response.data;
  }

  /**
   * Get human-readable job status
   */
  getJobStatusText(job: JobInfo): string {
    switch (job.type) {
      case 'generateFile':
        return `Generating ${job.data?.filePath || 'file'}`;
      default:
        return `${job.type} job`;
    }
  }

  /**
   * Get status color for UI display
   */
  getJobStatusColor(status: string): string {
    switch (status) {
      case 'waiting':
        return 'warning';
      case 'processing':
        return 'info';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  }

  /**
   * Format time ago for job display
   */
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}

export const queueService = new QueueService();
