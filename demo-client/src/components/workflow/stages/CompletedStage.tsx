import { CheckSquare, ExternalLink, Download, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useWorkflowStore from "../../../stores/workflowStore";
import { Button } from "../../ui/Button";

interface CompletedStageProps {
  projectId: string;
}

export function CompletedStage({ projectId }: CompletedStageProps) {
  const navigate = useNavigate();
  const { planningResult, blueprint, hld, lld, codegenResult } = useWorkflowStore();

  const handleOpenWorkspace = () => {
    navigate(`/workspace/${projectId}`);
  };

  const handleDownloadProject = () => {
    // TODO: Implement project download
    console.log("Download project:", projectId);
  };

  const handleResetWorkflow = () => {
    if (confirm("Are you sure you want to reset the workflow? This will delete all progress.")) {
      // TODO: Implement workflow reset
      console.log("Reset workflow:", projectId);
    }
  };

  const getCompletionStats = () => {
    const stats = {
      questionsAnswered: planningResult ? Object.keys(planningResult.answers).length : 0,
      technologiesSelected: blueprint?.techStack?.length || 0,
      featuresPlanned: blueprint?.features?.length || 0,
      filesGenerated: codegenResult?.generatedFiles?.length || 0
    };
    
    return stats;
  };

  const stats = getCompletionStats();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckSquare className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflow Complete! 🎉</h1>
            <p className="text-gray-600">Your project has been successfully generated</p>
          </div>
        </div>
      </div>

      {/* Completion Summary */}
      <div className="space-y-6">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckSquare className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-900 mb-2">Project Successfully Generated!</h2>
            <p className="text-green-700 mb-6">
              Your project has been created with all the files and structure needed to get started.
            </p>
          </div>
        </div>

        {/* Project Statistics */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.questionsAnswered}</div>
              <div className="text-sm text-blue-700">Questions Answered</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.technologiesSelected}</div>
              <div className="text-sm text-purple-700">Technologies</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.featuresPlanned}</div>
              <div className="text-sm text-yellow-700">Features Planned</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.filesGenerated}</div>
              <div className="text-sm text-green-700">Files Generated</div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Open Your Workspace</h3>
                <p className="text-sm text-gray-600">
                  Review your generated code, make customizations, and start development.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Download Your Project</h3>
                <p className="text-sm text-gray-600">
                  Get a local copy of your project to work with your preferred tools.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Deploy & Share</h3>
                <p className="text-sm text-gray-600">
                  Deploy your project to the cloud and share it with the world.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleOpenWorkspace}
              className="w-full"
              variant="primary"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Workspace
            </Button>
            
            <Button
              onClick={handleDownloadProject}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Project
            </Button>
            
            <Button
              onClick={handleResetWorkflow}
              variant="outline"
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}