export const registerKeyboard = (
  deleteSelected: () => void,
  undo: () => void,
  redo: () => void
) => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Delete") deleteSelected();
    if (e.ctrlKey && e.key === "z") undo();
    if (e.ctrlKey && e.shiftKey && e.key === "Z") redo();
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
};
