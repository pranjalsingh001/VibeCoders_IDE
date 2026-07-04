import { useState } from "react";
import { Settings, Eye, EyeOff } from "lucide-react";
import useWorkflowStore from "../../../stores/workflowStore";
import { Button } from "../../ui/Button";
import { Loading } from "../../ui/Loading";

interface HLDStageProps {
  projectId: string;
}

export function HLDStage({ projectId }: HLDStageProps) {
  const { hld, loading, error } = useWorkflowStore();
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
          <div className="p-2 bg-purple-100 rounded-lg">
            <Settings className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">High-Level Design</h1>
            <p className="text-gray-600">System architecture and component design</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* HLD Content */}
      <div className="space-y-6">
        {hld ? (
          <div className="space-y-6">
            {/* System Design Overview */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Design</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {typeof hld.content === 'string' 
                    ? hld.content 
                    : JSON.stringify(hld.content, null, 2)
                  }
                </pre>
              </div>
            </div>

            {/* Components */}
            {hld.components && hld.components.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Components</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hld.components.map((component: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {component.name || `Component ${index + 1}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {component.description || 'No description available'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Flow */}
            {hld.dataFlow && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Flow</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {typeof hld.dataFlow === 'string' 
                      ? hld.dataFlow 
                      : JSON.stringify(hld.dataFlow, null, 2)
                    }
                  </pre>
                </div>
              </div>
            )}

            {/* Raw JSON Toggle */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Raw HLD Data</h2>
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
                    {hld.rawJson || JSON.stringify(hld.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">High-Level Design Generation</h2>
              <p className="text-gray-600 mb-6">
                AI will create a detailed system architecture based on your approved blueprint.
              </p>
              
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-purple-900 mb-2">HLD Will Include:</h3>
                <ul className="text-sm text-purple-800 space-y-1 text-left">
                  <li>• System architecture diagrams</li>
                  <li>• Component relationships</li>
                  <li>• Data flow design</li>
                  <li>• API specifications</li>
                  <li>• Database schema</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-500">
                This stage will be implemented in a future task. The AI response viewer will render diagrams and structured content.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}