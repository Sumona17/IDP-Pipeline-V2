import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export interface DecisionTableRow {
  id: string;
  condition: string;
  output: string;
  description: string;
}

type Props = {
  rows: DecisionTableRow[];
  onUpdate: (rows: DecisionTableRow[]) => void;
  hitPolicy?: "first" | "all" | "any";
  onHitPolicyChange?: (policy: "first" | "all" | "any") => void;
};

export const DecisionTable = ({
  rows,
  onUpdate,
  hitPolicy = "first",
  onHitPolicyChange,
}: Props) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const addRow = () => {
    const newRow: DecisionTableRow = {
      id: `row-${Date.now()}`,
      condition: "",
      output: "",
      description: "",
    };
    onUpdate([...rows, newRow]);
  };

  const deleteRow = (id: string) => {
    onUpdate(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof DecisionTableRow, value: string) => {
    onUpdate(
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const moveRow = (id: string, direction: "up" | "down") => {
    const index = rows.findIndex((r) => r.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === rows.length - 1)
    ) {
      return;
    }

    const newRows = [...rows];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newRows[index], newRows[swapIndex]] = [newRows[swapIndex], newRows[index]];
    onUpdate(newRows);
  };

  const toggleExpandRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  return (
    <div className="space-y-4">
      {/* Hit Policy Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hit Policy
        </label>
        <select
          value={hitPolicy}
          onChange={(e) => onHitPolicyChange?.(e.target.value as "first" | "all" | "any")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="first">First Match (executes first matching rule)</option>
          <option value="any">Any Match (executes any matching rule)</option>
          <option value="all">All Matches (executes all matching rules)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Determines how multiple matching rules are handled
        </p>
      </div>

      {/* Decision Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-3 gap-0">
          <div className="px-4 py-3 text-xs font-semibold text-gray-700 border-r border-gray-200">
            Condition
          </div>
          <div className="px-1 py-3 text-xs font-10 text-gray-700 border-r border-gray-200">
            Output/Result
          </div>
          <div className="px-4 py-3 text-xs font-semibold text-gray-700">
            Actions
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500">
            <p className="text-sm">No decision rules added yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rows.map((row, index) => (
              <div key={row.id}>
                <div
                  className="grid grid-cols-3 gap-0 bg-white hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => toggleExpandRow(row.id)}
                >
                  <div className="px-4 py-3 text-sm border-r border-gray-200 font-mono break-words">
                    {row.condition || <span className="text-gray-400">No condition</span>}
                  </div>
                  <div className="px-4 py-3 text-sm border-r border-gray-200 break-words">
                    {row.output || <span className="text-gray-400">No output</span>}
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveRow(row.id, "up");
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      )}
                      {index < rows.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveRow(row.id, "down");
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRow(row.id);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRows.has(row.id) && (
                  <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Condition
                      </label>
                      <input
                        type="text"
                        value={row.condition}
                        onChange={(e) => updateRow(row.id, "condition", e.target.value)}
                        placeholder="Enter condition (supports JavaScript expressions)"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-small text-gray-700 mb-1">
                        Output/Result
                      </label>
                      <input
                        type="text"
                        value={row.output}
                        onChange={(e) => updateRow(row.id, "output", e.target.value)}
                        placeholder="Enter output (e.g., approved, rejected, needsReview)"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        value={row.description}
                        onChange={(e) => updateRow(row.id, "description", e.target.value)}
                        placeholder="Document what this rule does"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Row Button */}
      <button
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Decision Rule
      </button>

      {/* Info Box */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 mb-2">
          <span className="font-medium">📝 Condition Syntax:</span>
        </p>
        <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
          <li>Use task/node names: <code className="bg-blue-100 px-1 rounded">Task1 {'<'} 100</code></li>
          <li>Comparison operators: <code className="bg-blue-100 px-1 rounded">{'>'}, {'<'}, ==, !=, {'>='},  {'<='}</code></li>
          <li>Logical operators: <code className="bg-blue-100 px-1 rounded">{'&&'}, {'||'}, {'!'}</code></li>
          <li>Examples: <code className="bg-blue-100 px-1 rounded">Task1 {'>'} 50 {'&&'} Task2 == "approved"</code></li>
        </ul>
        <p className="text-xs text-blue-700 mt-2">
          <span className="font-medium">📤 Output:</span> Enter the edge label that should be followed (must match edge label exactly)
        </p>
      </div>
    </div>
  );
};
