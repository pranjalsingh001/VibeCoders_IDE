import { CheckCircle, Clock, AlertCircle, Loader2, FileText, Lightbulb, Settings, Code, CheckSquare } from "lucide-react";
import { WorkflowStage, StageStatus } from "../../stores/workflowStore";
import useWorkflowStore from "../../stores/workflowStore";
import { styleUtils, componentVariants } from "../../styles/design-system";

interface WorkflowStepperProps {
  currentStage: WorkflowStage;
  stageStatus: Record<WorkflowStage, StageStatus>;
  collapsed?: boolean;
}

const stageConfig = [
  {
    stage: WorkflowStage.PLANNING,
    label: "Planning",
    icon: FileText,
    description: "Define project requirements"
  },
  {
    stage: WorkflowStage.BLUEPRINT,
    label: "Blueprint",
    icon: Lightbulb,
    description: "Generate project blueprint"
  },
  {
    stage: WorkflowStage.HLD,
    label: "High-Level Design",
    icon: Settings,
    description: "Create system architecture"
  },
  {
    stage: WorkflowStage.LLD,
    label: "Low-Level Design",
    icon: Settings,
    description: "Detail component design"
  },
  {
    stage: WorkflowStage.CODEGEN,
    label: "Code Generation",
    icon: Code,
    description: "Generate project files"
  },
  {
    stage: WorkflowStage.COMPLETED,
    label: "Completed",
    icon: CheckSquare,
    description: "Project ready"
  }
];

export function WorkflowStepper({ currentStage, stageStatus, collapsed = false }: WorkflowStepperProps) {
  const { setCurrentStage, canNavigateToStage } = useWorkflowStore();

  const getStageIcon = (stage: WorkflowStage, status: StageStatus) => {
    const config = stageConfig.find(s => s.stage === stage);
    const IconComponent = config?.icon || FileText;
    const isActive = stage === currentStage;

    switch (status) {
      case StageStatus.COMPLETED:
        return (
          <div className="relative">
            <CheckCircle className="w-5 h-5 text-success-500 animate-in zoom-in duration-200" />
            <div className="absolute inset-0 rounded-full bg-success-500 opacity-20 animate-ping" />
          </div>
        );
      case StageStatus.IN_PROGRESS:
        return (
          <div className="relative">
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            <div className="absolute inset-0 rounded-full bg-primary-500 opacity-20 animate-pulse" />
          </div>
        );
      case StageStatus.FAILED:
        return (
          <div className="relative">
            <AlertCircle className="w-5 h-5 text-error-500 animate-bounce" />
          </div>
        );
      default:
        return (
          <IconComponent 
            className={`w-5 h-5 transition-all duration-200 ${
              isActive 
                ? 'text-primary-600 scale-110' 
                : 'text-secondary-400 group-hover:text-secondary-600'
            }`} 
          />
        );
    }
  };

  const getStageClasses = (stage: WorkflowStage, status: StageStatus) => {
    const isActive = stage === currentStage;
    const canNavigate = canNavigateToStage(stage);
    
    let classes = "flex items-center w-full p-3 rounded-lg transition-all duration-300 ease-out transform ";
    
    if (isActive) {
      classes += "bg-primary-50 border-l-4 border-primary-500 shadow-sm scale-105 ";
    } else if (canNavigate) {
      classes += "hover:bg-secondary-50 hover:shadow-sm hover:scale-102 cursor-pointer ";
    } else {
      classes += "cursor-not-allowed opacity-60 ";
    }

    return classes;
  };

  const getTextClasses = (stage: WorkflowStage, status: StageStatus) => {
    const isActive = stage === currentStage;
    
    if (isActive) {
      return "text-primary-900 font-semibold";
    }
    
    switch (status) {
      case StageStatus.COMPLETED:
        return "text-success-700 font-medium";
      case StageStatus.IN_PROGRESS:
        return "text-primary-700 font-medium";
      case StageStatus.FAILED:
        return "text-error-700 font-medium";
      default:
        return "text-secondary-600 group-hover:text-secondary-800";
    }
  };

  const getStatusBadge = (status: StageStatus) => {
    const statusClasses = {
      [StageStatus.NOT_STARTED]: "bg-secondary-100 text-secondary-700 border border-secondary-200",
      [StageStatus.IN_PROGRESS]: "bg-primary-100 text-primary-700 border border-primary-200 animate-pulse",
      [StageStatus.COMPLETED]: "bg-success-100 text-success-700 border border-success-200",
      [StageStatus.FAILED]: "bg-error-100 text-error-700 border border-error-200"
    };
    
    const statusLabels = {
      [StageStatus.NOT_STARTED]: "Pending",
      [StageStatus.IN_PROGRESS]: "Active", 
      [StageStatus.COMPLETED]: "Done",
      [StageStatus.FAILED]: "Error"
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  const handleStageClick = (stage: WorkflowStage) => {
    if (canNavigateToStage(stage)) {
      setCurrentStage(stage);
    }
  };

  if (collapsed) {
    return (
      <div className="p-2 space-y-2">
        {stageConfig.map(({ stage, icon: IconComponent }) => {
          const status = stageStatus[stage];
          const isActive = stage === currentStage;
          const canNavigate = canNavigateToStage(stage);
          
          return (
            <div
              key={stage}
              onClick={() => handleStageClick(stage)}
              className={styleUtils.cn(
                "flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200",
                isActive && "bg-blue-50 border-2 border-blue-500",
                !isActive && canNavigate && "hover:bg-gray-50 cursor-pointer",
                !canNavigate && "cursor-not-allowed opacity-50"
              )}
              title={stageConfig.find(s => s.stage === stage)?.label}
            >
              {getStageIcon(stage, status)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {stageConfig.map(({ stage, label, description }, index) => {
        const status = stageStatus[stage];
        const isActive = stage === currentStage;
        const canNavigate = canNavigateToStage(stage);
        
        return (
          <div key={stage} className="relative">
            {/* Connection line with progress indication */}
            {index < stageConfig.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-secondary-200">
                {status === StageStatus.COMPLETED && (
                  <div className="w-full h-full bg-success-400 animate-in slide-in-from-top duration-500" />
                )}
              </div>
            )}
            
            <div
              onClick={() => handleStageClick(stage)}
              className={`group ${getStageClasses(stage, status)}`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getStageIcon(stage, status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm truncate transition-all duration-200 ${getTextClasses(stage, status)}`}>
                      {label}
                    </h3>
                    <div className="flex-shrink-0 ml-2">
                      {getStatusBadge(status)}
                    </div>
                  </div>
                  <p className="text-xs text-secondary-500 mt-1 truncate group-hover:text-secondary-600 transition-colors duration-200">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
