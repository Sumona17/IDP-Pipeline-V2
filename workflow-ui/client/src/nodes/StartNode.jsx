import { Handle, Position } from "reactflow";

export default function StartNode({ id, data }) {
  return (
    <div style={{
        ...style,
        border: data.error ? "2px solid red" : "1px solid #22c55e"
      }}>
      <div className="text-center text-sm font-bold text-white">
        {data.label || "Start"}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const style = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "#22c55e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6
};
