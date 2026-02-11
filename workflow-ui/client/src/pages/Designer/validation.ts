import type { Node, Edge } from "reactflow";

export const validateWorkflow = (nodes: Node[], edges: Edge[]) => {
  const errors: Record<string, string> = {};

  const starts = nodes.filter(n => n.type === "start");
  if (starts.length > 1) {
    starts.forEach(n => errors[n.id] = "Only one Start node allowed");
  }

  nodes.forEach(node => {
    const incoming = edges.filter(e => e.target === node.id);
    const outgoing = edges.filter(e => e.source === node.id);

    if (node.type === "start" && incoming.length > 0) {
      errors[node.id] = "Start node cannot have incoming edges";
    }

    if (node.type === "end" && incoming.length === 0) {
      errors[node.id] = "End node must have an incoming edge";
    }

    if (node.type === "gateway" && outgoing.length < 2) {
      errors[node.id] = "Gateway needs at least 2 outgoing paths";
    }
  });

  return errors;
};
