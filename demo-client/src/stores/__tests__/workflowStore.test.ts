// workflowStore.test.ts
// Unit tests for workflow store

import { describe, it, expect, beforeEach, vi } from 'vitest'
import useWorkflowStore, { WorkflowStage, StageStatus } from '../workflowStore'
import { apiClient } from '../../services/api'
import { mockApiResponse, mockApiError, mockProject, mockPlanningResult, mockBlueprint } from '../../test/mocks'

// Mock the API client
vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('WorkflowStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkflowStore.getState().clearWorkflow()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useWorkflowStore.getState()
      
      expect(state.projectId).toBeNull()
      expect(state.currentStage).toBe(WorkflowStage.PLANNING)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.planningResult).toBeNull()
      expect(state.blueprint).toBeNull()
      expect(state.hld).toBeNull()
      expect(state.lld).toBeNull()
      expect(state.codegenResult).toBeNull()
      
      // Check all stages start as NOT_STARTED
      Object.values(WorkflowStage).forEach(stage => {
        expect(state.stageStatus[stage]).toBe(StageStatus.NOT_STARTED)
      })
    })
  })

  describe('initializeWorkflow', () => {
    it('should initialize workflow with project data', async () => {
      const mockWorkflowData = {
        currentStage: WorkflowStage.BLUEPRINT,
        stageStatus: {
          [WorkflowStage.PLANNING]: StageStatus.COMPLETED,
          [WorkflowStage.BLUEPRINT]: StageStatus.IN_PROGRESS,
          [WorkflowStage.HLD]: StageStatus.NOT_STARTED,
          [WorkflowStage.LLD]: StageStatus.NOT_STARTED,
          [WorkflowStage.CODEGEN]: StageStatus.NOT_STARTED,
          [WorkflowStage.COMPLETED]: StageStatus.NOT_STARTED,
        },
        planningResult: mockPlanningResult,
      }

      vi.mocked(apiClient.get).mockResolvedValue(
        mockApiResponse({ workflow: mockWorkflowData })
      )

      const { initializeWorkflow } = useWorkflowStore.getState()
      await initializeWorkflow('test-project-1')

      const state = useWorkflowStore.getState()
      expect(state.projectId).toBe('test-project-1')
      expect(state.currentStage).toBe(WorkflowStage.BLUEPRINT)
      expect(state.stageStatus[WorkflowStage.PLANNING]).toBe(StageStatus.COMPLETED)
      expect(state.planningResult).toEqual(mockPlanningResult)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle initialization error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(mockApiError(500, 'Server error'))

      const { initializeWorkflow } = useWorkflowStore.getState()
      await initializeWorkflow('test-project-1')

      const state = useWorkflowStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Failed to load workflow state')
    })
  })

  describe('Stage Navigation', () => {
    it('should allow navigation to planning stage', () => {
      const { canNavigateToStage } = useWorkflowStore.getState()
      expect(canNavigateToStage(WorkflowStage.PLANNING)).toBe(true)
    })

    it('should prevent navigation to incomplete stages', () => {
      const { canNavigateToStage } = useWorkflowStore.getState()
      expect(canNavigateToStage(WorkflowStage.BLUEPRINT)).toBe(false)
      expect(canNavigateToStage(WorkflowStage.HLD)).toBe(false)
    })

    it('should allow navigation when previous stages are completed', () => {
      const { updateStageStatus, canNavigateToStage } = useWorkflowStore.getState()
      
      updateStageStatus(WorkflowStage.PLANNING, StageStatus.COMPLETED)
      expect(canNavigateToStage(WorkflowStage.BLUEPRINT)).toBe(true)
      expect(canNavigateToStage(WorkflowStage.HLD)).toBe(false)
      
      updateStageStatus(WorkflowStage.BLUEPRINT, StageStatus.COMPLETED)
      expect(canNavigateToStage(WorkflowStage.HLD)).toBe(true)
    })

    it('should set current stage when navigation is allowed', () => {
      const { updateStageStatus, setCurrentStage } = useWorkflowStore.getState()
      
      updateStageStatus(WorkflowStage.PLANNING, StageStatus.COMPLETED)
      setCurrentStage(WorkflowStage.BLUEPRINT)
      
      const state = useWorkflowStore.getState()
      expect(state.currentStage).toBe(WorkflowStage.BLUEPRINT)
    })

    it('should not set current stage when navigation is not allowed', () => {
      const { setCurrentStage } = useWorkflowStore.getState()
      
      setCurrentStage(WorkflowStage.BLUEPRINT)
      
      const state = useWorkflowStore.getState()
      expect(state.currentStage).toBe(WorkflowStage.PLANNING) // Should remain unchanged
    })
  })

  describe('Planning Actions', () => {
    beforeEach(() => {
      useWorkflowStore.setState({ projectId: 'test-project-1' })
    })

    it('should save planning draft', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse({}))

      const { savePlanningDraft } = useWorkflowStore.getState()
      const answers = { question1: 'answer1', question2: 'answer2' }
      
      await savePlanningDraft(answers)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/planning/clarify/answer',
        { answers }
      )
    })

    it('should submit planning answers and progress to blueprint stage', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse({}))

      const { submitPlanning } = useWorkflowStore.getState()
      const answers = { question1: 'answer1', question2: 'answer2' }
      
      await submitPlanning(answers)

      const state = useWorkflowStore.getState()
      expect(state.planningResult).toEqual({
        answers,
        submittedAt: expect.any(String),
        version: 1
      })
      expect(state.stageStatus[WorkflowStage.PLANNING]).toBe(StageStatus.COMPLETED)
      expect(state.stageStatus[WorkflowStage.BLUEPRINT]).toBe(StageStatus.IN_PROGRESS)
      expect(state.currentStage).toBe(WorkflowStage.BLUEPRINT)
      expect(state.loading).toBe(false)
    })

    it('should handle planning submission error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(mockApiError(400, 'Invalid data'))

      const { submitPlanning } = useWorkflowStore.getState()
      const answers = { question1: 'answer1' }
      
      await submitPlanning(answers)

      const state = useWorkflowStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Failed to submit planning answers')
      expect(state.stageStatus[WorkflowStage.PLANNING]).toBe(StageStatus.FAILED)
    })
  })

  describe('AI Response Actions', () => {
    beforeEach(() => {
      useWorkflowStore.setState({ 
        projectId: 'test-project-1',
        blueprint: mockBlueprint
      })
    })

    it('should approve AI response and progress to next stage', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse({}))

      const { approveResponse } = useWorkflowStore.getState()
      await approveResponse(WorkflowStage.BLUEPRINT, 'blueprint-1')

      const state = useWorkflowStore.getState()
      expect(state.blueprint?.status).toBe('approved')
      expect(state.stageStatus[WorkflowStage.BLUEPRINT]).toBe(StageStatus.COMPLETED)
      expect(state.stageStatus[WorkflowStage.HLD]).toBe(StageStatus.IN_PROGRESS)
      // Note: The current stage might not change immediately due to navigation restrictions
      expect(state.currentStage).toBe(WorkflowStage.PLANNING)
    })

    it('should reject AI response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse({}))

      const { rejectResponse } = useWorkflowStore.getState()
      await rejectResponse(WorkflowStage.BLUEPRINT, 'blueprint-1', 'Needs improvement')

      const state = useWorkflowStore.getState()
      expect(state.blueprint?.status).toBe('rejected')
      expect(state.stageStatus[WorkflowStage.BLUEPRINT]).toBe(StageStatus.IN_PROGRESS)
    })

    it('should request modification', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse({}))

      const { requestModification } = useWorkflowStore.getState()
      const changes = { techStack: ['React', 'Node.js', 'PostgreSQL'] }
      
      await requestModification(WorkflowStage.BLUEPRINT, 'blueprint-1', changes)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/projects/test-project-1/blueprint/blueprint-1/modify',
        { changes }
      )
    })
  })

  describe('CodeGen Actions', () => {
    beforeEach(() => {
      useWorkflowStore.setState({ 
        projectId: 'test-project-1',
        blueprint: mockBlueprint,
        hld: { ...mockBlueprint, id: 'hld-1' },
        lld: { ...mockBlueprint, id: 'lld-1' }
      })
    })

    it('should start code generation', async () => {
      const mockManifest = {
        id: 'manifest-1',
        files: [],
        totalFiles: 0,
        completedFiles: 0,
        failedFiles: 0
      }
      
      // Mock both API calls that startCodeGeneration makes
      vi.mocked(apiClient.post)
        .mockResolvedValueOnce(mockApiResponse({ success: true, manifest: mockManifest })) // manifest creation
        .mockResolvedValueOnce(mockApiResponse({ success: true, validationResult: null })) // start generation

      const { startCodeGeneration } = useWorkflowStore.getState()
      await startCodeGeneration()

      const state = useWorkflowStore.getState()
      expect(state.codegenResult?.manifest).toEqual(mockManifest)
      expect(state.stageStatus[WorkflowStage.CODEGEN]).toBe(StageStatus.IN_PROGRESS)
    })

    it('should retry file generation', async () => {
      const mockCodegenResult = {
        manifest: {
          files: [
            { path: 'test.ts', purpose: 'test', status: 'failed' as const, attempts: 1 }
          ],
          totalFiles: 1,
          completedFiles: 0,
          failedFiles: 1
        },
        generatedFiles: [],
        failedFiles: ['test.ts']
      }
      
      useWorkflowStore.setState({ codegenResult: mockCodegenResult })
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse({}))

      const { retryFileGeneration } = useWorkflowStore.getState()
      await retryFileGeneration('test.ts')

      const state = useWorkflowStore.getState()
      const file = state.codegenResult?.manifest.files.find(f => f.path === 'test.ts')
      expect(file?.status).toBe('in_progress')
      expect(file?.attempts).toBe(2)
    })
  })

  describe('Utility Actions', () => {
    it('should clear workflow state', () => {
      // Set some state first
      useWorkflowStore.setState({
        projectId: 'test-project',
        currentStage: WorkflowStage.BLUEPRINT,
        loading: true,
        error: 'Some error'
      })

      const { clearWorkflow } = useWorkflowStore.getState()
      clearWorkflow()

      const state = useWorkflowStore.getState()
      expect(state.projectId).toBeNull()
      expect(state.currentStage).toBe(WorkflowStage.PLANNING)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should update stage status', () => {
      const { updateStageStatus } = useWorkflowStore.getState()
      updateStageStatus(WorkflowStage.PLANNING, StageStatus.COMPLETED)

      const state = useWorkflowStore.getState()
      expect(state.stageStatus[WorkflowStage.PLANNING]).toBe(StageStatus.COMPLETED)
    })
  })
})