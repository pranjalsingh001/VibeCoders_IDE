import { useState } from "react";
import { Settings, Eye, EyeOff } from "lucide-react";
import useWorkflowStore from "../../../stores/workflowStore";
import { Button } from "../../ui/Button";
import { Loading } from "../../ui/Loading";

interface LLDStageProps {
  projectId: string;
}

export function LLDStage({ projectId }: LLDStageProps) {
  const { lld, loading, error } = useWorkflowStore();
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
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Settings className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Low-Level Design</h1>
            <p className="text-gray-600">Detailed implementation specifications</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* LLD Content */}
      <div className="space-y-6">
        {lld ? (
          <div className="space-y-6">
            {/* Detailed Design */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Design</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {typeof lld.detailedDesign === 'string'
                    ? lld.detailedDesign
                    : JSON.stringify(lld.detailedDesign || lld.content, null, 2)
                  }
                </pre>
              </div>
            </div>

            {/* Implementation Details */}
            {lld.implementation && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Implementation Details</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {typeof lld.implementation === 'string'
                      ? lld.implementation
                      : JSON.stringify(lld.implementation, null, 2)
                    }
                  </pre>
                </div>
              </div>
            )}

            {/* Specifications */}
            {lld.specifications && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {typeof lld.specifications === 'string'
                      ? lld.specifications
                      : JSON.stringify(lld.specifications, null, 2)
                    }
                  </pre>
                </div>
              </div>
            )}

            {/* Raw JSON Toggle */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Raw LLD Data</h2>
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
                    {lld.rawJson || JSON.stringify(lld.content, null, 2)}
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Low-Level Design Generation</h2>
              <p className="text-gray-600 mb-6">
                AI will create detailed implementation specifications based on your HLD.
              </p>

              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-indigo-900 mb-2">LLD Will Include:</h3>
                <ul className="text-sm text-indigo-800 space-y-1 text-left">
                  <li>• Detailed component specifications</li>
                  <li>• Function and method signatures</li>
                  <li>• Data structures and models</li>
                  <li>• Implementation algorithms</li>
                  <li>• Error handling strategies</li>
                </ul>
              </div>

              <p className="text-sm text-gray-500">
                This stage will be implemented in a future task. The AI response viewer will format technical specifications clearly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}