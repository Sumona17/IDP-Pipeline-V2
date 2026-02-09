import { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { Save, Plus } from "lucide-react";

const initialNodes: Node[] = [
  {
    id: "start",
    position: { x: 100, y: 100 },
    data: { label: "Start" },
    type: "input",
  },
];

export const WorkflowDesigner = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState("New Workflow");

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const id = `${type}-${nodes.length + 1}`;
    const newNode: Node = {
      id,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `${type} Node` },
      type: type === "end" ? "output" : "default",
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const saveWorkflow = async () => {
    // Generate valid WorkflowSchema JSON
    const workflowId = `${workflowName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")}`;

    const steps: any[] = [];

    nodes.forEach((node) => {
      if (node.id === "start") return; // visual start node, logic starts from its connection

      const outboundEdges = edges.filter((e) => e.source === node.id);
      const transitions = outboundEdges.map((edge) => ({
        condition: "true", // Default condition
        nextStepId: edge.target,
        expressionLanguage: "js",
      }));

      // If it's the end node
      if (node.type === "output" || node.type === "end") {
        steps.push({
          stepId: node.id,
          name: node.data.label,
          type: "terminalStep",
          tasks: [
            {
              taskId: `${node.id}_end_task`,
              name: "End Task",
              handler: {
                type: "rest",
                method: "GET",
                url: "http://localhost:3000/health",
              },
            },
          ],
        });
        return;
      }

      // Task Step
      steps.push({
        stepId: node.id,
        name: node.data.label,
        type: "taskStep",
        tasks: [
          {
            taskId: `${node.id}_task`,
            name: `Task for ${node.data.label}`,
            handler: {
              type: "rest",
              method: "GET",
              url: "http://localhost:3000/health", // Default URL
            },
          },
        ],
        transitions: transitions.length > 0 ? transitions : undefined,
      });
    });

    // Find initial step (connected to Start node)
    const startEdges = edges.filter((e) => e.source === "start");
    const firstStepId =
      startEdges.length > 0 ? startEdges[0].target : steps[0]?.stepId;

    // Reorder steps to ensure first step is first? Schema doesn't strictly require it but logic might.
    // But logic extracts startStepId. Wait, my logic in backend used: defBody.steps[0].stepId.
    // So I MUST put the start step first in the array.

    if (firstStepId) {
      const firstIdx = steps.findIndex((s) => s.stepId === firstStepId);
      if (firstIdx > 0) {
        const [first] = steps.splice(firstIdx, 1);
        steps.unshift(first);
      }
    }

    const definition = {
      workflowId,
      name: workflowName,
      version: "1.0.0",
      description: "Created via Designer",
      flowType: "sequential",
      steps,
    };

    try {
      const res = await fetch("http://localhost:3000/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          definition, // Controller extracts fields from definition
        }),
      });
      if (res.ok) {
        alert("Workflow saved!");
      } else {
        const error = await res.json();
        alert("Failed to save: " + JSON.stringify(error));
      }
    } catch (err) {
      console.error(err);
      alert("Error saving workflow");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-semibold border-none focus:ring-0 text-gray-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addNode("task")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
          <button
            onClick={() => addNode("end")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add End
          </button>
          <button
            onClick={saveWorkflow}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save Workflow
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};
