import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Menu, X } from "lucide-react";
import useWorkflowStore, { WorkflowStage, StageStatus } from "../stores/workflowStore";
import useUIStore from "../stores/uiStore";
import { WorkflowStepper, WorkflowContent, WorkflowActions } from "../components/workflow";
import { Button } from "../components/ui/Button";
import { Loading } from "../components/ui/Loading";
import { WebSocketStatusIndicator } from "../components/ui/WebSocketStatus";
import { useRealTimeUpdates } from "../hooks/useWebSocket";
import { 
  WorkflowStageUpdateData, 
  WorkflowStatusUpdateData,
  FileGenerationUpdateData,
  FileGenerationProgressData,
  ExecutionLogData 
} from "../services/websocket";

export default function WorkflowPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const {
    initializeWorkflow,
    currentStage,
    stageStatus,
    loading,
    error,
    clearWorkflow,
    setCurrentStage,
    updateStageStatus,
    codegenResult
  } = useWorkflowStore();
  
  const { sidebarCollapsed, setSidebarCollapsed, addToast } = useUIStore();

  // WebSocket event handlers
  const handleWorkflowStageUpdate = useCallback((data: WorkflowStageUpdateData) => {
    console.log('Workflow stage update:', data);
    
    // Update current stage if it changed
    if (data.stage !== currentStage) {
      setCurrentStage(data.stage as WorkflowStage);
      
      addToast({
        type: 'info',
        message: `Workflow moved to ${data.stage} stage`,
        duration: 3000
      });
    }
  }, [currentStage, setCurrentStage, addToast]);

  const handleWorkflowStatusUpdate = useCallback((data: WorkflowStatusUpdateData) => {
    console.log('Workflow status update:', data);
    
    // Update stage status
    updateStageStatus(data.stage as WorkflowStage, data.status as StageStatus);
    
    // Show toast for important status changes
    if (data.status === 'completed') {
      addToast({
        type: 'success',
        message: `${data.stage} stage completed successfully`,
        duration: 5000
      });
    } else if (data.status === 'failed') {
      addToast({
        type: 'error',
        message: `${data.stage} stage failed`,
        duration: 5000
      });
    }
  }, [updateStageStatus, addToast]);

  const handleFileGenerationUpdate = useCallback((data: FileGenerationUpdateData) => {
    console.log('File generation update:', data);
    
    // Update file status in codegen result if available
    if (codegenResult?.manifest) {
      const updatedManifest = {
        ...codegenResult.manifest,
        files: codegenResult.manifest.files.map(file =>
          file.path === data.filePath
            ? { 
                ...file, 
                status: data.status,
                error: data.error,
                attempts: data.attempts,
                lastModified: data.timestamp
              }
            : file
        )
      };

      // Update manifest in store (this would need to be added to the store)
      // For now, just log the update
      console.log('Updated manifest:', updatedManifest);
    }

    // Show toast for file completion or failure
    if (data.status === 'completed') {
      addToast({
        type: 'success',
        message: `Generated ${data.filePath}`,
        duration: 3000
      });
    } else if (data.status === 'failed') {
      addToast({
        type: 'error',
        message: `Failed to generate ${data.filePath}: ${data.error}`,
        duration: 5000
      });
    }
  }, [codegenResult, addToast]);

  const handleFileGenerationProgress = useCallback((data: FileGenerationProgressData) => {
    console.log('File generation progress:', data);
    
    // Update progress in UI store or workflow store
    // This could be used to update a progress bar
    if (data.currentFile) {
      addToast({
        type: 'info',
        message: `Generating ${data.currentFile} (${data.completedFiles}/${data.totalFiles})`,
        duration: 2000
      });
    }
  }, [addToast]);

  const handleExecutionLog = useCallback((data: ExecutionLogData) => {
    console.log('Execution log:', data);
    
    // Show error logs as toasts
    if (data.type === 'error' || data.level === 'error') {
      addToast({
        type: 'error',
        message: `Execution error: ${data.message}`,
        duration: 5000
      });
    }
  }, [addToast]);

  // Set up real-time updates
  const webSocket = useRealTimeUpdates(projectId || null, {
    onWorkflowStageUpdate: handleWorkflowStageUpdate,
    onWorkflowStatusUpdate: handleWorkflowStatusUpdate,
    onFileGenerationUpdate: handleFileGenerationUpdate,
    onFileGenerationProgress: handleFileGenerationProgress,
    onExecutionLog: handleExecutionLog
  });

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard');
      return;
    }
    
    initializeWorkflow(projectId);
    
    // Cleanup on unmount
    return () => {
      clearWorkflow();
    };
  }, [projectId, initializeWorkflow, clearWorkflow, navigate]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Workflow</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleBackToDashboard} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - WorkflowStepper */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToDashboard}
                  className="p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">Workflow</h1>
                <WebSocketStatusIndicator projectId={projectId} />
              </div>
            )}
            <div className="flex items-center space-x-2">
              {sidebarCollapsed && (
                <WebSocketStatusIndicator projectId={projectId} />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2 lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* WorkflowStepper */}
          <div className="flex-1 overflow-y-auto">
            <WorkflowStepper
              currentStage={currentStage}
              stageStatus={stageStatus}
              collapsed={sidebarCollapsed}
            />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2"
              >
                <Menu className="w-4 h-4" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Workflow</h1>
              <WebSocketStatusIndicator projectId={projectId} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content and Actions Layout */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* Main content area */}
          <div className="flex-1 overflow-y-auto">
            <WorkflowContent 
              currentStage={currentStage}
              projectId={projectId!}
            />
          </div>

          {/* Actions panel */}
          <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200">
            <WorkflowActions 
              currentStage={currentStage}
              stageStatus={stageStatus}
              projectId={projectId!}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
