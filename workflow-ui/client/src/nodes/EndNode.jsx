import { Handle, Position } from "reactflow";

export default function EndNode({ id, data }) {
  return (
    <div style={{
        ...style,
        border: data.error ? "2px solid red" : "1px solid rgb(242 61 61)"
      }}>
      <div className="text-center text-sm font-bold text-white">
        {data.label || "End"}
      </div>
      <Handle type="target" position={Position.Top} />
    </div>
  );
}

const style = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "rgb(242, 61, 61)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6
};
