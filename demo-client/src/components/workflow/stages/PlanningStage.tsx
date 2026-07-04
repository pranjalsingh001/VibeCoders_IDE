import { useState } from "react";
import { FileText, CheckCircle } from "lucide-react";
import useWorkflowStore from "../../../stores/workflowStore";
import { Button } from "../../ui/Button";
import { PlanningSkeleton, OperationLoading } from "../../ui/Loading";
import { AnimationWrapper, StaggeredList } from "../../ui/AnimationWrapper";
import { PlanningFlow } from "../../planning/PlanningFlow";

interface PlanningStageProps {
  projectId: string;
}

export function PlanningStage({ projectId }: PlanningStageProps) {
  const { planningResult, loading, error } = useWorkflowStore();
  const [showAnswers, setShowAnswers] = useState(false);

  if (loading) {
    return (
      <div className="p-6">
        <PlanningSkeleton />
      </div>
    );
  }

  // Show completed state if planning is done
  if (planningResult) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <AnimationWrapper animation="slide-up" className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-success-100 rounded-lg animate-in zoom-in duration-300">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Planning Complete</h1>
              <p className="text-secondary-600">Your project requirements have been captured</p>
            </div>
          </div>
        </AnimationWrapper>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-green-800">Planning Complete</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnswers(!showAnswers)}
            >
              {showAnswers ? 'Hide' : 'Show'} Answers
            </Button>
          </div>
          
          <p className="text-green-700 mb-4">
            You've successfully completed the planning phase with {Object.keys(planningResult.answers).length} questions answered.
          </p>
          
          {showAnswers && (
            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">Your Answers:</h3>
              <div className="space-y-3">
                {Object.entries(planningResult.answers).map(([questionId, answer], index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {questionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">{answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show planning flow for new projects
  return (
    <PlanningFlow
      projectId={projectId}
      onDraftSaved={(answers) => {
        console.log('Draft saved:', answers);
      }}
      onSubmit={(answers) => {
        console.log('Planning submitted:', answers);
      }}
    />
  );
}