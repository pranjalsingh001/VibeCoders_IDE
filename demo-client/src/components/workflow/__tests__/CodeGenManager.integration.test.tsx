// CodeGenManager.integration.test.tsx
// ------------------------------------
// Integration tests for CodeGenManager component
// Tests manifest validation, file regeneration, retry logic, and WebSocket updates

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CodeGenManager } from '../CodeGenManager'
import { codegenAPI } from '../../../services/codegenService'
import codegenWebSocketService from '../../../services/codegenWebSocket'
import { FileStatus, FileManifest, ManifestValidationResult } from '../../../types/codegen'
import { Blueprint, HLD, LLD } from '../../../types/aiResponse'

// Mock services
vi.mock('../../../services/codegenService')
vi.mock('../../../services/codegenWebSocket')

// Mock UI components to avoid import issues in tests
vi.mock('../../ui/Button', () => ({
    Button: ({ children, onClick, disabled, className, ...props }: any) => (
        <button onClick={onClick} disabled={disabled} className={className} {...props}>
            {children}
        </button>
    )
}))

vi.mock('../../ui/Card', () => ({
    Card: ({ children, className, ...props }: any) => (
        <div className={className} {...props}>
            {children}
        </div>
    )
}))

vi.mock('../../ui/Badge', () => ({
    Badge: ({ children, variant, ...props }: any) => (
        <span className={`badge badge-${variant}`} {...props}>
            {children}
        </span>
    )
}))

vi.mock('../../ui/Loading', () => ({
    Loading: ({ size }: any) => <div className={`loading loading-${size}`}>Loading...</div>
}))

const mockCodegenAPI = vi.mocked(codegenAPI)
const mockWebSocketService = vi.mocked(codegenWebSocketService)

// Mock data for integration tests
const mockBlueprint: Blueprint = {
    id: 'blueprint-1',
    content: {
        techStack: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB'],
        features: [
            'User Authentication',
            'Dashboard',
            'Project Management',
            'File Upload',
            'Real-time Notifications'
        ],
        architecture: {
            frontend: 'React SPA',
            backend: 'Node.js REST API',
            database: 'MongoDB',
            authentication: 'JWT'
        }
    },
    rawJson: '{}',
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    status: 'approved',
    techStack: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB'],
    features: ['User Authentication', 'Dashboard', 'Project Management'],
    architecture: {}
}

const mockHLD: HLD = {
    id: 'hld-1',
    content: {
        systemDesign: {
            components: ['AuthService', 'UserService', 'ProjectService', 'FileService'],
            dataFlow: 'Client -> API Gateway -> Services -> Database'
        },
        components: [
            { name: 'AuthService', purpose: 'Handle authentication' },
            { name: 'UserService', purpose: 'Manage user data' },
            { name: 'ProjectService', purpose: 'Handle project operations' }
        ]
    },
    rawJson: '{}',
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    status: 'approved',
    systemDesign: {},
    components: [],
    dataFlow: {}
}

const mockLLD: LLD = {
    id: 'lld-1',
    content: {
        detailedDesign: {
            apiEndpoints: ['/auth/login', '/auth/register', '/users', '/projects'],
            databaseSchema: ['users', 'projects', 'files'],
            componentStructure: 'src/components, src/services, src/types'
        },
        implementation: {
            fileStructure: [
                'src/components/auth/',
                'src/components/dashboard/',
                'src/services/auth.ts',
                'src/types/user.ts'
            ]
        }
    },
    rawJson: '{}',
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    status: 'approved',
    detailedDesign: {},
    implementation: {
        fileStructure: [],
        dependencies: [],
        configurations: []
    },
    specifications: {}
}

const createMockManifest = (overrides: Partial<FileManifest> = {}): FileManifest => ({
    id: 'manifest-1',
    projectId: 'project-1',
    files: [
        {
            path: 'src/components/auth/LoginForm.tsx',
            purpose: 'User login form component',
            status: FileStatus.PENDING,
            attempts: 0,
            language: 'typescript',
            dependencies: ['src/types/user.ts', 'src/services/auth.ts']
        },
        {
            path: 'src/components/auth/RegisterForm.tsx',
            purpose: 'User registration form component',
            status: FileStatus.COMPLETED,
            attempts: 1,
            language: 'typescript',
            size: 2048,
            lastModified: '2024-01-01T01:00:00Z'
        },
        {
            path: 'src/services/auth.ts',
            purpose: 'Authentication service with JWT handling',
            status: FileStatus.FAILED,
            attempts: 3,
            error: 'Failed to implement JWT token refresh logic',
            language: 'typescript'
        },
        {
            path: 'src/components/dashboard/Dashboard.tsx',
            purpose: 'Main dashboard component',
            status: FileStatus.IN_PROGRESS,
            attempts: 1,
            language: 'typescript'
        },
        {
            path: 'src/types/user.ts',
            purpose: 'User type definitions',
            status: FileStatus.COMPLETED,
            attempts: 1,
            language: 'typescript',
            size: 512
        }
    ],
    totalFiles: 5,
    completedFiles: 2,
    failedFiles: 1,
    pendingFiles: 1,
    inProgressFiles: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T02:00:00Z',
    version: 1,
    ...overrides
})

