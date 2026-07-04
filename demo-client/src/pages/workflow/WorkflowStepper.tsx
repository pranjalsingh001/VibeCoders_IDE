// src/components/workflow/WorkflowStepper.tsx
import React from "react";

type Stage = "planning" | "blueprint" | "hld" | "lld" | "codegen" | "finished";

const STAGES: Stage[] = ["planning", "blueprint", "hld", "lld", "codegen", "finished"];

interface WorkflowStepperProps {
  currentStage: Stage;
  status?: "idle" | "in-progress" | "completed" | "failed";
  results?: Record<Stage, any>;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentStage,
  status = "idle",
  results = {},
}) => {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-lg shadow">
      {STAGES.map((stage, index) => {
        const isCompleted = results[stage] && index < currentIndex;
        const isCurrent = stage === currentStage;
        const isFailed = isCurrent && status === "failed";

        return (
          <div key={stage} className="flex-1 flex flex-col items-center">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold
                ${isCompleted ? "bg-green-500" : ""}
                ${isCurrent ? "bg-blue-500" : ""}
                ${isFailed ? "bg-red-500" : ""}
                ${!isCompleted && !isCurrent && !isFailed ? "bg-gray-300" : ""}
              `}
            >
              {isCompleted ? "✓" : isFailed ? "!" : index + 1}
            </div>
            <p className="mt-2 text-xs font-medium capitalize">{stage}</p>
            {index < STAGES.length - 1 && (
              <div className="h-0.5 w-full bg-gray-300" />
            )}
          </div>
        );
      })}
    </div>
  );
};
