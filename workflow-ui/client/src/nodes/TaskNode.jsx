import { Handle, Position } from "reactflow";

export default function TaskNode({ data }) {
  return (
    <div
      style={{
        ...style,
        border: data.error ? "2px solid red" : "1px solid #38bdf8"
      }}
    >
      <div className="text-center text-sm font-medium text-gray-900 px-2 break-words">
        {data.label || "Task"}
      </div>

      {data.function && (
        <div className="text-xs text-gray-600 mt-1">
          ⚙ {data.function === "send_mail" ? "Send Mail" : data.function}
        </div>
      )}

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const style = {
  width: 160,
  minHeight: 60,
  padding: 6,
  borderRadius: 6,
  background: "#e0f2fe",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center"
};
