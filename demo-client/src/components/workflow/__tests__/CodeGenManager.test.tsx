// CodeGenManager.test.tsx
// -----------------------
// Unit tests for CodeGenManager component

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CodeGenManager } from '../CodeGenManager'
import { codegenAPI } from '../../../services/codegenService'
import codegenWebSocketService from '../../../services/codegenWebSocket'
import { FileStatus } from '../../../types/codegen'

// Mock services
vi.mock('../../../services/codegenService')
vi.mock('../../../services/codegenWebSocket')

const mockCodegenAPI = vi.mocked(codegenAPI)
const mockWebSocketService = vi.mocked(codegenWebSocketService)

// Mock data
const mockBlueprint = {
  id: 'blueprint-1',
  content: { techStack: ['React', 'Node.js'], features: ['Authentication', 'Dashboard'] },
  rawJson: '{}',
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  status: 'approved' as const,
  techStack: ['React', 'Node.js'],
  features: ['Authentication', 'Dashboard'],
  architecture: {}
}

const mockHLD = {
  id: 'hld-1',
  content: { systemDesign: {}, components: [] },
  rawJson: '{}',
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  status: 'approved' as const,
  systemDesign: {},
  components: [],
  dataFlow: {}
}

const mockLLD = {
  id: 'lld-1',
  content: { 
    detailedDesign: {}, 
    implementation: {
      fileStructure: [],
      dependencies: [],
      configurations: []
    }
  },
  rawJson: '{}',
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  status: 'approved' as const,
  detailedDesign: {},
  implementation: {
    fileStructure: [
      {
        path: 'src/App.tsx',
        type: 'file' as const,
        purpose: 'Main application component'
      },
      {
        path: 'src/components',
        type: 'directory' as const,
        purpose: 'React components directory'
      }
    ],
    dependencies: [
      {
        name: 'react',
        version: '^18.0.0',
        type: 'production' as const,
        purpose: 'React framework'
      },
      {
        name: 'typescript',
        version: '^5.0.0',
        type: 'development' as const,
        purpose: 'TypeScript compiler'
      }
    ],
    configurations: [
      {
        file: 'tsconfig.json',
        settings: { compilerOptions: { strict: true } },
        purpose: 'TypeScript configuration'
      }
    ]
  },
  specifications: {}
}

const mockManifest = {
  id: 'manifest-1',
  projectId: 'project-1',
  files: [
    {
      path: 'src/App.tsx',
      purpose: 'Main application component',
      status: FileStatus.PENDING,
      attempts: 0,
      language: 'typescript'
    },
    {
      path: 'src/components/Dashboard.tsx',
      purpose: 'Dashboard component',
      status: FileStatus.COMPLETED,
      attempts: 1,
      language: 'typescript'
    },
    {
      path: 'src/services/auth.ts',
      purpose: 'Authentication service',
      status: FileStatus.FAILED,
      attempts: 2,
      error: 'Failed to generate authentication logic',
      language: 'typescript'
    }
  ],
  totalFiles: 3,
  completedFiles: 1,
  failedFiles: 1,
  pendingFiles: 1,
  inProgressFiles: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T01:00:00Z',
  version: 1
}

const mockValidationResult = {
  isValid: true,
  errors: [],
  warnings: [
    {
      type: 'missing_feature' as const,
      message: 'User profile management not implemented',
      severity: 'warning' as const
    }
  ],
  missingFiles: [],
  extraFiles: [],
  score: 85
}

