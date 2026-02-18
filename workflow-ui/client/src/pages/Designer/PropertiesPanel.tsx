import type { Node, Edge } from "reactflow";
import { DecisionTable, type DecisionTableRow } from "./DecisionTable";

/* ---------- ID Generator ---------- */
const generateId = (prefix: string) => {
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${random}`;
};

type Props = {
  node: Node | null;
  edge: Edge | null;
  updateNode: (id: string, data: Record<string, unknown>) => void;
  updateEdge: (id: string, data: Record<string, unknown>) => void;
};

export const PropertiesPanel = ({ node, edge, updateNode, updateEdge }: Props) => {
  if (!node && !edge) {
    return (
      <div className="w-full md:w-80 border-t md:border-l p-4 bg-gray-50 h-full overflow-y-auto overflow-x-hidden flex-shrink-0">
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">Select a node or edge to edit properties</p>
        </div>
      </div>
    );
  }

  /* ---------------- EDGE PROPERTIES ---------------- */
  if (edge) {
    const update = (key: string, value: unknown) => {
      updateEdge(edge.id, { ...edge.data, [key]: value });
    };

    return (
      <div key={edge.id} className="w-full md:w-80 border-t md:border-l p-6 space-y-6 bg-white h-full overflow-y-auto overflow-x-hidden flex-shrink-0">
        <div>
          <h3 className="font-bold text-gray-900 mb-1">Edge Properties</h3>
          <p className="text-xs text-gray-500">Edit connection settings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Connection</label>
          <div className="text-xs text-gray-600 space-y-1">
            <p><span className="font-medium">From:</span> {edge.source}</p>
            <p><span className="font-medium">To:</span> {edge.target}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Label / Condition</label>
          <input
            type="text"
            value={edge.data?.label ?? ""}
            onChange={(e) => update("label", e.target.value)}
            placeholder="e.g., YES, NO, approved"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Add a condition or label for this connection</p>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">Changes are saved automatically</p>
        </div>
      </div>
    );
  }

  /* ---------------- NODE PROPERTIES ---------------- */
  if (!node) return null;

  const update = (key: string, value: unknown) => {
    updateNode(node.id, { ...node.data, [key]: value });
  };

  return (
    <div key={node.id} className="w-full md:w-80 border-t md:border-l p-6 space-y-6 bg-white h-full overflow-y-auto overflow-x-hidden flex-shrink-0">
      <div>
        <h3 className="font-bold text-gray-900 mb-1">Properties</h3>
        <p className="text-xs text-gray-500">Edit node settings below</p>
      </div>

      {/* Node Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 capitalize">
          {node.type}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input
          type="text"
          value={node.data.label ?? ""}
          onChange={(e) => update("label", e.target.value)}
          placeholder="Enter node name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* ---------------- TASK FIELDS ---------------- */}
      {node.type === "task" && (
        <>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
            <input
              type="text"
              value={node.data.assignee ?? ""}
              onChange={(e) => update("assignee", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div> */}

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Retries</label>
            <input
              type="number"
              min="0"
              max="10"
              value={node.data.retries ?? 0}
              onChange={(e) => update("retries", Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div> */}

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={node.data.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div> */}

          {/* <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
            <input
              type="text"
              value={node.data.value ?? ""}
              onChange={(e) => update("value", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div> */}

        {/* ---------- FUNCTION SECTION ---------- */}
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-semibold text-gray-900">Function</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Function</label>
            <select
              value={node.data.function ?? ""}
              onChange={(e) => update("function", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select Function</option>
              <option value="send_email">Send Email</option>
              <option value="api_call">API Call</option>
              <option value="human_driven">Human Driven</option>
              <option value="execute_lambda">execute_lambda</option>
            </select>
          </div>

          {/* -------- SEND EMAIL CONFIG -------- */}
          {node.data.function === "send_email" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sender</label>
                <input
                  type="text"
                  value={node.data.sender ?? ""}
                  onChange={(e) => update("sender", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                <input
                  type="text"
                  value={node.data.recipient ?? ""}
                  onChange={(e) => update("recipient", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objective</label>
                <select
                  value={node.data.objective ?? ""}
                  onChange={(e) => update("objective", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select Objective</option>
                  <option value="apply_leave">Apply Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mail Body</label>
                <input
                  type="text"
                  value={node.data.mailBody ?? ""}
                  onChange={(e) => update("mailBody", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

            </>
          )}

          {/* -------- API CALL CONFIG -------- */}
          {node.data.function === "api_call" && (
            <>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                <input
                  type="text"
                  value={node.data.url ?? ""}
                  onChange={(e) => update("url", e.target.value)}
                  placeholder="http://localhost"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div> */}

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                <input
                  type="text"
                  value={node.data.port ?? ""}
                  onChange={(e) => update("port", e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                <select
                  value={node.data.method ?? "POST"}
                  onChange={(e) => update("method", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {node.data.method === 'POST' && <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
                <input
                  type="text"
                  value={node.data.body ?? ""}
                  onChange={(e) => update("body", e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
                {/* <select
                  value={node.data.endpoint ?? "/mockapicall"}
                  onChange={(e) => update("endpoint", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="/mockapicall">/mockapicall</option>
                </select> */}
                <input
                  type="text"
                  value={node.data.endpoint ?? ""}
                  onChange={(e) => update("endpoint", e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </>
          )}
        </div>


        </>
      )}

      {/* ---------------- GATEWAY FIELDS ---------------- */}
      {node.type === "gateway" && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Decision Table</h4>
          <DecisionTable
            rows={((node.data.decisionRules as DecisionTableRow[]) || []).map((rule) => ({
              id: rule.id || generateId("rule"),
              condition: rule.condition || "",
              output: rule.output || "",
              description: rule.description || ""
            }))}
            hitPolicy={(node.data.hitPolicy as "first" | "all" | "any") || "first"}
            onUpdate={(rows) => {
              const updatedRules = rows.map((rule) => ({
                id: rule.id || generateId("rule"),
                condition: rule.condition,
                output: rule.output
              }));
              update("decisionRules", updatedRules);
            }}
            onHitPolicyChange={(policy) => update("hitPolicy", policy)}
          />
        </div>
      )}

      {node.data?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">⚠ {node.data.error}</p>
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">Changes are saved automatically</p>
      </div>
    </div>
  );
};
