import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Download,
} from "lucide-react";
import axios from "axios";

interface Instance {
  id: string;
  workflowDefinition: { name: string };
  status: string;
  createdAt: string;
  workflowJson?: any;
}

interface InstanceStep {
  id: string;
  workflowInstanceId: string;
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: string;
  message: string;
  executedAt: string;
  requestPayload?: string;
  responsePayload?: string;
}

export const Dashboard = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<any[]>([]);
  const [filteredExecutions, setFilteredExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(
    localStorage.getItem("autoRefresh") === "true",
  );
  const [refreshInterval, setRefreshInterval] = useState(
    parseInt(localStorage.getItem("refreshInterval") || "10", 10),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState("");
  const [executingIds, setExecutingIds] = useState<Set<string>>(new Set());
  const [executionResults, setExecutionResults] = useState<Record<string, any>>(
    {},
  );
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(
    null,
  );
  const [allWorkflows, setAllWorkflows] = useState<any[]>([]);
  const [allInstances, setAllInstances] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"workflows" | "instances">(
    "workflows",
  );
  const [instanceSteps, setInstanceSteps] = useState<InstanceStep[] | null>(
    null,
  );
  const [instanceStepsLoading, setInstanceStepsLoading] = useState(false);
  const [instanceStepsError, setInstanceStepsError] = useState<string | null>(
    null,
  );
  const [activeInstanceMeta, setActiveInstanceMeta] = useState<{
    id: string;
    workflowId?: string;
  } | null>(null);
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_APP_BASE_URL}/findAll`)
      .then((response) => {
        // console.log("allworkflows", response.data);
        setAllWorkflows(response.data);
      })
      .catch(() => {
        console.log("error");
      });
    axios
      .get(`${import.meta.env.VITE_APP_BASE_URL}/findAllExecutions`)
      .then((response) => {
        // console.log("allinstances", response.data);
        setAllInstances(response.data);
      })
      .catch(() => {
        console.log("error");
      });
  }, []);

  const resolveValue = (
    value: string,
    taskValues: Record<string, any>,
  ): any => {
    const refMatch = value.match(/\$?\{?([a-zA-Z0-9\-_]+)\.([a-zA-Z0-9_]+)\}?/);
    if (refMatch) {
      const [, nodeId, field] = refMatch;
      return taskValues[nodeId]?.[field] ?? value;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  };

  const evaluateCondition = (
    condition: string,
    taskValues: Record<string, any>,
    nodeNameMap: Record<string, string>,
  ): boolean => {
    try {
      let evalStr = condition;

      for (const [nodeName, nodeId] of Object.entries(nodeNameMap)) {
        const nameRegex = new RegExp(`\\b${nodeName}\\b`, "g");
        const nodeTaskData = taskValues[nodeId];
        if (nodeTaskData?.assignedValue !== undefined) {
          evalStr = evalStr.replace(
            nameRegex,
            JSON.stringify(nodeTaskData.assignedValue),
          );
        }
      }

      const refMatches = condition.matchAll(
        /\$?\{?([a-zA-Z0-9\-_]+)\.([a-zA-Z0-9_]+)\}?/g,
      );
      for (const match of refMatches) {
        const [fullMatch, nodeId, field] = match;
        const value = taskValues[nodeId]?.[field];
        evalStr = evalStr.replace(fullMatch, JSON.stringify(value));
      }

      // eslint-disable-next-line no-eval
      return eval(evalStr);
    } catch (err) {
      console.error(
        "Condition evaluation error:",
        err,
        "Condition:",
        condition,
      );
      return false;
    }
  };

  const formatPayload = (payload: unknown): string => {
    if (payload === null || payload === undefined) return "";
    if (typeof payload === "string") {
      try {
        const parsed = JSON.parse(payload);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return payload;
      }
    }
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  };

  const fetchInstanceSteps = async (
    instanceId: string,
  ): Promise<InstanceStep[]> => {
    setInstanceStepsLoading(true);
    setInstanceStepsError(null);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_BASE_URL}/logs/${instanceId}`,
      );
      console.log("Consoling logs: ", res.data);
      return res.data as InstanceStep[];
    } finally {
      setInstanceStepsLoading(false);
    }
  };

  const openInstanceSteps = async (instance: any) => {
    setActiveInstanceMeta({ id: instance.id, workflowId: instance.workflowId });
    setInstanceSteps(null);
    try {
      const steps = await fetchInstanceSteps(instance.instanceId);
      setInstanceSteps(steps);
    } catch (err: any) {
      setInstanceStepsError("Failed to load instance steps");
      setInstanceSteps([]);
    } finally {
      setInstanceStepsLoading(false);
    }
  };

  const fetchInstances = async () => {
    setLoading(true);
    setInstances(allInstances);
    setLoading(false);
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    setAllWorkflows(allWorkflows);
    setLoading(false);
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    const filterByCommon = (
      items: any[],
      options: { nameKey?: string; dateKey?: string },
    ) => {
      let filtered = items;
      const nameKey = options.nameKey ?? "name";
      const dateKey = options.dateKey ?? "createdAt";

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter((item) => {
          const name =
            item?.[nameKey] ??
            item?.workflowDefinition?.name ??
            item?.workflowName ??
            "";
          return String(name).toLowerCase().includes(term);
        });
      }

      if (statusFilter) {
        filtered = filtered.filter((item) => item?.status === statusFilter);
      }

      if (dateFilter) {
        const filterDate = new Date(dateFilter).toDateString();
        filtered = filtered.filter((item) => {
          const rawDate = item?.[dateKey];
          if (!rawDate) return false;
          return new Date(rawDate).toDateString() === filterDate;
        });
      }

      return filtered;
    };

    setFilteredWorkflows(
      filterByCommon(allWorkflows || [], {
        nameKey: "name",
        dateKey: "createdAt",
      }),
    );
    setFilteredExecutions(
      filterByCommon(allInstances || [], {
        nameKey: "workflowName",
        dateKey: "startedAt",
      }),
    );
  }, [allWorkflows, allInstances, searchTerm, statusFilter, dateFilter]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchInstances, refreshInterval * 1000); // Convert seconds to milliseconds
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { bg: string; text: string }> = {
      COMPLETED: { bg: "bg-green-100", text: "text-green-800" },
      FAILED: { bg: "bg-red-100", text: "text-red-800" },
      RUNNING: { bg: "bg-blue-100", text: "text-blue-800" },
      PENDING: { bg: "bg-gray-100", text: "text-gray-800" },
    };

    const style = statusStyles[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
    };

    return (
      <span
        className={`w-[100%] inline-flex justify-center items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}
      >
        {status}
      </span>
    );
  };

  const getStepStatusStyle = (status: string) => {
    const styles: Record<string, { dot: string; badge: string }> = {
      COMPLETED: { dot: "bg-green-500", badge: "bg-green-100 text-green-800" },
      FAILED: { dot: "bg-red-500", badge: "bg-red-100 text-red-800" },
      STARTED: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800" },
      RUNNING: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800" },
      PENDING: { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-800" },
    };

    return (
      styles[status] || {
        dot: "bg-gray-400",
        badge: "bg-gray-100 text-gray-800",
      }
    );
  };

  const exportData = () => {
    let dataToExport: any[] = [];

    if (selectedTab === "instances") {
      dataToExport =
        allInstances &&
        allInstances.map((instance) => ({
          workflowName: instance.workflowName,
          status: instance.status,
          instanceId: instance.instanceId,
          startedAt: new Date(instance.startedAt).toLocaleString(),
          completedAt: new Date(instance.completedAt).toLocaleString(),
          workflowId: instance.workflowId,
        }));
    } else {
      dataToExport =
        allWorkflows &&
        allWorkflows.map((workflows) => ({
          workflowId: workflows.id,
          workflowName: workflows.name,
          status: workflows.status,
          updatedAt: new Date(workflows.updatedAt).toLocaleString(),
          workflowDefinition: workflows.definitionJson,
          version: workflows.version,
        }));
    }

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    if (selectedTab === "instances") {
      link.download = `workflow-instances-${new Date().toISOString().split("T")[0]}.json`;
    } else {
      link.download = `workflows-${new Date().toISOString().split("T")[0]}.json`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteNew = async (instance: Instance) => {
    alert("Execution started for " + instance);

    const reqBody = {
      workflowId: instance.id,
    };
    axios
      .get(`${import.meta.env.VITE_APP_BASE_URL}/start/${reqBody.workflowId}`)
      .then((res) => {
        console.log("Execution started", res);
        alert("Executed " + instance.workflowDefinition.name);
        fetchWorkflows();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header with Actions */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">Overview of workflow executions</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/designer")}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e94bf] text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
          <button
            onClick={fetchInstances}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-gray-500 text-sm font-medium">Total Runs</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {allInstances && allInstances.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-gray-500 text-sm font-medium">Success Rate</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {allInstances && allInstances.length > 0
              ? (
                  (allInstances.filter((i) => i.status === "COMPLETED").length /
                    allInstances.length) *
                  100
                ).toFixed(2)
              : 0}
            %
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-gray-500 text-sm font-medium">Completed</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {allInstances &&
              allInstances.filter((i) => i.status === "COMPLETED").length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-gray-500 text-sm font-medium">Failed</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {allInstances &&
              allInstances.filter((i) => i.status === "FAILED").length}
          </div>
        </div>
      </div>

      <div className="inline-flex flex-row w-full md:w-[30%] rounded-lg p-0 pl-0 pr-0 mb-4 overflow-hidden">
        <div
          className={`w-[50%] text-center cursor-pointer font-bold rounded-l-lg border border-gray-200 p-2.5 ${selectedTab === "workflows" ? "bg-[#1e94bf] text-white" : ""}`}
          onClick={() => setSelectedTab("workflows")}
        >
          Workflows
        </div>

        <div
          className={`w-[50%] text-center cursor-pointer font-bold rounded-r-lg border border-gray-200 border-l-0 p-2.5 ${selectedTab === "instances" ? "bg-[#1e94bf] text-white" : ""}`}
          onClick={() => setSelectedTab("instances")}
        >
          Instances
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-2 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <input
              type="text"
              placeholder="Search by workflow name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Status</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newState = !autoRefresh;
                setAutoRefresh(newState);
                localStorage.setItem("autoRefresh", newState.toString());
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition flex-1 justify-center ${
                autoRefresh
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-700 border border-gray-300"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Auto</span>
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              title="Export as JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {selectedTab === "workflows" ? (
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
                                workflowObj.id =
                                  workflowDef?.id ?? workflowObj.id;
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
                      <td className="px-6 py-2">
                        {getStatusBadge(instance.status)}
                      </td>
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
                            !instance.definitionJson ||
                            executingIds.has(instance.id)
                          }
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                          title={
                            !instance.definitionJson
                              ? "No workflow JSON available"
                              : "Execute workflow"
                          }
                        >
                          <Play className="w-4 h-4" />
                          {executingIds.has(instance.id)
                            ? "Executing..."
                            : "Execute"}
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
      ) : (
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
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
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
                      <td className="px-6 py-2">
                        {getStatusBadge(instance.status)}{" "}
                        {instance.status == "WAITING"
                          ? `at step ${instance.currentNodeName}`
                          : null}
                      </td>
                      <td className="px-6 py-2 text-sm font-medium text-gray-500">
                        {new Date(instance.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-2 text-sm font-medium text-gray-500">
                        {new Date(instance.completedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-2 text-sm font-medium text-gray-500">
                        {instance.durationFormatted
                          ? instance.durationFormatted
                          : "0.00 seconds"}
                      </td>
                      <td className="px-6 py-2">
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
                                  message: "Document Ingested",
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
                                fetchInstances();
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
                      </td>
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
      )}

      {activeExecutionId && executionResults[activeExecutionId] && (
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
      )}

      {activeInstanceMeta && (
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
                                    {step.durationFormatted ??
                                      step.durationFormatted}
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
                              {(step.requestPayload ||
                                step.responsePayload) && (
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
      )}
    </div>
  );
};
