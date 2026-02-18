import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Connection,
  type Node,
  type Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Plus, Save, ChevronRight, ChevronLeft, X } from "lucide-react";

import StartNode from "../nodes/StartNode.jsx";
import TaskNode from "../nodes/TaskNode.jsx";
import GatewayNode from "../nodes/GatewayNode.jsx";
import EndNode from "../nodes/EndNode.jsx";
import { PropertiesPanel } from "./Designer/PropertiesPanel.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ---------------- Node types ---------------- */

const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  gateway: GatewayNode,
  end: EndNode,
};

const generateId = (prefix: string) => {
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${random}`;
};

/* ---------------- Validation ---------------- */

const validateWorkflow = (nodes: Node[], edges: Edge[]) => {
  const errors: Record<string, string> = {};

  const starts = nodes.filter((n) => n.type === "start");
  if (starts.length > 1) {
    starts.forEach((n) => {
      errors[n.id] = "Only one Start node allowed";
    });
  }

  nodes.forEach((node) => {
    const incoming = edges.filter((e) => e.target === node.id);
    const outgoing = edges.filter((e) => e.source === node.id);

    if (node.type === "start" && outgoing.length < 1) {
      errors[node.id] = "Start node cannot have 0 outgoing connections";
    }

    if (node.type === "task" && !node.data?.label?.trim()) {
      errors[node.id] = "Task name is required";
    }

    if (node.type === "gateway" && outgoing.length < 1) {
      errors[node.id] = "Gateway requires at least one outgoing path";
    }

    if (node.type === "end" && incoming.length === 0) {
      errors[node.id] = "End node must have an incoming connection";
    }
  });

  return errors;
};

/* ---------------- Main ---------------- */

export const WorkflowDesigner = () => {
  const location = useLocation();
  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [workflowObject, setWorkflowObject] = useState<any>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executedNodes] = useState<Set<string>>(new Set());
  const [executedEdges] = useState<Set<string>>(new Set());

  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const applyWorkflowObject = useCallback(
    (workflow: any) => {
      if (!workflow) return;

      if (workflow.name) {
        setWorkflowName(workflow.name);
      }

      const nextNodes = (workflow.nodes || []).map((node: any) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          label: node.data?.label || "",
          valueType: node.data?.valueType || "static",
          function: node.data?.function || "",
          sender: node.data?.sender || "",
          recipient: node.data?.recipient || "",
          objective: node.data?.objective || "",
          mailBody: node.data?.mailBody || "",
          url: node.data?.url || "",
          port: node.data?.port || "",
          method: node.data?.method || "POST",
          body: node.data?.body || "",
          endpoint: node.data?.endpoint || "/mockapicall",
          decisionRules: node.data?.decisionRules || [],
        },
      }));

      const nextEdges = (workflow.edges || []).map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {
          ...(edge.data || {}),
          label: edge.data?.label ?? edge.label ?? "",
        },
        type: edge.type || "smoothstep",
        markerEnd: edge.markerEnd || { type: MarkerType.ArrowClosed },
      }));

      setNodes(nextNodes);
      setEdges(nextEdges);
    },
    [setEdges, setNodes],
  );

  useEffect(() => {
    const incomingWorkflow = (location.state as any)?.workflow;
    if (incomingWorkflow) {
      localStorage.setItem("exists", "true");
      setWorkflowObject(incomingWorkflow);
      applyWorkflowObject(incomingWorkflow);
      return;
    } else {
      localStorage.setItem("exists", "false");
    }
    applyWorkflowObject(workflowObject);
  }, [workflowObject, applyWorkflowObject, location.state]);

  const errors = validateWorkflow(nodes, edges);

  /* ----------- Connections (arrows) ----------- */

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: generateId("edge"),
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            data: { label: "" },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  /* ----------- Node helpers ----------- */

  const updateNode = (id: string, newData: Record<string, unknown>) => {
    setNodes((nds) => {
      const updated = nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...newData } } : n,
      );

      if (selectedNode?.id === id) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, ...newData } } : prev,
        );
      }

      return updated;
    });
  };

  const updateEdge = (id: string, data: Record<string, unknown>) => {
    setEdges((eds) => {
      const updated = eds.map((e) => (e.id === id ? { ...e, data } : e));
      // Update selectedEdge if it's the one being edited
      if (selectedEdge?.id === id) {
        setSelectedEdge({ ...selectedEdge, data });
      }
      return updated;
    });
  };

  const addNode = (type: string) => {
    const newId = generateId(type);

    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type,
        position: {
          x: window.innerWidth / 2 - 75,
          y: window.innerHeight / 2 - 150,
        },
        data: {
          label:
            type === "start"
              ? "Start"
              : type === "end"
                ? "End"
                : type === "gateway"
                  ? "Decision"
                  : "New Task",
          valueType: "static",
          function: "",
          sender: "",
          recipient: "",
          objective: "",
          mailBody: "",
          url: "",
          port: "",
          body: "",
          method: "POST",
          endpoint: "/mockapicall",
          decisionRules: [], // ensure exists for gateway
        },
      },
    ]);
  };

  /* ----------- Keyboard delete ----------- */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedNode) {
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) =>
          eds.filter(
            (e) => e.source !== selectedNode.id && e.target !== selectedNode.id,
          ),
        );
        setSelectedNode(null);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedNode, setNodes, setEdges]);

  /* ----------- Save ----------- */

  const buildWorkflowObject = () => {
    const workflowId = workflowName.toLowerCase().replace(/[^a-z0-9-_]/g, "-");

    return {
      workflowId,
      name: workflowName,
      description: "Created via Workflow Designer",
      version: "1.0.0",

      nodes: nodes.map((node) => {
        // Base structure for all nodes
        const baseNode: any = {
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            label: node.data?.label || "",
          },
        };

        // Task node extra fields
        if (node.type === "task") {
          baseNode.data.assignee = node.data?.assignee || "";
          baseNode.data.description = node.data?.description || "";
          baseNode.data.value = node.data?.value || "";
          baseNode.data.valueType = node.data?.valueType || "static";

          baseNode.data.function = node.data?.function || "";

          if (node.data.function === "send_email") {
            baseNode.data.sender = node.data?.sender || "";
            baseNode.data.recipient = node.data?.recipient || "";
            baseNode.data.objective = node.data?.objective || "";
            baseNode.data.mailBody = node.data?.mailBody || "";
          }

          if (node.data.function === "api_call") {
            baseNode.data.url = node.data?.url || "";
            baseNode.data.port = node.data?.port || "";
            baseNode.data.body = node.data?.body || "";
            baseNode.data.method = node.data?.method || "POST";
            baseNode.data.endpoint = node.data?.endpoint || "/sendmail";
          }
        }

        // Gateway node decision rules
        if (node.type === "gateway") {
          baseNode.data.decisionRules = (node.data?.decisionRules || []).map(
            (rule: any) => ({
              id: rule.id || generateId("rule"),
              condition: rule.condition,
              output: rule.output,
            }),
          );
        }

        return baseNode;
      }),

      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.data?.label || "",
      })),
    };
  };

  const saveWorkflow = async () => {
    const e = localStorage.getItem("exists");
    const storedWorkflowId = localStorage.getItem("workflowId");

    if (e === "true") {
    }

    const validationErrors = validateWorkflow(nodes, edges);
    if (Object.keys(validationErrors).length > 0) {
      alert(
        "Cannot save workflow with errors. Please fix the following issues:\n\n" +
          Object.values(validationErrors).join("\n"),
      );
      return;
    }

    const nextWorkflowObject = buildWorkflowObject();
    setWorkflowObject(nextWorkflowObject);

    console.log("Saved Workflow Object:");
    console.log(JSON.stringify(nextWorkflowObject, null, 2));

    console.log("nodes", nextWorkflowObject.nodes.length);

    if (
      !nextWorkflowObject.name ||
      nextWorkflowObject.name.trim() === "" ||
      nextWorkflowObject.nodes.length <= 0
    ) {
      alert("Invalid workflow");
      return;
    }

    const objectToBeSaved = {
      name: nextWorkflowObject.name,
      description: nextWorkflowObject.description,
      version: nextWorkflowObject.version,
      definitionJson: JSON.stringify(nextWorkflowObject),
    };

    if (e === "true" && storedWorkflowId) {
      axios
        .put(
          `${import.meta.env.VITE_APP_BASE_URL}/${storedWorkflowId}`,
          objectToBeSaved,
        )
        .then((res) => {
          console.log("Update response: ", res);
          alert("Workflow updated successfully");
          localStorage.setItem("exists", "false");
          localStorage.removeItem("workflowId");
          navigate("/");
        })
        .catch((err) => {
          console.log("Error updating workflow", err);
        });
      return;
    }

    axios
      .post(`${import.meta.env.VITE_APP_BASE_URL}/save`, objectToBeSaved)
      .then((res) => {
        console.log("Saving response: ", res);
        alert("Workflow saved successfully");
        localStorage.setItem("exists", "false");
        localStorage.removeItem("workflowId");
        navigate("/");
      })
      .catch((err) => {
        console.log("Error saving workflow", err);
      });
  };

  /* ----------- Workflow Execution ----------- */

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="text-lg font-semibold border-none focus:ring-0 w-full sm:w-auto"
        />

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => addNode("start")} className={btn}>
            <Plus className="w-4 h-4" /> Start
          </button>
          <button onClick={() => addNode("task")} className={btn}>
            <Plus className="w-4 h-4" /> Task
          </button>
          {/* <button onClick={() => addNode("gateway")} className={btn}>
            <Plus className="w-4 h-4" /> Gateway
          </button> */}
          <button onClick={() => addNode("end")} className={btn}>
            <Plus className="w-4 h-4" /> End
          </button>
          <button onClick={saveWorkflow} className={saveBtn}>
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      {/* Canvas + Properties */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <div className="flex-1 min-h-[360px]">
          <ReactFlow
            className="h-full w-full"
            nodes={nodes.map((n) => ({
              ...n,
              data: {
                ...n.data,
                error: errors[n.id],
                isExecuted: executedNodes.has(n.id),
              },
              style: executedNodes.has(n.id)
                ? { opacity: 1, boxShadow: "0 0 0 2px #22c55e" }
                : {},
            }))}
            edges={edges.map((e) => ({
              ...e,
              label: e.data?.label || "",
              style: executedEdges.has(e.id)
                ? { stroke: "#22c55e", strokeWidth: 3 }
                : {},
            }))}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              // Get the latest node data from the nodes array
              const latestNode = nodes.find((n) => n.id === node.id) || node;
              setSelectedNode(latestNode);
              setSelectedEdge(null);
            }}
            onEdgeClick={(_, edge) => {
              // Get the latest edge data from the edges array
              const latestEdge = edges.find((e) => e.id === edge.id) || edge;
              setSelectedEdge(latestEdge);
              setSelectedNode(null);
            }}
            onPaneClick={() => {
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
            defaultEdgeOptions={{
              type: "smoothstep",
              markerEnd: { type: MarkerType.ArrowClosed },
            }}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>

        {/* Minimized Panel Toggle Button */}
        {isPanelMinimized && (
          <button
            onClick={() => setIsPanelMinimized(false)}
            className="fixed md:absolute right-4 bottom-4 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
            title="Expand properties panel"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Properties Panel */}
        {!isPanelMinimized && (
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setIsPanelMinimized(true)}
              className="hidden md:flex absolute -left-10 top-4 p-2 bg-gray-200 text-gray-700 rounded-l hover:bg-gray-300 transition"
              title="Minimize properties panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <PropertiesPanel
              node={selectedNode}
              edge={selectedEdge}
              updateNode={updateNode}
              updateEdge={updateEdge}
            />
          </div>
        )}
      </div>

      {/* Execution Result Modal */}
      {executionResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Execution Result
                </h2>
                <p
                  className={`text-sm mt-1 font-medium ${
                    executionResult.status === "completed"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  Status: {executionResult.status.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setExecutionResult(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Error message */}
              {executionResult.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                  <p className="text-sm text-red-700">
                    {executionResult.errorMessage}
                  </p>
                </div>
              )}

              {/* Execution Path */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Execution Path
                </h3>
                <div className="flex flex-wrap gap-2">
                  {executionResult.path.map((nodeId: string, idx: number) => {
                    const node = nodes.find((n) => n.id === nodeId);
                    return (
                      <div key={nodeId} className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
                          {node?.data?.label || nodeId}
                        </span>
                        {idx < executionResult.path.length - 1 && (
                          <span className="text-gray-400">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Executed Steps */}
              {executionResult.executedSteps.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Steps</h3>
                  <div className="space-y-2">
                    {executionResult.executedSteps.map(
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
                          {step.value !== undefined && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600">
                                Assigned Value:{" "}
                              </span>
                              <span className="font-mono bg-white px-2 py-1 rounded border border-gray-300">
                                {typeof step.value === "object"
                                  ? JSON.stringify(step.value)
                                  : String(step.value)}
                              </span>
                              {step.valueType && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({step.valueType})
                                </span>
                              )}
                            </div>
                          )}
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

              {/* Task Values Summary */}
              {Object.keys(executionResult.taskValues).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Task Values
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <pre className="text-xs overflow-x-auto text-gray-700">
                      {JSON.stringify(executionResult.taskValues, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6 flex gap-2">
              <button
                onClick={() => setExecutionResult(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- Styles ---------------- */

const btn =
  "flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50";

const saveBtn =
  "flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700";
