import { createElement } from "react";

export const resolveValue = (
  value: string,
  taskValues: Record<string, any>,
): any => {
  const refMatch = value.match(/\$?\{?([a-zA-Z0-9\-_]+)\.([a-zA-Z0-9_]+)\}?/);
  if (refMatch) {
    const [, nodeId, field] = refMatch;
    return taskValues[nodeId]?.[field] ?? value;
  }
  const num = Number(value);
  return isNaN(num) ? value : num;
};

export const evaluateCondition = (
  condition: string,
  taskValues: Record<string, any>,
  nodeNameMap: Record<string, string>,
): boolean => {
  try {
    let evalStr = condition;

    for (const [nodeName, nodeId] of Object.entries(nodeNameMap)) {
      const nameRegex = new RegExp(`\\b${nodeName}\\b`, "g");
      const nodeTaskData = taskValues[nodeId];
      if (nodeTaskData?.assignedValue !== undefined) {
        evalStr = evalStr.replace(
          nameRegex,
          JSON.stringify(nodeTaskData.assignedValue),
        );
      }
    }

    const refMatches = condition.matchAll(
      /\$?\{?([a-zA-Z0-9\-_]+)\.([a-zA-Z0-9_]+)\}?/g,
    );
    for (const match of refMatches) {
      const [fullMatch, nodeId, field] = match;
      const value = taskValues[nodeId]?.[field];
      evalStr = evalStr.replace(fullMatch, JSON.stringify(value));
    }

    return eval(evalStr);
  } catch (err) {
    console.error(
      "Condition evaluation error:",
      err,
      "Condition:",
      condition,
    );
    return false;
  }
};

export const formatPayload = (payload: unknown): string => {
  if (payload === null || payload === undefined) return "";
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return payload;
    }
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
};

export const getStatusBadge = (status: string) => {
  const statusStyles: Record<string, { bg: string; text: string }> = {
    COMPLETED: { bg: "bg-green-100", text: "text-green-800" },
    FAILED: { bg: "bg-red-100", text: "text-red-800" },
    RUNNING: { bg: "bg-blue-100", text: "text-blue-800" },
    PENDING: { bg: "bg-gray-100", text: "text-gray-800" },
  };

  const style = statusStyles[status] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
  };

  return createElement(
    "span",
    {
      className: `w-[100%] inline-flex justify-center items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`,
    },
    status,
  );
};

export const getStepStatusStyle = (status: string) => {
  const styles: Record<string, { dot: string; badge: string }> = {
    COMPLETED: { dot: "bg-green-500", badge: "bg-green-100 text-green-800" },
    FAILED: { dot: "bg-red-500", badge: "bg-red-100 text-red-800" },
    STARTED: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800" },
    RUNNING: { dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800" },
    PENDING: { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-800" },
  };

  return (
    styles[status] || {
      dot: "bg-gray-400",
      badge: "bg-gray-100 text-gray-800",
    }
  );
};
