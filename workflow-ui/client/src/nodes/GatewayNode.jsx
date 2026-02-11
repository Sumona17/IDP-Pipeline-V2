import { Handle, Position } from "reactflow";

export default function GatewayNode({ id, data }) {
  return (
    <div style={wrapper}>
      <div style={{
        ...diamond,
        border: data.error ? "2px solid red" : "1px solid #fbbf24"
      }}>
        <div style={content}>
          <div className="text-center text-xs font-medium text-gray-900 px-1 break-words">
            {data.label || "Decision"}
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const wrapper = {
  width: 100,
  height: 100,
  position: "relative"
};

const diamond = {
  width: "100%",
  height: "100%",
  background: "#fde68a",
  transform: "rotate(45deg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const content = {
  transform: "rotate(-45deg)",
  width: "70%",
  height: "70%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};
