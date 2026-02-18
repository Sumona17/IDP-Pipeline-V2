import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import axios from "axios";
import type { Instance, InstanceStep } from "./types";
import { StatisticsCards } from "./StatisticsCards";
import { FiltersBar } from "./FiltersBar";
import { WorkflowsTable } from "./WorkflowsTable";
import { InstancesTable } from "./InstancesTable";
import { ExecutionResultModal } from "./ExecutionResultModal";
import { InstanceStepsModal } from "./InstanceStepsModal";

export const Dashboard = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<any[]>([]);
  const [filteredExecutions, setFilteredExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(
    localStorage.getItem("autoRefresh") === "true",
  );
  const [refreshInterval] = useState(
    parseInt(localStorage.getItem("refreshInterval") || "10", 10),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState("");
  const [executingIds] = useState<Set<string>>(new Set());
  const [executionResults] = useState<Record<string, any>>({});
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_APP_BASE_URL}/findAll`)
      .then((response) => {
        setAllWorkflows(response.data);
      })
      .catch(() => {
        console.log("error");
      });
    axios
      .get(`${import.meta.env.VITE_APP_BASE_URL}/findAllExecutions`)
      .then((response) => {
        setAllInstances(response.data);
      })
      .catch(() => {
        console.log("error");
      });
  }, []);

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

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchInstances, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

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

      <StatisticsCards allInstances={allInstances} />

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

      <FiltersBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        exportData={exportData}
      />

      {selectedTab === "workflows" ? (
        <WorkflowsTable
          filteredWorkflows={filteredWorkflows}
          allWorkflows={allWorkflows}
          executingIds={executingIds}
          handleExecuteNew={handleExecuteNew}
        />
      ) : (
        <InstancesTable
          filteredExecutions={filteredExecutions}
          allInstances={allInstances}
          openInstanceSteps={openInstanceSteps}
        />
      )}

      <ExecutionResultModal
        activeExecutionId={activeExecutionId}
        executionResults={executionResults}
        instances={instances}
        setActiveExecutionId={setActiveExecutionId}
      />

      <InstanceStepsModal
        activeInstanceMeta={activeInstanceMeta}
        instanceSteps={instanceSteps}
        instanceStepsLoading={instanceStepsLoading}
        instanceStepsError={instanceStepsError}
        setActiveInstanceMeta={setActiveInstanceMeta}
        setInstanceSteps={setInstanceSteps}
        setInstanceStepsError={setInstanceStepsError}
      />
    </div>
  );
};
