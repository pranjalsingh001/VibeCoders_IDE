import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, RotateCcw, Play, Pause, Settings } from "lucide-react";
import { WorkflowStage, StageStatus } from "../../stores/workflowStore";
import useWorkflowStore from "../../stores/workflowStore";
import { Button } from "../ui/Button";
import { Loading } from "../ui/Loading";

interface WorkflowActionsProps {
  currentStage: WorkflowStage;
  stageStatus: Record<WorkflowStage, StageStatus>;
  projectId: string;
}

export function WorkflowActions({ currentStage, stageStatus, projectId }: WorkflowActionsProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    loading,
    error,
    planningResult,
    blueprint,
    hld,
    lld,
    codegenResult
  } = useWorkflowStore();

  const handleOpenWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const handleResetWorkflow = async () => {
    if (!confirm("Are you sure you want to reset the entire workflow? This will delete all progress.")) {
      return;
    }
    
    setIsProcessing(true);
    try {
      // TODO: Implement workflow reset
      console.log("Reset workflow for project:", projectId);
    } catch (error) {
      console.error("Failed to reset workflow:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStageProgress = () => {
    const stages = Object.values(WorkflowStage);
    const completedStages = stages.filter(stage => 
      stageStatus[stage] === StageStatus.COMPLETED
    ).length;
    
    return {
      completed: completedStages,
      total: stages.length,
      percentage: Math.round((completedStages / stages.length) * 100)
    };
  };

  const progress = getStageProgress();
  const isWorkflowCompleted = currentStage === WorkflowStage.COMPLETED;
  const canOpenWorkspace = stageStatus[WorkflowStage.CODEGEN] === StageStatus.COMPLETED || isWorkflowCompleted;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your workflow progress
        </p>
      </div>

      {/* Progress Overview */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{progress.completed}/{progress.total}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-500">
            {progress.percentage}% complete
          </p>
        </div>
      </div>

      {/* Current Stage Info */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Stage</h3>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium capitalize">
              {currentStage.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              stageStatus[currentStage] === StageStatus.COMPLETED ? 'bg-green-100 text-green-700' :
              stageStatus[currentStage] === StageStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
              stageStatus[currentStage] === StageStatus.FAILED ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {stageStatus[currentStage].replace('_', ' ')}
            </span>
          </div>
          
          {loading && (
            <div className="flex items-center space-x-2">
              <Loading size="sm" />
              <span className="text-xs text-gray-600">Processing...</span>
            </div>
          )}
          
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
      </div>

      {/* Stage Results Summary */}
      <div className="p-4 border-b border-gray-200 flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Results</h3>
        <div className="space-y-3">
          {planningResult && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-800">Planning Complete</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {Object.keys(planningResult.answers).length} questions answered
              </p>
            </div>
          )}
          
          {blueprint && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-800">Blueprint Ready</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {blueprint.techStack?.length || 0} technologies, {blueprint.features?.length || 0} features
              </p>
            </div>
          )}
          
          {hld && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-800">HLD Complete</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                System architecture defined
              </p>
            </div>
          )}
          
          {lld && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-800">LLD Complete</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Detailed design ready
              </p>
            </div>
          )}
          
          {codegenResult && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-800">Code Generated</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {codegenResult.generatedFiles.length} files created
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-3 border-t border-gray-200">
        {canOpenWorkspace && (
          <Button
            onClick={handleOpenWorkspace}
            className="w-full"
            variant="primary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Workspace
          </Button>
        )}
        
        <Button
          onClick={handleResetWorkflow}
          disabled={isProcessing}
          variant="outline"
          className="w-full"
        >
          {isProcessing ? (
            <Loading size="sm" className="mr-2" />
          ) : (
            <RotateCcw className="w-4 h-4 mr-2" />
          )}
          Reset Workflow
        </Button>
        
        <Button
          variant="ghost"
          className="w-full"
          disabled
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}