import React, { useState, useEffect } from 'react';
import { queueService, type QueueStats, type JobInfo } from '../services/queueService';

interface QueueMonitorProps {
  projectId?: string;
  refreshInterval?: number;
}

export function QueueMonitor({ projectId, refreshInterval = 5000 }: QueueMonitorProps) {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [jobs, setJobs] = useState<{
    waiting: JobInfo[];
    processing: JobInfo[];
    failed: JobInfo[];
  }>({ waiting: [], processing: [], failed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      const response = await queueService.getQueueStatus();
      setQueueStats(response.stats);
      setJobs({
        waiting: response.waitingJobs,
        processing: response.processingJobs,
        failed: response.failedJobs,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch queue status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleRetryFailed = async () => {
    try {
      await queueService.retryFailedJobs();
      await fetchQueueStatus(); // Refresh after retry
    } catch (err: any) {
      setError(err.message || 'Failed to retry failed jobs');
    }
  };

  const handleClearCompleted = async () => {
    try {
      await queueService.clearCompletedJobs();
      await fetchQueueStatus(); // Refresh after clearing
    } catch (err: any) {
      setError(err.message || 'Failed to clear completed jobs');
    }
  };

  if (loading && !queueStats) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Queue Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={fetchQueueStatus}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Queue Stats */}
      {queueStats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-600">{queueStats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">{queueStats.waiting}</div>
            <div className="text-sm text-yellow-600">Waiting</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{queueStats.processing}</div>
            <div className="text-sm text-blue-600">Processing</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
            <div className="text-sm text-red-600">Failed</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(jobs.failed.length > 0 || queueStats?.completed) && (
        <div className="flex gap-2 mb-4">
          {jobs.failed.length > 0 && (
            <button
              onClick={handleRetryFailed}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
            >
              Retry {jobs.failed.length} Failed Jobs
            </button>
          )}
          {queueStats && queueStats.completed > 0 && (
            <button
              onClick={handleClearCompleted}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
            >
              Clear Completed
            </button>
          )}
        </div>
      )}

      {/* Job Details */}
      {showDetails && (
        <div className="space-y-4">
          {/* Failed Jobs */}
          {jobs.failed.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2">
                Failed Jobs ({jobs.failed.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {jobs.failed.map((job) => (
                  <div key={job.id} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{queueService.getJobStatusText(job)}</div>
                        <div className="text-gray-600">
                          Attempts: {job.attempts} | Created: {queueService.getTimeAgo(job.createdAt)}
                        </div>
                        {job.lastError && (
                          <div className="text-red-600 mt-1 text-xs">
                            Error: {job.lastError}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {job.id.split('_').slice(-1)[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Jobs */}
          {jobs.processing.length > 0 && (
            <div>
              <h4 className="font-medium text-blue-700 mb-2">
                Processing Jobs ({jobs.processing.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {jobs.processing.map((job) => (
                  <div key={job.id} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{queueService.getJobStatusText(job)}</div>
                        <div className="text-gray-600">
                          Attempts: {job.attempts} | Created: {queueService.getTimeAgo(job.createdAt)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {job.id.split('_').slice(-1)[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waiting Jobs */}
          {jobs.waiting.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-700 mb-2">
                Waiting Jobs ({jobs.waiting.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {jobs.waiting.map((job) => (
                  <div key={job.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{queueService.getJobStatusText(job)}</div>
                        <div className="text-gray-600">
                          Created: {queueService.getTimeAgo(job.createdAt)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {job.id.split('_').slice(-1)[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {queueStats && queueStats.total === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p>No jobs in queue</p>
        </div>
      )}
    </div>
  );
}
