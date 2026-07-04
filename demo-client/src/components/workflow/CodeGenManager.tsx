// CodeGenManager.tsx
// ------------------
// Enhanced CodeGen Manager with manifest validation and real-time progress tracking
// Implements manifest-first generation strategy with validation against design requirements

import React, { useState, useEffect, useCallback } from 'react'
import { codegenAPI } from '../../services/codegenService'
import codegenWebSocketService from '../../services/codegenWebSocket'
import {
  FileManifest,
  FileManifestEntry,
  FileStatus,
  ManifestValidationResult,
  CodeGenProgress,
  RetryOperation,
  FileGenerationUpdateEvent,
  ManifestUpdateEvent,
  ProgressUpdateEvent,
  RetryQueueUpdateEvent
} from '../../types/codegen'
import { Blueprint, HLD, LLD } from '../../types/aiResponse'
import { Button } from '../ui/Button'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { Loading } from '../ui/Loading'

interface CodeGenManagerProps {
  projectId: string
  blueprint: Blueprint
  hld: HLD
  lld: LLD
  onComplete?: () => void
}

export const CodeGenManager: React.FC<CodeGenManagerProps> = ({
  projectId,
  blueprint,
  hld,
  lld,
  onComplete
}) => {
  // State management
  const [manifest, setManifest] = useState<FileManifest | null>(null)
  const [validationResult, setValidationResult] = useState<ManifestValidationResult | null>(null)
  const [progress, setProgress] = useState<CodeGenProgress>({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    pendingFiles: 0,
    inProgressFiles: 0,
    percentage: 0
  })
  const [retryQueue, setRetryQueue] = useState<RetryOperation[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showRawManifest, setShowRawManifest] = useState(false)

  // Initialize WebSocket connection and load existing data
  useEffect(() => {
    const initializeCodeGen = async () => {
      try {
        // Initialize WebSocket for real-time updates
        await codegenWebSocketService.initialize(projectId)
        
        // Load existing manifest if available
        const manifestResponse = await codegenAPI.getManifest(projectId)
        if (manifestResponse.success && manifestResponse.manifest) {
          setManifest(manifestResponse.manifest)
          updateProgress(manifestResponse.manifest)
        }
        
        // Load current progress
        const progressResponse = await codegenAPI.getProgress(projectId)
        if (progressResponse.success) {
          setProgress(progressResponse.progress)
        }
        
      } catch (err) {
        console.error('Failed to initialize CodeGen Manager:', err)
        setError('Failed to initialize code generation system')
      }
    }

    initializeCodeGen()

    // Cleanup on unmount
    return () => {
      codegenWebSocketService.cleanup()
    }
  }, [projectId])

  // Set up WebSocket event listeners
  useEffect(() => {
    const unsubscribeFileUpdate = codegenWebSocketService.onFileGenerationUpdate(
      handleFileGenerationUpdate
    )
    const unsubscribeManifestUpdate = codegenWebSocketService.onManifestUpdate(
      handleManifestUpdate
    )
    const unsubscribeProgressUpdate = codegenWebSocketService.onProgressUpdate(
      handleProgressUpdate
    )
    const unsubscribeRetryUpdate = codegenWebSocketService.onRetryQueueUpdate(
      handleRetryQueueUpdate
    )

    return () => {
      unsubscribeFileUpdate()
      unsubscribeManifestUpdate()
      unsubscribeProgressUpdate()
      unsubscribeRetryUpdate()
    }
  }, [])

  // WebSocket event handlers
  const handleFileGenerationUpdate = useCallback((event: FileGenerationUpdateEvent) => {
    setManifest(prev => {
      if (!prev) return prev
      
      const updatedFiles = prev.files.map(file =>
        file.path === event.filePath
          ? {
              ...file,
              status: event.status,
              error: event.error,
              lastModified: new Date().toISOString()
            }
          : file
      )
      
      const updatedManifest = { ...prev, files: updatedFiles }
      updateProgress(updatedManifest)
      return updatedManifest
    })
  }, [])

  const handleManifestUpdate = useCallback((event: ManifestUpdateEvent) => {
    setManifest(event.manifest)
    if (event.validationResult) {
      setValidationResult(event.validationResult)
    }
    updateProgress(event.manifest)
  }, [])

  const handleProgressUpdate = useCallback((event: ProgressUpdateEvent) => {
    setProgress(event.progress)
  }, [])

  const handleRetryQueueUpdate = useCallback((event: RetryQueueUpdateEvent) => {
    setRetryQueue(event.retryQueue)
  }, [])

  // Update progress based on manifest
  const updateProgress = (manifest: FileManifest) => {
    const totalFiles = manifest.files.length
    const completedFiles = manifest.files.filter(f => f.status === FileStatus.COMPLETED).length
    const failedFiles = manifest.files.filter(f => f.status === FileStatus.FAILED).length
    const pendingFiles = manifest.files.filter(f => f.status === FileStatus.PENDING).length
    const inProgressFiles = manifest.files.filter(f => f.status === FileStatus.IN_PROGRESS).length
    
    setProgress({
      totalFiles,
      completedFiles,
      failedFiles,
      pendingFiles,
      inProgressFiles,
      percentage: totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0
    })
  }

  // Create manifest with validation
  const handleCreateManifest = async () => {
    setIsValidating(true)
    setError(null)
    
    try {
      const response = await codegenAPI.createManifest(projectId, {
        blueprint: blueprint.content,
        hld: hld.content,
        lld: lld.content
      })
      
      if (response.success) {
        setManifest(response.manifest)
        setValidationResult(response.validationResult)
        updateProgress(response.manifest)
      } else {
        setError('Failed to create file manifest')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create manifest')
    } finally {
      setIsValidating(false)
    }
  }

  // Start code generation
  const handleStartGeneration = async () => {
    if (!manifest) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await codegenAPI.startGeneration(projectId, {
        manifestId: manifest.id,
        selectedFiles: selectedFiles.length > 0 ? selectedFiles : undefined
      })
      
      if (!response.success) {
        setError('Failed to start code generation')
        setIsGenerating(false)
      }
      // Note: isGenerating will be set to false when generation completes via WebSocket
    } catch (err: any) {
      setError(err.message || 'Failed to start generation')
      setIsGenerating(false)
    }
  }

  // Retry specific file
  const handleRetryFile = async (filePath: string) => {
    try {
      await codegenAPI.retryFile(projectId, filePath, { priority: 'high' })
    } catch (err: any) {
      setError(`Failed to retry ${filePath}: ${err.message}`)
    }
  }

  // Retry all failed files
  const handleRetryFailedFiles = async () => {
    try {
      const response = await codegenAPI.retryFailedFiles(projectId, { priority: 'high' })
      if (!response.success) {
        setError('Failed to retry failed files')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retry failed files')
    }
  }

  // Stop generation
  const handleStopGeneration = async () => {
    try {
      await codegenAPI.stopGeneration(projectId)
      setIsGenerating(false)
    } catch (err: any) {
      setError(err.message || 'Failed to stop generation')
    }
  }

  // Toggle file selection
  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev =>
      prev.includes(filePath)
        ? prev.filter(p => p !== filePath)
        : [...prev, filePath]
    )
  }

  // Select all files
  const selectAllFiles = () => {
    if (!manifest) return
    setSelectedFiles(manifest.files.map(f => f.path))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedFiles([])
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: FileStatus) => {
    switch (status) {
      case FileStatus.COMPLETED:
        return 'success'
      case FileStatus.FAILED:
        return 'error'
      case FileStatus.IN_PROGRESS:
        return 'warning'
      default:
        return 'secondary'
    }
  }

  // Get status icon
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case FileStatus.COMPLETED:
        return '✅'
      case FileStatus.FAILED:
        return '❌'
      case FileStatus.IN_PROGRESS:
        return '🔄'
      default:
        return '⏸️'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Code Generation Manager</h2>
          {manifest && (
            <div className="text-sm text-gray-600">
              {progress.completedFiles} / {progress.totalFiles} files completed
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {manifest && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(progress.percentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Summary */}
        {manifest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl">⏸️</div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="font-semibold">{progress.pendingFiles}</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl">🔄</div>
              <div className="text-sm text-gray-600">In Progress</div>
              <div className="font-semibold text-blue-600">{progress.inProgressFiles}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl">✅</div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="font-semibold text-green-600">{progress.completedFiles}</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl">❌</div>
              <div className="text-sm text-gray-600">Failed</div>
              <div className="font-semibold text-red-600">{progress.failedFiles}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {!manifest && (
            <Button
              onClick={handleCreateManifest}
              disabled={isValidating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isValidating ? <Loading size="sm" /> : null}
              {isValidating ? 'Creating Manifest...' : 'Create File Manifest'}
            </Button>
          )}

          {manifest && !isGenerating && (
            <Button
              onClick={handleStartGeneration}
              disabled={progress.totalFiles === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Generation
            </Button>
          )}

          {isGenerating && (
            <Button
              onClick={handleStopGeneration}
              className="bg-red-600 hover:bg-red-700"
            >
              Stop Generation
            </Button>
          )}

          {manifest && progress.failedFiles > 0 && (
            <Button
              onClick={handleRetryFailedFiles}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Retry Failed Files ({progress.failedFiles})
            </Button>
          )}
        </div>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Manifest Validation</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Completeness Score</span>
              <Badge variant={validationResult.score >= 80 ? 'success' : 'warning'}>
                {validationResult.score}%
              </Badge>
            </div>
            
            {validationResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2">Errors ({validationResult.errors.length})</h4>
                <ul className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600">
                      • {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-600 mb-2">Warnings ({validationResult.warnings.length})</h4>
                <ul className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-orange-600">
                      • {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* File Manifest Table */}
      {manifest && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">File Manifest ({manifest.files.length} files)</h3>
            <div className="flex gap-2">
              <Button
                onClick={selectAllFiles}
                variant="outline"
                size="sm"
              >
                Select All
              </Button>
              <Button
                onClick={clearSelection}
                variant="outline"
                size="sm"
              >
                Clear Selection
              </Button>
              <Button
                onClick={() => setShowRawManifest(!showRawManifest)}
                variant="outline"
                size="sm"
              >
                {showRawManifest ? 'Hide' : 'Show'} Raw Manifest
              </Button>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-800">
                {selectedFiles.length} of {manifest.files.length} files selected
              </span>
            </div>
          )}

          {/* Raw Manifest Display */}
          {showRawManifest && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(manifest, null, 2)}
              </pre>
            </div>
          )}

          {/* File Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Select</th>
                  <th className="text-left p-3 font-medium">File Path</th>
                  <th className="text-left p-3 font-medium">Purpose</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Attempts</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {manifest.files.map((file: FileManifestEntry) => (
                  <tr key={file.path} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.path)}
                        onChange={() => toggleFileSelection(file.path)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-sm">{file.path}</div>
                      {file.language && (
                        <div className="text-xs text-gray-500">{file.language}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{file.purpose}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span>{getStatusIcon(file.status)}</span>
                        <Badge variant={getStatusBadgeVariant(file.status)}>
                          {file.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {file.error && (
                        <div className="text-xs text-red-600 mt-1">{file.error}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{file.attempts}</span>
                    </td>
                    <td className="p-3">
                      {file.status === FileStatus.FAILED && (
                        <Button
                          onClick={() => handleRetryFile(file.path)}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-800">{error}</span>
            <Button
              onClick={() => setError(null)}
              size="sm"
              variant="outline"
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}