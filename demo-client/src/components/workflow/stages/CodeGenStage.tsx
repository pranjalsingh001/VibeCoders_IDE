import { useState } from "react";
import { Code, CheckCircle, AlertCircle, RotateCcw, FileText } from "lucide-react";
import useWorkflowStore from "../../../stores/workflowStore";
import { Button } from "../../ui/Button";
import { CodeGenSkeleton, OperationLoading } from "../../ui/Loading";
import { CircularProgress, StepProgress, AnimatedCounter } from "../../ui/ProgressIndicator";
import { AnimationWrapper, StaggeredList } from "../../ui/AnimationWrapper";

interface CodeGenStageProps {
  projectId: string;
}

export function CodeGenStage({ projectId }: CodeGenStageProps) {
  const { codegenResult, loading, error, retryFileGeneration, retryFailedFiles } = useWorkflowStore();
  const [retryingFile, setRetryingFile] = useState<string | null>(null);

  const handleRetryFile = async (filePath: string) => {
    setRetryingFile(filePath);
    try {
      await retryFileGeneration(filePath);
    } finally {
      setRetryingFile(null);
    }
  };

  const getFileStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Loading size="sm" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFileStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'in_progress':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Code className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Code Generation</h1>
            <p className="text-gray-600">Generate project files from your design specifications</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* CodeGen Content */}
      <div className="space-y-6">
        {codegenResult ? (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generation Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {codegenResult.manifest.completedFiles}
                  </div>
                  <div className="text-sm text-green-700">Completed</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {codegenResult.manifest.failedFiles}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {codegenResult.manifest.totalFiles}
                  </div>
                  <div className="text-sm text-blue-700">Total Files</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-600">
                    {Math.round((codegenResult.manifest.completedFiles / codegenResult.manifest.totalFiles) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(codegenResult.manifest.completedFiles / codegenResult.manifest.totalFiles) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* File Manifest */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">File Manifest</h2>
                {codegenResult.manifest.failedFiles > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryFailedFiles}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry Failed Files
                  </Button>
                )}
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {codegenResult.manifest.files.map((file, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${getFileStatusColor(file.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileStatusIcon(file.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.path}</p>
                          <p className="text-xs opacity-75 truncate">{file.purpose}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {file.attempts > 1 && (
                          <span className="text-xs opacity-75">
                            Attempt {file.attempts}
                          </span>
                        )}
                        {file.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryFile(file.path)}
                            disabled={retryingFile === file.path}
                          >
                            {retryingFile === file.path ? (
                              <Loading size="sm" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {file.error && (
                      <div className="mt-2 text-xs opacity-75">
                        Error: {file.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Code className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Code Generation</h2>
              <p className="text-gray-600 mb-6">
                AI will generate all project files based on your approved design documents.
              </p>
              
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">Generation Process:</h3>
                <ul className="text-sm text-green-800 space-y-1 text-left">
                  <li>• Create file manifest from design specs</li>
                  <li>• Validate manifest against requirements</li>
                  <li>• Generate files with real-time progress</li>
                  <li>• Retry failed files automatically</li>
                  <li>• Validate generated code quality</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-500">
                This stage will be implemented in a future task. The CodeGen manager will provide real-time progress tracking and file validation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}