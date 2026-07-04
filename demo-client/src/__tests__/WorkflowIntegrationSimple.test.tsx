import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WorkflowPage from '../pages/WorkflowPage';
import DashboardPage from '../pages/DashboardPage';
import useWorkflowStore, { WorkflowStage, StageStatus } from '../stores/workflowStore';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';

// Mock all external dependencies
vi.mock('../services/planningService');
vi.mock('../services/blueprintService');
vi.mock('../services/designService');
vi.mock('../services/codegenService');
vi.mock('../services/projectService');
vi.mock('../services/websocket');
vi.mock('../hooks/useWebSocket', () => ({
  useRealTimeUpdates: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: false
  }))
}));

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ projectId: 'test-project-1' }),
    useNavigate: () => vi.fn()
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

describe('Final Integration and Workflow Testing', () => {
  beforeEach(() => {
    // Reset stores
    useWorkflowStore.setState({
      currentStage: WorkflowStage.PLANNING,
      stageStatus: {
        [WorkflowStage.PLANNING]: StageStatus.NOT_STARTED,
        [WorkflowStage.BLUEPRINT]: StageStatus.NOT_STARTED,
        [WorkflowStage.HLD]: StageStatus.NOT_STARTED,
        [WorkflowStage.LLD]: StageStatus.NOT_STARTED,
        [WorkflowStage.CODEGEN]: StageStatus.NOT_STARTED,
        [WorkflowStage.COMPLETED]: StageStatus.NOT_STARTED
      },
      stageResults: {},
      loading: false,
      error: null,
      planningResult: null,
      blueprintResult: null,
      hldResult: null,
      lldResult: null,
      codegenResult: null
    });

    useUIStore.setState({
      toasts: [],
      globalLoading: false,
      loadingMessage: null,
      sidebarCollapsed: false,
      modals: {
        newProject: false,
        confirmDelete: false,
        viewRawJson: false,
        planningHelp: false,
        codegenProgress: false
      }
    });

    // Mock authenticated user
    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'mock-token',
      isAuthenticated: true
    });
  });

  describe('Unified WorkflowPage Integration', () => {
    it('should render unified WorkflowPage with all components integrated', async () => {
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByText('Workflow')).toBeInTheDocument();
      });

      // Verify all workflow stages are present in stepper
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('Blueprint')).toBeInTheDocument();
      expect(screen.getByText('HLD')).toBeInTheDocument();
      expect(screen.getByText('LLD')).toBeInTheDocument();
      expect(screen.getByText('CodeGen')).toBeInTheDocument();

      // Verify three-panel layout exists
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should show planning stage content by default', async () => {
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show planning form elements
        expect(screen.getByText(/project/i)).toBeInTheDocument();
      });
    });

    it('should handle stage transitions correctly', async () => {
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Planning')).toBeInTheDocument();
      });

      // Simulate stage completion and transition
      const workflowStore = useWorkflowStore.getState();
      workflowStore.updateStageStatus(WorkflowStage.PLANNING, StageStatus.COMPLETED);
      workflowStore.setCurrentStage(WorkflowStage.BLUEPRINT);

      // Verify stage transition
      await waitFor(() => {
        const planningElement = screen.getByText('Planning').closest('button');
        expect(planningElement).not.toHaveClass('bg-blue-600'); // No longer active
      });
    });

    it('should persist data across stage transitions', async () => {
      const workflowStore = useWorkflowStore.getState();
      
      // Set some planning data
      workflowStore.setPlanningResult({
        id: 'planning-1',
        answers: { projectName: 'Test Project', description: 'Test Description' },
        submittedAt: new Date().toISOString(),
        version: 1
      });

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Move to blueprint stage
      workflowStore.setCurrentStage(WorkflowStage.BLUEPRINT);
      workflowStore.updateStageStatus(WorkflowStage.PLANNING, StageStatus.COMPLETED);

      // Go back to planning
      workflowStore.setCurrentStage(WorkflowStage.PLANNING);

      await waitFor(() => {
        // Data should still be available
        expect(workflowStore.planningResult?.answers.projectName).toBe('Test Project');
      });
    });

    it('should handle WebSocket real-time updates', async () => {
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Planning')).toBeInTheDocument();
      });

      // Simulate WebSocket update
      const uiStore = useUIStore.getState();
      uiStore.addToast({
        type: 'info',
        message: 'Workflow stage updated',
        duration: 3000
      });

      // Verify toast appears
      await waitFor(() => {
        expect(screen.getByText('Workflow stage updated')).toBeInTheDocument();
      });
    });

    it('should handle error states gracefully', async () => {
      // Set error state
      useWorkflowStore.setState({
        loading: false,
        error: 'Failed to load workflow'
      });

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error loading workflow/i)).toBeInTheDocument();
        expect(screen.getByText('Failed to load workflow')).toBeInTheDocument();
      });

      // Should show back to dashboard button
      expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
    });

    it('should show loading states appropriately', async () => {
      // Set loading state
      useWorkflowStore.setState({
        loading: true,
        error: null
      });

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Should show loading spinner
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading component
    });

    it('should handle responsive layout correctly', async () => {
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Workflow')).toBeInTheDocument();
      });

      // Should have mobile menu button (hidden on desktop)
      const mobileMenuButtons = screen.getAllByRole('button');
      const menuButton = mobileMenuButtons.find(button => 
        button.querySelector('svg') && button.className.includes('lg:hidden')
      );
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Complete User Journey Validation', () => {
    it('should support complete workflow progression', async () => {
      const workflowStore = useWorkflowStore.getState();

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Start at planning
      expect(workflowStore.currentStage).toBe(WorkflowStage.PLANNING);

      // Complete planning
      workflowStore.updateStageStatus(WorkflowStage.PLANNING, StageStatus.COMPLETED);
      workflowStore.setCurrentStage(WorkflowStage.BLUEPRINT);

      // Complete blueprint
      workflowStore.updateStageStatus(WorkflowStage.BLUEPRINT, StageStatus.COMPLETED);
      workflowStore.setCurrentStage(WorkflowStage.HLD);

      // Complete HLD
      workflowStore.updateStageStatus(WorkflowStage.HLD, StageStatus.COMPLETED);
      workflowStore.setCurrentStage(WorkflowStage.LLD);

      // Complete LLD
      workflowStore.updateStageStatus(WorkflowStage.LLD, StageStatus.COMPLETED);
      workflowStore.setCurrentStage(WorkflowStage.CODEGEN);

      // Complete CodeGen
      workflowStore.updateStageStatus(WorkflowStage.CODEGEN, StageStatus.COMPLETED);
      workflowStore.setCurrentStage(WorkflowStage.COMPLETED);

      // Verify final state
      expect(workflowStore.currentStage).toBe(WorkflowStage.COMPLETED);
      expect(workflowStore.stageStatus[WorkflowStage.PLANNING]).toBe(StageStatus.COMPLETED);
      expect(workflowStore.stageStatus[WorkflowStage.BLUEPRINT]).toBe(StageStatus.COMPLETED);
      expect(workflowStore.stageStatus[WorkflowStage.HLD]).toBe(StageStatus.COMPLETED);
      expect(workflowStore.stageStatus[WorkflowStage.LLD]).toBe(StageStatus.COMPLETED);
      expect(workflowStore.stageStatus[WorkflowStage.CODEGEN]).toBe(StageStatus.COMPLETED);
    });

    it('should validate all requirements are addressable through the interface', async () => {
      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Workflow')).toBeInTheDocument();
      });

      // Requirement 4.1: Unified WorkflowPage ✓
      expect(screen.getByText('Workflow')).toBeInTheDocument();

      // Requirement 4.2: Left sidebar with stages ✓
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('Blueprint')).toBeInTheDocument();
      expect(screen.getByText('HLD')).toBeInTheDocument();
      expect(screen.getByText('LLD')).toBeInTheDocument();
      expect(screen.getByText('CodeGen')).toBeInTheDocument();

      // Requirement 4.4: Stage navigation ✓
      const planningButton = screen.getByText('Planning').closest('button');
      expect(planningButton).toBeInTheDocument();

      // Requirement 4.5: Stage-specific content area ✓
      expect(screen.getByRole('main')).toBeInTheDocument();

      // WebSocket status indicator should be present
      expect(screen.getByTitle(/real-time updates/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle initialization errors', async () => {
      useWorkflowStore.setState({
        loading: false,
        error: 'Initialization failed'
      });

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading workflow/i)).toBeInTheDocument();
        expect(screen.getByText('Initialization failed')).toBeInTheDocument();
      });
    });

    it('should provide recovery actions', async () => {
      useWorkflowStore.setState({
        loading: false,
        error: 'Network error'
      });

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
      });
    });
  });

  describe('State Management Integration', () => {
    it('should maintain consistent state across components', async () => {
      const workflowStore = useWorkflowStore.getState();
      const uiStore = useUIStore.getState();

      render(
        <TestWrapper>
          <WorkflowPage />
        </TestWrapper>
      );

      // Test state updates
      workflowStore.setCurrentStage(WorkflowStage.BLUEPRINT);
      uiStore.addToast({
        type: 'success',
        message: 'Stage updated',
        duration: 3000
      });

      await waitFor(() => {
        expect(workflowStore.currentStage).toBe(WorkflowStage.BLUEPRINT);
        expect(uiStore.toasts).toHaveLength(1);
      });
    });
  });
});