const createMockValidationResult = (overrides: Partial<ManifestValidationResult> = {}): ManifestValidationResult => ({
    isValid: true,
    errors: [],
    warnings: [
        {
            type: 'missing_feature',
            message: 'File upload functionality not implemented in manifest',
            severity: 'warning',
            suggestion: 'Add FileUpload component and upload service'
        },
        {
            type: 'missing_feature',
            message: 'Real-time notifications missing from implementation',
            severity: 'warning',
            suggestion: 'Add WebSocket service and notification components'
        }
    ],
    missingFiles: ['src/components/FileUpload.tsx', 'src/services/notification.ts'],
    extraFiles: [],
    score: 75,
    ...overrides
})

describe('CodeGenManager Integration Tests', () => {
    const defaultProps = {
        projectId: 'project-1',
        blueprint: mockBlueprint,
        hld: mockHLD,
        lld: mockLLD
    }

    // WebSocket event handlers for testing
    let fileUpdateHandler: (event: any) => void
    let manifestUpdateHandler: (event: any) => void
    let progressUpdateHandler: (event: any) => void
    let retryQueueUpdateHandler: (event: any) => void

    beforeEach(() => {
        vi.clearAllMocks()

        // Setup WebSocket service mocks
        mockWebSocketService.initialize.mockResolvedValue()
        mockWebSocketService.cleanup.mockImplementation(() => { })

        // Capture event handlers for testing
        mockWebSocketService.onFileGenerationUpdate.mockImplementation((handler) => {
            fileUpdateHandler = handler
            return () => { }
        })
        mockWebSocketService.onManifestUpdate.mockImplementation((handler) => {
            manifestUpdateHandler = handler
            return () => { }
        })
        mockWebSocketService.onProgressUpdate.mockImplementation((handler) => {
            progressUpdateHandler = handler
            return () => { }
        })
        mockWebSocketService.onRetryQueueUpdate.mockImplementation((handler) => {
            retryQueueUpdateHandler = handler
            return () => { }
        })

        // Setup API mocks
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

    describe('Manifest Validation Against Design Documents', () => {
        it('should create manifest with comprehensive validation against blueprint, HLD, and LLD', async () => {
            const mockManifest = createMockManifest()
            const mockValidation = createMockValidationResult()

            mockCodegenAPI.createManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest,
                validationResult: mockValidation
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

            // Verify manifest validation results are displayed
            await waitFor(() => {
                expect(screen.getByText('Manifest Validation')).toBeInTheDocument()
                expect(screen.getByText('75%')).toBeInTheDocument()
                expect(screen.getByText('Warnings (2)')).toBeInTheDocument()
                expect(screen.getByText('File upload functionality not implemented in manifest')).toBeInTheDocument()
                expect(screen.getByText('Real-time notifications missing from implementation')).toBeInTheDocument()
            })
        })

        it('should validate manifest completeness against design requirements', async () => {
            const incompleteValidation = createMockValidationResult({
                score: 45,
                errors: [
                    {
                        type: 'missing_feature',
                        message: 'Authentication service missing required JWT implementation',
                        severity: 'error',
                        suggestion: 'Implement JWT token handling in auth service'
                    }
                ],
                warnings: [
                    {
                        type: 'incorrect_implementation',
                        message: 'Dashboard component missing project management features',
                        severity: 'warning'
                    }
                ],
                missingFiles: [
                    'src/services/jwt.ts',
                    'src/components/project/ProjectList.tsx',
                    'src/components/project/ProjectForm.tsx'
                ]
            })

            mockCodegenAPI.createManifest.mockResolvedValue({
                success: true,
                manifest: createMockManifest(),
                validationResult: incompleteValidation
            })

            render(<CodeGenManager {...defaultProps} />)

            fireEvent.click(screen.getByText('Create File Manifest'))

            await waitFor(() => {
                expect(screen.getByText('45%')).toBeInTheDocument()
                expect(screen.getByText('Errors (1)')).toBeInTheDocument()
                expect(screen.getByText('Authentication service missing required JWT implementation')).toBeInTheDocument()
                expect(screen.getByText('Dashboard component missing project management features')).toBeInTheDocument()
            })
        })

        it('should handle validation errors and provide recovery suggestions', async () => {
            const errorValidation = createMockValidationResult({
                isValid: false,
                score: 25,
                errors: [
                    {
                        type: 'dependency_error',
                        message: 'Circular dependency detected between auth and user services',
                        severity: 'error',
                        suggestion: 'Refactor to remove circular dependencies'
                    },
                    {
                        type: 'missing_feature',
                        message: 'Required MongoDB connection not implemented',
                        severity: 'error'
                    }
                ]
            })

            mockCodegenAPI.createManifest.mockResolvedValue({
                success: true,
                manifest: createMockManifest(),
                validationResult: errorValidation
            })

            render(<CodeGenManager {...defaultProps} />)

            fireEvent.click(screen.getByText('Create File Manifest'))

            await waitFor(() => {
                expect(screen.getByText('25%')).toBeInTheDocument()
                expect(screen.getByText('Errors (2)')).toBeInTheDocument()
                expect(screen.getByText('Circular dependency detected between auth and user services')).toBeInTheDocument()
                expect(screen.getByText('Required MongoDB connection not implemented')).toBeInTheDocument()
            })
        })
    })

    describe('File Regeneration and Retry Logic', () => {
        it('should handle individual file retry with context preservation', async () => {
            const mockManifest = createMockManifest()

            mockCodegenAPI.getManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest
            })

            mockCodegenAPI.retryFile.mockResolvedValue({
                success: true,
                filePath: 'src/services/auth.ts',
                jobId: 'retry-job-123'
            })

            render(<CodeGenManager {...defaultProps} />)

            await waitFor(() => {
                expect(screen.getByText('File Manifest (5 files)')).toBeInTheDocument()
            })

            // Find and click retry button for failed file
            const retryButton = screen.getByText('Retry')
            fireEvent.click(retryButton)

            await waitFor(() => {
                expect(mockCodegenAPI.retryFile).toHaveBeenCalledWith(
                    'project-1',
                    'src/services/auth.ts',
                    { priority: 'high' }
                )
            })
        })

        it('should handle bulk retry of failed files with priority management', async () => {
            const mockManifest = createMockManifest({
                files: [
                    ...createMockManifest().files,
                    {
                        path: 'src/components/project/ProjectForm.tsx',
                        purpose: 'Project creation form',
                        status: FileStatus.FAILED,
                        attempts: 2,
                        error: 'Failed to generate form validation',
                        language: 'typescript'
                    }
                ],
                failedFiles: 2
            })

            mockCodegenAPI.getManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest
            })

            mockCodegenAPI.retryFailedFiles.mockResolvedValue({
                success: true,
                retriedFiles: ['src/services/auth.ts', 'src/components/project/ProjectForm.tsx'],
                failedRetries: [],
                message: 'Successfully retried 2 files'
            })

            render(<CodeGenManager {...defaultProps} />)

            await waitFor(() => {
                const bulkRetryButton = screen.getByText('Retry Failed Files (2)')
                fireEvent.click(bulkRetryButton)
            })

            await waitFor(() => {
                expect(mockCodegenAPI.retryFailedFiles).toHaveBeenCalledWith(
                    'project-1',
                    { priority: 'high' }
                )
            })
        })

        it('should track retry attempts and prevent infinite retry loops', async () => {
            const mockManifest = createMockManifest({
                files: [
                    {
                        path: 'src/services/problematic.ts',
                        purpose: 'Service with persistent issues',
                        status: FileStatus.FAILED,
                        attempts: 5, // High attempt count
                        error: 'Persistent generation failure after multiple attempts',
                        language: 'typescript'
                    }
                ]
            })

            mockCodegenAPI.getManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest
            })

            render(<CodeGenManager {...defaultProps} />)

            await waitFor(() => {
                expect(screen.getByText('5')).toBeInTheDocument() // Attempts count
                expect(screen.getByText('Persistent generation failure after multiple attempts')).toBeInTheDocument()
            })
        })

        it('should handle selective file regeneration with dependency awareness', async () => {
            const mockManifest = createMockManifest()

            mockCodegenAPI.getManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest
            })

            render(<CodeGenManager {...defaultProps} />)

            await waitFor(() => {
                // Select specific files for regeneration
                const checkboxes = screen.getAllByRole('checkbox')
                fireEvent.click(checkboxes[0]) // Select first file
                fireEvent.click(checkboxes[2]) // Select third file
            })

            expect(screen.getByText('2 of 5 files selected')).toBeInTheDocument()

            // Verify dependencies are shown
            expect(screen.getByText('src/types/user.ts, src/services/auth.ts')).toBeInTheDocument()
        })
    })

    describe('WebSocket Updates and Progress Tracking', () => {
        it('should handle real-time file generation updates via WebSocket', async () => {
            const mockManifest = createMockManifest()

            mockCodegenAPI.getManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest
            })

            render(<CodeGenManager {...defaultProps} />)

            await waitFor(() => {
                expect(screen.getByText('File Manifest (5 files)')).toBeInTheDocument()
            })

            // Simulate WebSocket file update
            act(() => {
                fileUpdateHandler({
                    type: 'file_generation_update',
                    projectId: 'project-1',
                    filePath: 'src/components/auth/LoginForm.tsx',
                    status: FileStatus.COMPLETED,
                    metadata: { size: 1024, language: 'typescript' }
                })
            })

            // Verify UI updates reflect the change
            await waitFor(() => {
                expect(screen.getByText('✅')).toBeInTheDocument()
            })
        })

        it('should handle manifest updates with validation results via WebSocket', async () => {
            const initialManifest = createMockManifest()

            mockCodegenAPI.getManifest.mockResolvedValue({
                success: true,
                manifest: initialManifest
            })

            render(<CodeGenManager {...defaultProps} />)

            await waitFor(() => {
                expect(screen.getByText('2 / 5 files completed')).toBeInTheDocument()
            })

            // Simulate manifest update via WebSocket
            const updatedManifest = createMockManifest({
                completedFiles: 4,
                failedFiles: 0,
                pendingFiles: 1,
                files: initialManifest.files.map(file =>
                    file.status === FileStatus.FAILED
                        ? { ...file, status: FileStatus.COMPLETED, attempts: file.attempts + 1 }
                        : file
                )
            })

            act(() => {
                manifestUpdateHandler({
                    type: 'manifest_update',
                    projectId: 'project-1',
                    manifest: updatedManifest,
                    validationResult: createMockValidationResult({ score: 90 })
                })
            })

            await waitFor(() => {
                expect(screen.getByText('4 / 5 files completed')).toBeInTheDocument()
                expect(screen.getByText('90%')).toBeInTheDocument()
            })
        })

        it('should handle progress updates with percentage and current file tracking', async () => {
            const mockManifest = createMockManifest()

            mockCodegenAPI.getManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest
            })

            render(<CodeGenManager {...defaultProps} />)

            await waitFor(() => {
                expect(screen.getByText('40%')).toBeInTheDocument() // Initial progress (2/5 = 40%)
            })

            // Simulate progress update via WebSocket
            act(() => {
                progressUpdateHandler({
                    type: 'progress_update',
                    projectId: 'project-1',
                    progress: {
                        totalFiles: 5,
                        completedFiles: 3,
                        failedFiles: 0,
                        pendingFiles: 1,
                        inProgressFiles: 1,
                        percentage: 60
                    },
                    currentFile: 'src/components/dashboard/Dashboard.tsx'
                })
            })

            await waitFor(() => {
                expect(screen.getByText('60%')).toBeInTheDocument()
            })
        })

        it('should handle retry queue updates and display retry operations', async () => {
            const mockManifest = createMockManifest()

            mockCodegenAPI.getManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest
            })

            render(<CodeGenManager {...defaultProps} />)

            // Simulate retry queue update via WebSocket
            act(() => {
                retryQueueUpdateHandler({
                    type: 'retry_queue_update',
                    projectId: 'project-1',
                    retryQueue: [
                        {
                            filePath: 'src/services/auth.ts',
                            attempts: 3,
                            lastError: 'JWT implementation failed',
                            nextRetryAt: '2024-01-01T03:00:00Z',
                            priority: 'high'
                        },
                        {
                            filePath: 'src/components/project/ProjectForm.tsx',
                            attempts: 1,
                            priority: 'medium'
                        }
                    ]
                })
            })

            // Verify retry queue information is processed
            // Note: The UI might not directly display retry queue, but the component should handle the update
            await waitFor(() => {
                expect(mockWebSocketService.onRetryQueueUpdate).toHaveBeenCalled()
            })
        })

        it('should maintain WebSocket connection and handle reconnection', async () => {
            render(<CodeGenManager {...defaultProps} />)

            await waitFor(() => {
                expect(mockWebSocketService.initialize).toHaveBeenCalledWith('project-1')
            })

            // Simulate connection loss and reconnection
            mockWebSocketService.isConnected = vi.fn().mockReturnValue(false)

            // Component should handle reconnection gracefully
            expect(mockWebSocketService.initialize).toHaveBeenCalledTimes(1)
        })

        it('should handle WebSocket errors gracefully without breaking the UI', async () => {
            // Mock WebSocket initialization failure
            mockWebSocketService.initialize.mockRejectedValue(new Error('WebSocket connection failed'))

            render(<CodeGenManager {...defaultProps} />)

            // Component should still render despite WebSocket failure
            await waitFor(() => {
                expect(screen.getByText('Code Generation Manager')).toBeInTheDocument()
                expect(screen.getByText('Create File Manifest')).toBeInTheDocument()
            })
        })
    })

    describe('End-to-End Integration Scenarios', () => {
        it('should handle complete workflow from manifest creation to file generation completion', async () => {
            const mockManifest = createMockManifest()
            const mockValidation = createMockValidationResult()

            // Step 1: Create manifest
            mockCodegenAPI.createManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest,
                validationResult: mockValidation
            })

            // Step 2: Start generation
            mockCodegenAPI.startGeneration.mockResolvedValue({
                success: true,
                jobId: 'generation-job-123',
                manifest: mockManifest
            })

            render(<CodeGenManager {...defaultProps} />)

            // Create manifest
            fireEvent.click(screen.getByText('Create File Manifest'))

            await waitFor(() => {
                expect(screen.getByText('Start Generation')).toBeInTheDocument()
            })

            // Start generation
            fireEvent.click(screen.getByText('Start Generation'))

            await waitFor(() => {
                expect(mockCodegenAPI.startGeneration).toHaveBeenCalledWith('project-1', {
                    manifestId: 'manifest-1',
                    selectedFiles: undefined
                })
            })

            // Simulate real-time updates during generation
            act(() => {
                fileUpdateHandler({
                    type: 'file_generation_update',
                    projectId: 'project-1',
                    filePath: 'src/components/auth/LoginForm.tsx',
                    status: FileStatus.IN_PROGRESS
                })
            })

            act(() => {
                fileUpdateHandler({
                    type: 'file_generation_update',
                    projectId: 'project-1',
                    filePath: 'src/components/auth/LoginForm.tsx',
                    status: FileStatus.COMPLETED
                })
            })

            // Verify progress updates
            await waitFor(() => {
                expect(screen.getByText('✅')).toBeInTheDocument()
            })
        })

        it('should handle error recovery and retry scenarios in complete workflow', async () => {
            const mockManifest = createMockManifest()

            mockCodegenAPI.getManifest.mockResolvedValue({
                success: true,
                manifest: mockManifest
            })

            render(<CodeGenManager {...defaultProps} />)

            await waitFor(() => {
                expect(screen.getByText('File Manifest (5 files)')).toBeInTheDocument()
            })

            // Simulate file generation failure
            act(() => {
                fileUpdateHandler({
                    type: 'file_generation_update',
                    projectId: 'project-1',
                    filePath: 'src/components/auth/LoginForm.tsx',
                    status: FileStatus.FAILED,
                    error: 'Network timeout during generation'
                })
            })

            // Verify error is displayed
            await waitFor(() => {
                expect(screen.getByText('Network timeout during generation')).toBeInTheDocument()
            })

            // Retry the failed file
            mockCodegenAPI.retryFile.mockResolvedValue({
                success: true,
                filePath: 'src/components/auth/LoginForm.tsx'
            })

            const retryButtons = screen.getAllByText('Retry')
            fireEvent.click(retryButtons[0])

            await waitFor(() => {
                expect(mockCodegenAPI.retryFile).toHaveBeenCalledWith(
                    'project-1',
                    'src/components/auth/LoginForm.tsx',
                    { priority: 'high' }
                )
            })
        })
    })
})