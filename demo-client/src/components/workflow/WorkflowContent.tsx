import React, { useState, useEffect } from "react";
import { WorkflowStage } from "../../stores/workflowStore";
import { 
  PlanningStage, 
  BlueprintStage, 
  HLDStage, 
  LLDStage, 
  CodeGenStage, 
  CompletedStage 
} from "./stages";
import { WorkflowSkeleton } from "../ui/Loading";

interface WorkflowContentProps {
  currentStage: WorkflowStage;
  projectId: string;
}

export function WorkflowContent({ currentStage, projectId }: WorkflowContentProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayStage, setDisplayStage] = useState(currentStage);

  // Handle smooth stage transitions
  useEffect(() => {
    if (currentStage !== displayStage) {
      setIsTransitioning(true);
      
      // Delay to allow fade out animation
      const timer = setTimeout(() => {
        setDisplayStage(currentStage);
        setIsTransitioning(false);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [currentStage, displayStage]);

  const renderStageContent = () => {
    switch (displayStage) {
      case WorkflowStage.PLANNING:
        return <PlanningStage projectId={projectId} />;
      case WorkflowStage.BLUEPRINT:
        return <BlueprintStage projectId={projectId} />;
      case WorkflowStage.HLD:
        return <HLDStage projectId={projectId} />;
      case WorkflowStage.LLD:
        return <LLDStage projectId={projectId} />;
      case WorkflowStage.CODEGEN:
        return <CodeGenStage projectId={projectId} />;
      case WorkflowStage.COMPLETED:
        return <CompletedStage projectId={projectId} />;
      default:
        return (
          <div className="p-6">
            <div className="text-center text-secondary-500">
              <p>Unknown stage: {displayStage}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-white relative overflow-hidden">
      {/* Transition overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-white z-10 flex items-center justify-center">
          <WorkflowSkeleton className="w-full max-w-4xl mx-auto p-6" />
        </div>
      )}
      
      {/* Main content with smooth transitions */}
      <div 
        className={`h-full transition-all duration-300 ease-out transform ${
          isTransitioning 
            ? 'opacity-0 scale-95 translate-y-2' 
            : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderStageContent()}
        </div>
      </div>
    </div>
  );
}