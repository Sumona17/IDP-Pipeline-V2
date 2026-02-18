import { XCircle } from "lucide-react";
import type { InstanceStep } from "./types";
import { getStepStatusStyle, formatPayload } from "./utils";

interface InstanceStepsModalProps {
  activeInstanceMeta: { id: string; workflowId?: string } | null;
  instanceSteps: InstanceStep[] | null;
  instanceStepsLoading: boolean;
  instanceStepsError: string | null;
  setActiveInstanceMeta: (meta: { id: string; workflowId?: string } | null) => void;
  setInstanceSteps: (steps: InstanceStep[] | null) => void;
  setInstanceStepsError: (error: string | null) => void;
}

export const InstanceStepsModal = ({
  activeInstanceMeta,
  instanceSteps,
  instanceStepsLoading,
  instanceStepsError,
  setActiveInstanceMeta,
  setInstanceSteps,
  setInstanceStepsError,
}: InstanceStepsModalProps) => {
  if (!activeInstanceMeta) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        <div className="bg-white border-b p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Instance Steps
            </h2>
          </div>
          <button
            onClick={() => {
              setActiveInstanceMeta(null);
              setInstanceSteps(null);
              setInstanceStepsError(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {instanceStepsLoading && (
            <div className="text-sm text-gray-500">Loading steps...</div>
          )}

          {instanceStepsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">{instanceStepsError}</p>
            </div>
          )}

          {!instanceStepsLoading &&
            instanceSteps &&
            instanceSteps.length > 0 && (
              <div className="space-y-4">
                {instanceSteps
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.executedAt).getTime() -
                      new Date(b.executedAt).getTime(),
                  )
                  .map((step) => {
                    const style = getStepStatusStyle(step.status);
                    return (
                      <div key={step.id} className="relative pl-6">
                        <div className="absolute left-2 top-2 h-full w-px bg-gray-200" />
                        <div
                          className={`absolute left-0 top-2 h-3 w-3 rounded-full ${style.dot}`}
                        />
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {step.nodeName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {step.nodeType} · {step.nodeId}
                              </div>
                              <div className="text-xs text-gray-500">
                                {step.durationFormatted ? step.durationFormatted : "0s"}
                              </div>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${style.badge}`}
                            >
                              {step.status}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            {step.message}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {new Date(step.executedAt).toLocaleString()}
                          </div>
                          {(step.requestPayload || step.responsePayload) && (
                            <div className="mt-3 space-y-2">
                              {step.requestPayload && (
                                <details className="bg-white border border-gray-200 rounded-md">
                                  <summary className="cursor-pointer text-xs font-semibold text-gray-700 px-3 py-2">
                                    Request Payload
                                  </summary>
                                  <pre className="text-xs overflow-x-auto text-gray-700 px-3 pb-3">
                                    {formatPayload(step.requestPayload)}
                                  </pre>
                                </details>
                              )}
                              {step.responsePayload && (
                                <details className="bg-white border border-gray-200 rounded-md">
                                  <summary className="cursor-pointer text-xs font-semibold text-gray-700 px-3 py-2">
                                    Response Payload
                                  </summary>
                                  <pre className="text-xs overflow-x-auto text-gray-700 px-3 pb-3">
                                    {formatPayload(step.responsePayload)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

          {!instanceStepsLoading &&
            instanceSteps &&
            instanceSteps.length === 0 && (
              <div className="text-sm text-gray-500">
                No steps found for this instance.
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
