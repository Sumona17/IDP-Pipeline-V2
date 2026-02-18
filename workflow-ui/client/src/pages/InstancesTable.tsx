import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { ExecutionInstance } from "./types";
import { getStatusBadge } from "./utils";

interface InstancesTableProps {
  filteredExecutions: ExecutionInstance[];
  allInstances: ExecutionInstance[];
  openInstanceSteps: (instance: any) => void;
}

export const InstancesTable = ({
  filteredExecutions,
  allInstances,
  openInstanceSteps,
}: InstancesTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Instance ID
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Workflow Name
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Started At
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Completed At
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              {/* <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredExecutions &&
              filteredExecutions.map((instance) => (
                <tr
                  key={instance.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openInstanceSteps(instance)}
                >
                  <td className="px-6 py-2 text-sm font-medium text-gray-900">
                    {instance && instance.instanceId.slice(0, 8)}
                  </td>
                  <td className="px-6 py-2 text-sm font-medium text-gray-500">
                    {instance && instance.workflowName}
                  </td>
                  <td className="px-6 py-2 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      {getStatusBadge(instance.status)}
                      {instance.status === "WAITING" && (
                        <div className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                          <span className="font-semibold">
                            {instance.currentNodeName}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-2 text-sm font-medium text-gray-500">
                    {new Date(instance.startedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-2 text-sm font-medium text-gray-500">
                    {instance.completedAt != null
                      ? new Date(instance.completedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-2 text-sm font-medium text-gray-500">
                    {instance.durationFormatted
                      ? instance.durationFormatted
                      : "0s"}
                  </td>
                  {/* <td className="px-6 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (instance.status !== "WAITING") return;
                        axios
                          .post(
                            `${import.meta.env.VITE_APP_BASE_URL}/logNode`,
                            {
                              workflowInstanceId: instance.instanceId,

                              nodeName: instance.currentNodeName,
                              status: "COMPLETED",
                              message: `${instance.currentNodeName} done`,
                              requestPayload: {
                                docName: "test.pdf",
                                docSize: "2.1KB",
                                classifiedAs: "Adoption Agreement",
                                ingestion: "done",
                              },
                              responsePayload: null,
                            },
                          )
                          .then((res) => {
                            console.log("Instance resumed", res);
                            alert("Instance resumed successfully");
                          })
                          .catch((err) => {
                            console.log("Error resuming:", err);
                          });
                      }}
                      disabled={instance.status !== "WAITING"}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        instance.status === "WAITING"
                          ? "Resume"
                          : "Not available"
                      }
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm">
                        {instance.status === "WAITING" ? "Resume" : "OK"}
                      </span>
                    </button>
                  </td> */}
                </tr>
              ))}
            {filteredExecutions.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium">No executions found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {allInstances.length === 0
                          ? "Start by creating a new workflow"
                          : "Try adjusting your filters"}
                      </p>
                    </div>
                    {allInstances.length === 0 && (
                      <button
                        onClick={() => navigate("/designer")}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        Create New Workflow
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