describe('CodeGenManager', () => {
  const defaultProps = {
    projectId: 'project-1',
    blueprint: mockBlueprint,
    hld: mockHLD,
    lld: mockLLD
  }

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Setup default mock implementations
    mockWebSocketService.initialize.mockResolvedValue()
    mockWebSocketService.cleanup.mockImplementation(() => { })
    mockWebSocketService.onFileGenerationUpdate.mockReturnValue(() => { })
    mockWebSocketService.onManifestUpdate.mockReturnValue(() => { })
    mockWebSocketService.onProgressUpdate.mockReturnValue(() => { })
    mockWebSocketService.onRetryQueueUpdate.mockReturnValue(() => { })

    mockCodegenAPI.getManifest.mockResolvedValue({
      success: true,
      manifest: null
    })

    mockCodegenAPI.getProgress.mockResolvedValue({
      success: true,
      progress: {
        totalFiles: 0,
        completedFiles: 0,
        failedFiles: 0,
        pendingFiles: 0,
        inProgressFiles: 0,
        percentage: 0
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders initial state correctly', async () => {
    render(<CodeGenManager {...defaultProps} />)

    expect(screen.getByText('Code Generation Manager')).toBeInTheDocument()
    expect(screen.getByText('Create File Manifest')).toBeInTheDocument()

    // Should initialize WebSocket service
    await waitFor(() => {
      expect(mockWebSocketService.initialize).toHaveBeenCalledWith('project-1')
    })
  })

  it('creates manifest when button is clicked', async () => {
    mockCodegenAPI.createManifest.mockResolvedValue({
      success: true,
      manifest: mockManifest,
      validationResult: mockValidationResult
    })

    render(<CodeGenManager {...defaultProps} />)

    const createButton = screen.getByText('Create File Manifest')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockCodegenAPI.createManifest).toHaveBeenCalledWith('project-1', {
        blueprint: mockBlueprint.content,
        hld: mockHLD.content,
        lld: mockLLD.content
      })
    })
  })

  it('displays manifest table when manifest is loaded', async () => {
    mockCodegenAPI.getManifest.mockResolvedValue({
      success: true,
      manifest: mockManifest
    })

    render(<CodeGenManager {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('File Manifest (3 files)')).toBeInTheDocument()
      expect(screen.getByText('src/App.tsx')).toBeInTheDocument()
      expect(screen.getByText('src/components/Dashboard.tsx')).toBeInTheDocument()
      expect(screen.getByText('src/services/auth.ts')).toBeInTheDocument()
    })
  })

  it('displays progress correctly', async () => {
    mockCodegenAPI.getManifest.mockResolvedValue({
      success: true,
      manifest: mockManifest
    })

    render(<CodeGenManager {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('1 / 3 files completed')).toBeInTheDocument()
    })

    // Check individual status counts
    expect(screen.getByText('1')).toBeInTheDocument() // Completed count
    expect(screen.getByText('1')).toBeInTheDocument() // Failed count  
    expect(screen.getByText('1')).toBeInTheDocument() // Pending count
  })

  it('displays validation results', async () => {
    mockCodegenAPI.createManifest.mockResolvedValue({
      success: true,
      manifest: mockManifest,
      validationResult: mockValidationResult
    })

    render(<CodeGenManager {...defaultProps} />)

    const createButton = screen.getByText('Create File Manifest')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Manifest Validation')).toBeInTheDocument()
      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('Warnings (1)')).toBeInTheDocument()
      expect(screen.getByText(/User profile management/)).toBeInTheDocument()
    })
  })

  it('handles file selection', async () => {
    mockCodegenAPI.getManifest.mockResolvedValue({
      success: true,
      manifest: mockManifest
    })

    render(<CodeGenManager {...defaultProps} />)

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(3) // One for each file
    })

    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(firstCheckbox)

    expect(screen.getByText('1 of 3 files selected')).toBeInTheDocument()
  })

  it('handles retry file action', async () => {
    mockCodegenAPI.getManifest.mockResolvedValue({
      success: true,
      manifest: mockManifest
    })

    mockCodegenAPI.retryFile.mockResolvedValue({
      success: true,
      filePath: 'src/services/auth.ts'
    })

    render(<CodeGenManager {...defaultProps} />)

    await waitFor(() => {
      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)
    })

    await waitFor(() => {
      expect(mockCodegenAPI.retryFile).toHaveBeenCalledWith(
        'project-1',
        'src/services/auth.ts',
        { priority: 'high' }
      )
    })
  })

  it('handles bulk retry failed files', async () => {
    mockCodegenAPI.getManifest.mockResolvedValue({
      success: true,
      manifest: mockManifest
    })

    mockCodegenAPI.retryFailedFiles.mockResolvedValue({
      success: true,
      retriedFiles: ['src/services/auth.ts'],
      failedRetries: [],
      message: 'Retried 1 file'
    })

    render(<CodeGenManager {...defaultProps} />)

    await waitFor(() => {
      const retryButton = screen.getByText('Retry Failed Files (1)')
      fireEvent.click(retryButton)
    })

    await waitFor(() => {
      expect(mockCodegenAPI.retryFailedFiles).toHaveBeenCalledWith(
        'project-1',
        { priority: 'high' }
      )
    })
  })

  it('starts generation when button is clicked', async () => {
    mockCodegenAPI.getManifest.mockResolvedValue({
      success: true,
      manifest: mockManifest
    })

    mockCodegenAPI.startGeneration.mockResolvedValue({
      success: true,
      jobId: 'job-123',
      manifest: mockManifest
    })

    render(<CodeGenManager {...defaultProps} />)

    await waitFor(() => {
      const startButton = screen.getByText('Start Generation')
      fireEvent.click(startButton)
    })

    await waitFor(() => {
      expect(mockCodegenAPI.startGeneration).toHaveBeenCalledWith(
        'project-1',
        {
          manifestId: 'manifest-1',
          selectedFiles: undefined
        }
      )
    })
  })

  it('handles errors gracefully', async () => {
    mockCodegenAPI.createManifest.mockRejectedValue(new Error('API Error'))

    render(<CodeGenManager {...defaultProps} />)

    const createButton = screen.getByText('Create File Manifest')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('❌')).toBeInTheDocument()
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  it('cleans up WebSocket on unmount', () => {
    const { unmount } = render(<CodeGenManager {...defaultProps} />)

    unmount()

    expect(mockWebSocketService.cleanup).toHaveBeenCalled()
  })
})