import { XCircle } from "lucide-react";
import type { Instance } from "./types";

interface ExecutionResultModalProps {
  activeExecutionId: string | null;
  executionResults: Record<string, any>;
  instances: Instance[];
  setActiveExecutionId: (id: string | null) => void;
}

export const ExecutionResultModal = ({
  activeExecutionId,
  executionResults,
  instances,
  setActiveExecutionId,
}: ExecutionResultModalProps) => {
  if (!activeExecutionId || !executionResults[activeExecutionId]) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Execution Result
            </h2>
            <p
              className={`text-sm mt-1 font-medium ${
                executionResults[activeExecutionId].status === "completed"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              Status:{" "}
              {executionResults[activeExecutionId].status.toUpperCase()}
            </p>
          </div>
          <button
            onClick={() => setActiveExecutionId(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {executionResults[activeExecutionId].errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-sm text-red-700">
                {executionResults[activeExecutionId].errorMessage}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Execution Path
            </h3>
            <div className="flex flex-wrap gap-2">
              {executionResults[activeExecutionId].path.map(
                (nodeId: string, idx: number) => {
                  const instance = instances.find(
                    (i) => i.id === activeExecutionId,
                  );
                  const node = instance?.workflowJson?.nodes?.find(
                    (n: any) => n.id === nodeId,
                  );
                  return (
                    <div key={nodeId} className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
                        {node?.data?.label || nodeId}
                      </span>
                      {idx <
                        executionResults[activeExecutionId].path.length -
                          1 && <span className="text-gray-400">→</span>}
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {executionResults[activeExecutionId].executedSteps.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Steps</h3>
              <div className="space-y-2">
                {executionResults[activeExecutionId].executedSteps.map(
                  (step: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {step.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {step.type}
                          </p>
                        </div>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                      {step.decision && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Decision: </span>
                          <span className="font-semibold text-green-600">
                            {step.decision}
                          </span>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {Object.keys(executionResults[activeExecutionId].taskValues)
            .length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Task Values
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <pre className="text-xs overflow-x-auto text-gray-700">
                  {JSON.stringify(
                    executionResults[activeExecutionId].taskValues,
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-6 flex gap-2">
          <button
            onClick={() => setActiveExecutionId(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
