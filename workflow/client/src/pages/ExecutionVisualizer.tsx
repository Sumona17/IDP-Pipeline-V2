import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

interface TaskRecord {
  id: string;
  taskId: string;
  name: string;
  status: string;
  input?: string;
  output?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

interface WorkflowDefinition {
  definition: string;
  name: string;
}

interface Instance {
  id: string;
  status: string;
  currentStepId?: string;
  createdAt: string;
  completedAt?: string;
  tasks: TaskRecord[];
  workflowDefinition: WorkflowDefinition;
}

export const ExecutionVisualizer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const fetchExecution = () => {
    if (!id) return;

    fetch(`http://localhost:3000/executions/${id}`)
      .then((res) => res.json())
      .then((data: Instance) => {
        setInstance(data);

        const definition = JSON.parse(data.workflowDefinition.definition);

        const flowNodes: Node[] = [];
        const flowEdges: Edge[] = [];

        flowNodes.push({
          id: "start",
          position: { x: 100, y: 100 },
          data: { label: "Start", status: "completed" },
          type: "input",
          style: {
            background: "#10b981",
            color: "white",
            border: "2px solid #059669",
          },
        });

        definition.steps.forEach((step: any, index: number) => {
          let nodeStatus = "pending";
          const stepTasks = data.tasks.filter((t) =>
            t.taskId.startsWith(step.stepId),
          );

          if (stepTasks.length > 0) {
            const allCompleted = stepTasks.every(
              (t) => t.status === "COMPLETED",
            );
            const anyFailed = stepTasks.some((t) => t.status === "FAILED");

            if (anyFailed) nodeStatus = "failed";
            else if (allCompleted) nodeStatus = "completed";
            else nodeStatus = "running";
          }

          if (data.currentStepId === step.stepId && data.status === "RUNNING") {
            nodeStatus = "running";
          }

          let bgColor = "#94a3b8";
          let borderColor = "#64748b";

          if (nodeStatus === "completed") {
            bgColor = "#10b981";
            borderColor = "#059669";
          } else if (nodeStatus === "running") {
            bgColor = "#3b82f6";
            borderColor = "#2563eb";
          } else if (nodeStatus === "failed") {
            bgColor = "#ef4444";
            borderColor = "#dc2626";
          }

          flowNodes.push({
            id: step.stepId,
            position: { x: 100 + (index + 1) * 250, y: 100 },
            data: {
              label: step.name,
              status: nodeStatus,
              type: step.type,
            },
            type: step.type === "terminalStep" ? "output" : "default",
            style: {
              background: bgColor,
              color: "white",
              border: `2px solid ${borderColor}`,
              cursor: "pointer",
            },
          });

          if (step.transitions && step.transitions.length > 0) {
            step.transitions.forEach((trans: any) => {
              flowEdges.push({
                id: `${step.stepId}-${trans.nextStepId}`,
                source: step.stepId,
                target: trans.nextStepId,
                animated: nodeStatus === "running",
              });
            });
          }
        });

        if (definition.steps.length > 0) {
          flowEdges.push({
            id: "start-first",
            source: "start",
            target: definition.steps[0].stepId,
            animated: false,
          });
        }

        setNodes(flowNodes);
        setEdges(flowEdges);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExecution();
  }, [id]);

  const onNodeClick: NodeMouseHandler = (_event, node) => {
    setSelectedNode(node.id === selectedNode ? null : node.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "IN_PROGRESS":
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case "RUNNING":
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return "N/A";
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = endTime - startTime;

    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(2)}s`;
    return `${(duration / 60000).toFixed(2)}m`;
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const formatJSON = (jsonString?: string) => {
    if (!jsonString) return "N/A";
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  const downloadLogs = () => {
    if (!instance) return;

    const logs = {
      executionId: instance.id,
      workflowName: instance.workflowDefinition.name,
      status: instance.status,
      createdAt: instance.createdAt,
      completedAt: instance.completedAt,
      tasks: instance.tasks.map((task) => ({
        name: task.name,
        taskId: task.taskId,
        status: task.status,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        input: task.input ? JSON.parse(task.input) : null,
        output: task.output ? JSON.parse(task.output) : null,
        error: task.error,
      })),
    };

    const jsonString = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `execution-logs-${instance.id.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Execution not found</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedNodeTasks = selectedNode
    ? instance.tasks.filter((t) => t.taskId.startsWith(selectedNode))
    : instance.tasks;

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline"
          >
            Dashboard
          </button>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-gray-900 font-medium truncate max-w-xs">
            {instance?.workflowDefinition.name}
          </span>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-gray-500 truncate">
            {instance?.id.slice(0, 8)}...
          </span>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {instance?.workflowDefinition.name}
              </h2>
              <p className="text-sm text-gray-500">
                Execution: {instance?.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Duration:</span>{" "}
              {instance &&
                formatDuration(instance.createdAt, instance.completedAt)}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Tasks:</span>{" "}
              {instance &&
                `${instance.tasks.filter((t) => t.status === "COMPLETED").length}/${instance.tasks.length} completed`}
              {instance &&
                instance.tasks.filter((t) => t.status === "FAILED").length >
                  0 && (
                  <span className="text-red-600 ml-1">
                    (
                    {instance.tasks.filter((t) => t.status === "FAILED").length}{" "}
                    failed)
                  </span>
                )}
            </div>
            <div className="flex items-center gap-2">
              {instance && getStatusIcon(instance.status)}
              <span className="text-sm font-medium">{instance?.status}</span>
            </div>
            <div className="flex gap-2 border-l border-gray-200 pl-6">
              <button
                onClick={fetchExecution}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                title="Refresh execution"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={downloadLogs}
                disabled={!instance}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                title="Download execution logs"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            onNodeClick={onNodeClick}
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>

        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              {selectedNode ? `Tasks for ${selectedNode}` : "All Tasks"}
            </h3>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                Show all tasks
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-200">
            {selectedNodeTasks.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No tasks for this step
              </div>
            ) : (
              selectedNodeTasks.map((task) => {
                const isExpanded = expandedTasks.has(task.id);
                return (
                  <div key={task.id} className="p-4">
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => toggleTaskExpansion(task.id)}
                    >
                      <div className="flex items-start gap-2 flex-1">
                        {getStatusIcon(task.status)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {task.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {task.taskId}
                          </div>
                          <div className="text-xs text-gray-500">
                            Duration:{" "}
                            {formatDuration(task.startedAt, task.completedAt)}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 text-xs">
                        {task.startedAt && (
                          <div>
                            <div className="text-gray-500 font-medium">
                              Started:
                            </div>
                            <div className="text-gray-700">
                              {new Date(task.startedAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {task.completedAt && (
                          <div>
                            <div className="text-gray-500 font-medium">
                              Completed:
                            </div>
                            <div className="text-gray-700">
                              {new Date(task.completedAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-gray-500 font-medium mb-1">
                            Input:
                          </div>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {formatJSON(task.input)}
                          </pre>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium mb-1">
                            Output:
                          </div>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {formatJSON(task.output)}
                          </pre>
                        </div>
                        {task.error && (
                          <div>
                            <div className="text-red-600 font-medium mb-1">
                              Error:
                            </div>
                            <pre className="bg-red-50 p-2 rounded text-xs overflow-x-auto text-red-700">
                              {task.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
