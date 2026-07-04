// src/components/workflow/CodegenStage.tsx
import { useState, useEffect } from 'react'
import { codegenAPI, type CodegenPlan, type CodegenStatus, type CodegenResult, type FinalizeResult } from '../../services/codegenService'
import { CodeGenManager } from './CodeGenManager'
import { Blueprint, HLD, LLD } from '../../types/aiResponse'
import useWorkflowStore from '../../stores/workflowStore'

interface CodegenStageProps {
  projectId: string
  lldContent?: string
}

export function CodegenStage({ projectId, lldContent }: CodegenStageProps) {
  const { blueprint, hld, lld } = useWorkflowStore()
  const [useEnhancedManager, setUseEnhancedManager] = useState(true)
  const [plan, setPlan] = useState<CodegenPlan | null>(null)
  const [status, setStatus] = useState<CodegenStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<CodegenResult | null>(null)
  const [finalizeResult, setFinalizeResult] = useState<FinalizeResult | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [dryRun, setDryRun] = useState(false)
  const [useQueue, setUseQueue] = useState(true)

  // Auto-refresh status when generation is in progress
  useEffect(() => {
    if (!status) return

    const hasInProgress = Object.values(status).some(s => s.status === 'in-progress')
    if (!hasInProgress) return

    const interval = setInterval(() => {
      fetchStatus()
    }, 2000) // Refresh every 2 seconds

    return () => clearInterval(interval)
  }, [status])

  const fetchStatus = async () => {
    try {
      const result = await codegenAPI.getStatus(projectId)
      setStatus(result.status)
    } catch (err: any) {
      console.error('Failed to fetch status:', err)
    }
  }

  const handleCreatePlan = async () => {
    if (!lldContent) {
      setError('No LLD content available. Please complete the LLD stage first.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await codegenAPI.createPlan(projectId)
      setPlan(result.plan)
      await fetchStatus() // Get initial status
    } catch (err: any) {
      setError(err.message || 'Failed to create plan')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyPlan = async () => {
    if (!plan) return

    setLoading(true)
    setError(null)
    try {
      const options = {
        dryRun,
        paths: selectedFiles.length > 0 ? selectedFiles : undefined
      }

      let result: CodegenResult
      if (useQueue) {
        result = await codegenAPI.applyPlanQueue(projectId, options)
      } else {
        result = await codegenAPI.applyPlanBatch(projectId, options)
      }

      setLastResult(result)
      await fetchStatus() // Refresh status after generation
    } catch (err: any) {
      setError(err.message || 'Failed to apply plan')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await codegenAPI.finalize(projectId)
      setFinalizeResult(result)
    } catch (err: any) {
      setError(err.message || 'Failed to finalize')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (fileStatus: string) => {
    switch (fileStatus) {
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'in-progress': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (fileStatus: string) => {
    switch (fileStatus) {
      case 'completed': return '✅'
      case 'failed': return '❌'
      case 'in-progress': return '⏳'
      default: return '⏸️'
    }
  }

  const completedCount = status ? Object.values(status).filter(s => s.status === 'completed').length : 0
  const totalCount = status ? Object.keys(status).length : 0
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Check if we have the required data for enhanced manager
  const canUseEnhancedManager = blueprint && hld && lld

  return (
    <div className="space-y-6">
      {/* Manager Selection */}
      {canUseEnhancedManager && (
        <div className="bg-white shadow rounded-xl p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Code Generation Mode:</span>
            <label className="flex items-center">
              <input
                type="radio"
                checked={useEnhancedManager}
                onChange={() => setUseEnhancedManager(true)}
                className="mr-2"
              />
              Enhanced Manager (Recommended)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!useEnhancedManager}
                onChange={() => setUseEnhancedManager(false)}
                className="mr-2"
              />
              Legacy Manager
            </label>
          </div>
        </div>
      )}

      {/* Enhanced CodeGen Manager */}
      {useEnhancedManager && canUseEnhancedManager ? (
        <CodeGenManager
          projectId={projectId}
          blueprint={blueprint}
          hld={hld}
          lld={lld}
          onComplete={() => {
            // Handle completion if needed
            console.log('Code generation completed')
          }}
        />
      ) : (
        // Legacy CodeGen Interface
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Code Generation (Legacy)</h2>
            <p className="text-gray-600 mb-4">
              Generate code files based on the Low-Level Design (LLD). Use the queue system for reliable generation with automatic retries.
            </p>

        {/* Progress Bar */}
        {status && totalCount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{completedCount} / {totalCount} files</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {!plan && (
            <button
              onClick={handleCreatePlan}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Plan...' : 'Create Code Plan'}
            </button>
          )}

          {plan && (
            <>
              <button
                onClick={handleApplyPlan}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : `Generate Code ${useQueue ? '(Queue)' : '(Batch)'}`}
              </button>

              {completedCount === totalCount && totalCount > 0 && (
                <button
                  onClick={handleFinalize}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Finalizing...' : 'Finalize & Build'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Options */}
      {plan && (
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Generation Options</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useQueue}
                onChange={(e) => setUseQueue(e.target.checked)}
                className="mr-2"
              />
              Use Queue System (recommended for reliability)
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="mr-2"
              />
              Dry Run (preview only, no files written)
            </label>
          </div>
        </div>
      )}

      {/* Plan Details */}
      {plan && (
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Code Plan ({plan.files.length} files)</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {plan.files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.path)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFiles([...selectedFiles, file.path])
                      } else {
                        setSelectedFiles(selectedFiles.filter(p => p !== file.path))
                      }
                    }}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{file.path}</div>
                    <div className="text-sm text-gray-600">{file.purpose}</div>
                  </div>
                </div>
                {status && status[file.path] && (
                  <div className={`text-sm ${getStatusColor(status[file.path].status)}`}>
                    {getStatusIcon(status[file.path].status)} {status[file.path].status}
                    {status[file.path].attempts > 1 && ` (${status[file.path].attempts} attempts)`}
                  </div>
                )}
              </div>
            ))}
          </div>
          {selectedFiles.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedFiles.length} of {plan.files.length} files selected
            </p>
          )}
        </div>
      )}

      {/* Status Details */}
      {status && (
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Generation Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-2xl">⏸️</div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="font-semibold">{Object.values(status).filter(s => s.status === 'pending').length}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-2xl">⏳</div>
              <div className="text-sm text-gray-600">In Progress</div>
              <div className="font-semibold text-blue-600">{Object.values(status).filter(s => s.status === 'in-progress').length}</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-2xl">✅</div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="font-semibold text-green-600">{Object.values(status).filter(s => s.status === 'completed').length}</div>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <div className="text-2xl">❌</div>
              <div className="text-sm text-gray-600">Failed</div>
              <div className="font-semibold text-red-600">{Object.values(status).filter(s => s.status === 'failed').length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Last Result */}
      {lastResult && (
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Last Generation Result</h3>
          <div className="space-y-2">
            <p className={`font-medium ${lastResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {lastResult.success ? '✅ Success' : '❌ Failed'}
            </p>
            {lastResult.message && <p className="text-gray-600">{lastResult.message}</p>}
            {lastResult.written !== undefined && (
              <p className="text-sm text-gray-600">
                Files written: {lastResult.written} {lastResult.dryRun && '(dry run)'}
              </p>
            )}
            {lastResult.queueStats && (
              <div className="text-sm text-gray-600">
                Queue: {lastResult.queueStats.processing} processing, {lastResult.queueStats.waiting} waiting
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finalize Result */}
      {finalizeResult && (
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Finalization Results</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded">
                <h4 className="font-medium">Linting</h4>
                <p className={`text-sm ${finalizeResult.results.linting.status === 'passed' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {finalizeResult.results.linting.message}
                </p>
              </div>
              <div className="p-4 border rounded">
                <h4 className="font-medium">Testing</h4>
                <p className={`text-sm ${finalizeResult.results.testing.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                  {finalizeResult.results.testing.message}
                </p>
              </div>
              <div className="p-4 border rounded">
                <h4 className="font-medium">Build</h4>
                <p className={`text-sm ${finalizeResult.results.build.status === 'created' ? 'text-green-600' : 'text-red-600'}`}>
                  {finalizeResult.results.build.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">{error}</p>
        </div>
          )}
        </div>
      )}
    </div>
  )
}
