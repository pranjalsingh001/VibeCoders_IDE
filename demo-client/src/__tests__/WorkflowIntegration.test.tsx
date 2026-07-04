import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WorkflowPage from '../pages/WorkflowPage';
import DashboardPage from '../pages/DashboardPage';
import WorkspacePage from '../pages/WorkspacePage';
import useWorkflowStore, { WorkflowStage, StageStatus } from '../stores/workflowStore';
import useProjectStore from '../stores/projectStore';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';
import * as planningService from '../services/planningService';
import * as blueprintService from '../services/blueprintService';
import * as designService from '../services/designService';
import * as codegenService from '../services/codegenService';
import * as projectService from '../services/projectService';

// Mock services
vi.mock('../services/planningService');
vi.mock('../services/blueprintService');
vi.mock('../services/designService');
vi.mock('../services/codegenService');
vi.mock('../services/projectService');
vi.mock('../services/websocket');

// Mock WebSocket
const mockWebSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: false
};

vi.mock('../hooks/useWebSocket', () => ({
  useRealTimeUpdates: vi.fn(() => mockWebSocket)
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

describe('Complete Workflow Integration Tests', () => {
  beforeEach(() => {
    // Reset all stores
    useWorkflowStore.getState().clearWorkflow();
    useProjectStore.setState({ projects: [], currentProject: null, loading: false, error: null });
    useUIStore.getState().clearToasts();
    
    // Mock authenticated user
    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'mock-token',
      isAuthenticated: true
    });

    // Mock service responses
    vi.mocked(projectService.projectAPI.list).mockResolvedValue([
      {
        _id: 'test-project-1',
        id: 'test-project-1',
        name: 'Test Project',
        description: 'A test project',
        userId: '1',
        status: 'planned',
        currentStage: 'planning',
        stageResults: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);

    vi.mocked(planningService.savePlanningAnswers).mockResolvedValue({
      id: 'planning-1',
      answers: { projectName: 'Test Project', description: 'Test Description' },
      submittedAt: new Date().toISOString(),
      version: 1
    });

    vi.mocked(blueprintService.generateBlueprint).mockResolvedValue({
      id: 'blueprint-1',
      content: {
        projectName: 'Test Project',
        techStack: ['React', 'Node.js', 'MongoDB'],
        features: ['User Authentication', 'Dashboard', 'API'],
        architecture: { type: 'microservices' }
      },
      techStack: ['React', 'Node.js', 'MongoDB'],
      features: ['User Authentication', 'Dashboard', 'API'],
      architecture: { type: 'microservices' },
      version: 1
    });

    vi.mocked(designService.generateHLD).mockResolvedValue({
      id: 'hld-1',
      content: {
        systemArchitecture: 'Microservices',
        components: ['Frontend', 'API Gateway', 'Auth Service', 'Database'],
        dataFlow: 'REST API'
      },
      version: 1
    });

    vi.mocked(designService.generateLLD).mockResolvedValue({
      id: 'lld-1',
      content: {
        detailedDesign: 'Component specifications',
        interfaces: ['REST API', 'Database Schema'],
        implementation: 'React + Node.js'
      },
      version: 1
    });

    vi.mocked(codegenService.generateCode).mockResolvedValue({
      manifest: {
        files: [
          { path: 'src/App.tsx', purpose: 'Main app component', status: 'completed', attempts: 1 },
          { path: 'src/components/Dashboard.tsx', purpose: 'Dashboard component', status: 'completed', attempts: 1 },
          { path: 'server/index.js', purpose: 'Server entry point', status: 'completed', attempts: 1 }
        ],
        totalFiles: 3,
        completedFiles: 3,
        failedFiles: 0
      },
      generatedFiles: ['src/App.tsx', 'src/components/Dashboard.tsx', 'server/index.js'],
      failedFiles: []
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Workflow Journey', () => {
    it('should complete the entire workflow from project creation to code generation', async () => {
      // 1. Start at Dashboard
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Click on Workflow button
      const workflowButton = screen.getByRole('button', { name: /workflow/i });
      fireEvent.click(workflowButton);

      // 2. Navigate to WorkflowPage (simulate navigation)
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Wait for workflow to initialize
      await waitFor(() => {
        expect(screen.getByText('Planning')).toBeInTheDocument();
      });

      // Verify stepper shows all stages
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('Blueprint')).toBeInTheDocument();
      expect(screen.getByText('HLD')).toBeInTheDocument();
      expect(screen.getByText('LLD')).toBeInTheDocument();
      expect(screen.getByText('CodeGen')).toBeInTheDocument();

      // 3. Complete Planning Stage
      // Fill out planning form
      const projectNameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(projectNameInput, { target: { value: 'Test Project' } });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

      // Submit planning
      const submitButton = screen.getByRole('button', { name: /submit.*generate blueprint/i });
      fireEvent.click(submitButton);

      // Wait for planning to complete and move to blueprint
      await waitFor(() => {
        expect(planningService.savePlanningAnswers).toHaveBeenCalled();
      });

      // 4. Verify Blueprint Stage
      await waitFor(() => {
        expect(screen.getByText(/tech stack/i)).toBeInTheDocument();
      });

      // Verify tech stack badges are displayed
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('MongoDB')).toBeInTheDocument();

      // Approve blueprint
      const approveButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveButton);

      // 5. Verify HLD Stage
      await waitFor(() => {
        expect(screen.getByText(/system architecture/i)).toBeInTheDocument();
      });

      // Approve HLD
      const approveHLDButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveHLDButton);

      // 6. Verify LLD Stage
      await waitFor(() => {
        expect(screen.getByText(/detailed design/i)).toBeInTheDocument();
      });

      // Approve LLD
      const approveLLDButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveLLDButton);

      // 7. Verify CodeGen Stage
      await waitFor(() => {
        expect(screen.getByText(/file manifest/i)).toBeInTheDocument();
      });

      // Verify file manifest is displayed
      expect(screen.getByText('src/App.tsx')).toBeInTheDocument();
      expect(screen.getByText('src/components/Dashboard.tsx')).toBeInTheDocument();
      expect(screen.getByText('server/index.js')).toBeInTheDocument();

      // Start code generation
      const generateButton = screen.getByRole('button', { name: /generate code/i });
      fireEvent.click(generateButton);

      // Wait for code generation to complete
      await waitFor(() => {
        expect(codegenService.generateCode).toHaveBeenCalled();
      });

      // 8. Verify Completed Stage
      await waitFor(() => {
        expect(screen.getByText(/project completed/i)).toBeInTheDocument();
      });

      // Verify workspace button is available
      expect(screen.getByRole('button', { name: /open workspace/i })).toBeInTheDocument();
    });

    it('should handle stage transitions and validation correctly', async () => {
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Wait for workflow to initialize
      await waitFor(() => {
        expect(screen.getByText('Planning')).toBeInTheDocument();
      });

      // Verify current stage is highlighted
      const planningStage = screen.getByText('Planning').closest('button');
      expect(planningStage).toHaveClass('bg-blue-50'); // or whatever active class

      // Try to click on future stages (should be disabled)
      const blueprintStage = screen.getByText('Blueprint').closest('button');
      expect(blueprintStage).toBeDisabled();

      // Complete planning to enable next stage
      const projectNameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(projectNameInput, { target: { value: 'Test Project' } });

      const submitButton = screen.getByRole('button', { name: /submit.*generate blueprint/i });
      fireEvent.click(submitButton);

      // Wait for blueprint stage to become active
      await waitFor(() => {
        expect(blueprintStage).not.toBeDisabled();
      });
    });

    it('should persist data across stage transitions', async () => {
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Complete planning
      const projectNameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(projectNameInput, { target: { value: 'Test Project' } });

      const submitButton = screen.getByRole('button', { name: /submit.*generate blueprint/i });
      fireEvent.click(submitButton);

      // Move to blueprint stage
      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      // Go back to planning stage
      const planningStage = screen.getByText('Planning').closest('button');
      fireEvent.click(planningStage!);

      // Verify data is still there
      await waitFor(() => {
        const input = screen.getByLabelText(/project name/i) as HTMLInputElement;
        expect(input.value).toBe('Test Project');
      });
    });

    it('should handle errors gracefully throughout the workflow', async () => {
      // Mock service to throw error
      vi.mocked(planningService.savePlanningAnswers).mockRejectedValue(
        new Error('Planning service error')
      );

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Try to submit planning
      const projectNameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(projectNameInput, { target: { value: 'Test Project' } });

      const submitButton = screen.getByRole('button', { name: /submit.*generate blueprint/i });
      fireEvent.click(submitButton);

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/planning service error/i)).toBeInTheDocument();
      });

      // Verify user can retry
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Real-time Updates Integration', () => {
    it('should handle WebSocket updates for workflow progress', async () => {
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByText('Planning')).toBeInTheDocument();
      });

      // Simulate WebSocket stage update
      const workflowStore = useWorkflowStore.getState();
      workflowStore.setCurrentStage(WorkflowStage.BLUEPRINT);
      workflowStore.updateStageStatus(WorkflowStage.PLANNING, StageStatus.COMPLETED);

      // Verify UI updates
      await waitFor(() => {
        expect(screen.getByText('Blueprint')).toBeInTheDocument();
      });
    });

    it('should handle file generation progress updates', async () => {
      // Set workflow to codegen stage
      useWorkflowStore.setState({
        currentStage: WorkflowStage.CODEGEN,
        stageStatus: {
          [WorkflowStage.PLANNING]: StageStatus.COMPLETED,
          [WorkflowStage.BLUEPRINT]: StageStatus.COMPLETED,
          [WorkflowStage.HLD]: StageStatus.COMPLETED,
          [WorkflowStage.LLD]: StageStatus.COMPLETED,
          [WorkflowStage.CODEGEN]: StageStatus.IN_PROGRESS,
          [WorkflowStage.COMPLETED]: StageStatus.NOT_STARTED
        }
      });

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Wait for codegen stage to load
      await waitFor(() => {
        expect(screen.getByText(/file manifest/i)).toBeInTheDocument();
      });

      // Simulate file generation progress
      const uiStore = useUIStore.getState();
      uiStore.addToast({
        type: 'info',
        message: 'Generating src/App.tsx (1/3)',
        duration: 2000
      });

      // Verify toast is displayed
      await waitFor(() => {
        expect(screen.getByText(/generating src\/app\.tsx/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workspace Integration', () => {
    it('should navigate to workspace after code generation completion', async () => {
      // Set workflow to completed stage
      useWorkflowStore.setState({
        currentStage: WorkflowStage.COMPLETED,
        stageStatus: {
          [WorkflowStage.PLANNING]: StageStatus.COMPLETED,
          [WorkflowStage.BLUEPRINT]: StageStatus.COMPLETED,
          [WorkflowStage.HLD]: StageStatus.COMPLETED,
          [WorkflowStage.LLD]: StageStatus.COMPLETED,
          [WorkflowStage.CODEGEN]: StageStatus.COMPLETED,
          [WorkflowStage.COMPLETED]: StageStatus.COMPLETED
        }
      });

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Wait for completed stage
      await waitFor(() => {
        expect(screen.getByText(/project completed/i)).toBeInTheDocument();
      });

      // Click workspace button
      const workspaceButton = screen.getByRole('button', { name: /open workspace/i });
      fireEvent.click(workspaceButton);

      // Simulate navigation to workspace
      render(
        <TestWrapper>
          <WorkspacePage />
        </TestWrapper>
      );

      // Verify workspace loads
      await waitFor(() => {
        expect(screen.getByText('Workspace')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from network errors and retry operations', async () => {
      // Mock network error first, then success
      vi.mocked(planningService.savePlanningAnswers)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          id: 'planning-1',
          answers: { projectName: 'Test Project' },
          submittedAt: new Date().toISOString(),
          version: 1
        });

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Submit planning
      const projectNameInput = screen.getByLabelText(/project name/i);
      fireEvent.change(projectNameInput, { target: { value: 'Test Project' } });

      const submitButton = screen.getByRole('button', { name: /submit.*generate blueprint/i });
      fireEvent.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Wait for success
      await waitFor(() => {
        expect(planningService.savePlanningAnswers).toHaveBeenCalledTimes(2);
      });
    });
  });
});