import { useState } from "react";
import { Lightbulb, Eye, EyeOff } from "lucide-react";
import useWorkflowStore from "../../../stores/workflowStore";
import { Button } from "../../ui/Button";
import { Loading } from "../../ui/Loading";

interface BlueprintStageProps {
  projectId: string;
}

export function BlueprintStage({ projectId }: BlueprintStageProps) {
  const { blueprint, loading, error } = useWorkflowStore();
  const [showRawJson, setShowRawJson] = useState(false);

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
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blueprint Stage</h1>
            <p className="text-gray-600">AI-generated project blueprint and architecture</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Blueprint Content */}
      <div className="space-y-6">
        {blueprint ? (
          <div className="space-y-6">
            {/* Tech Stack */}
            {blueprint.techStack && blueprint.techStack.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Technology Stack</h2>
                <div className="flex flex-wrap gap-2">
                  {blueprint.techStack.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {blueprint.features && blueprint.features.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {blueprint.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Architecture */}
            {blueprint.architecture && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Architecture</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {typeof blueprint.architecture === 'string' 
                      ? blueprint.architecture 
                      : JSON.stringify(blueprint.architecture, null, 2)
                    }
                  </pre>
                </div>
              </div>
            )}

            {/* Raw JSON Toggle */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Raw Blueprint Data</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawJson(!showRawJson)}
                >
                  {showRawJson ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Raw JSON
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Raw JSON
                    </>
                  )}
                </Button>
              </div>
              
              {showRawJson && (
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-sm text-green-400">
                    {blueprint.rawJson || JSON.stringify(blueprint.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Blueprint Generation</h2>
              <p className="text-gray-600 mb-6">
                AI will analyze your planning answers and generate a comprehensive project blueprint.
              </p>
              
              <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-900 mb-2">Blueprint Will Include:</h3>
                <ul className="text-sm text-yellow-800 space-y-1 text-left">
                  <li>• Recommended technology stack</li>
                  <li>• Project features and requirements</li>
                  <li>• System architecture overview</li>
                  <li>• Folder structure</li>
                  <li>• Implementation approach</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-500">
                This stage will be implemented in a future task. The AI response viewer will parse and display the blueprint in a user-friendly format.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}