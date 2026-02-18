import { Play, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { Workflow } from "./types";
import { getStatusBadge } from "./utils";

interface WorkflowsTableProps {
  filteredWorkflows: Workflow[];
  allWorkflows: Workflow[];
  executingIds: Set<string>;
  handleExecuteNew: (instance: any) => void;
}

export const WorkflowsTable = ({
  filteredWorkflows,
  allWorkflows,
  executingIds,
  handleExecuteNew,
}: WorkflowsTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Workflow ID
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Workflow Name
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredWorkflows &&
              filteredWorkflows.map((instance) => (
                <tr
                  key={instance.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (instance.definitionJson) {
                      axios
                        .get(
                          `${import.meta.env.VITE_APP_BASE_URL}/${instance.id}`,
                        )
                        .then((res) => {
                          const workflowDef = res?.data;
                          const rawDefinition = workflowDef?.definitionJson;
                          let workflowObj: any = rawDefinition;

                          if (typeof rawDefinition === "string") {
                            try {
                              workflowObj = JSON.parse(rawDefinition);
                            } catch (err) {
                              console.log(
                                "Failed to parse workflow definition JSON",
                                err,
                              );
                              workflowObj = null;
                            }
                          }

                          if (workflowObj) {
                            if (!workflowObj.name && workflowDef?.name) {
                              workflowObj.name = workflowDef.name;
                            }
                            workflowObj.id = workflowDef?.id ?? workflowObj.id;
                            if (workflowObj.id) {
                              localStorage.setItem(
                                "workflowId",
                                workflowObj.id,
                              );
                            } else {
                              localStorage.removeItem("workflowId");
                            }
                            navigate("/designer", {
                              state: { workflow: workflowObj },
                            });
                            return;
                          }

                          console.log(
                            "Workflow fetched but no definition JSON found",
                            res,
                          );
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    }
                  }}
                >
                  <td className="px-6 py-2 text-sm font-medium text-gray-900">
                    {instance && instance.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-2 text-sm font-medium text-gray-500">
                    {instance && instance.name.length > 15
                      ? `${instance.name.slice(0, 15)}...`
                      : instance.name}
                  </td>
                  <td className="px-6 py-2">{getStatusBadge(instance.status)}</td>
                  <td className="px-6 py-2 text-sm font-medium text-gray-500">
                    {new Date(instance.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecuteNew(instance);
                      }}
                      disabled={
                        !instance.definitionJson || executingIds.has(instance.id)
                      }
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      title={
                        !instance.definitionJson
                          ? "No workflow JSON available"
                          : "Execute workflow"
                      }
                    >
                      <Play className="w-4 h-4" />
                      {executingIds.has(instance.id) ? "Executing..." : "Execute"}
                    </button>
                  </td>
                </tr>
              ))}
            {filteredWorkflows.length === 0 && (
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
                        {allWorkflows.length === 0
                          ? "Start by creating a new workflow"
                          : "Try adjusting your filters"}
                      </p>
                    </div>
                    {allWorkflows.length === 0 && (
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
