type Props = {
  x: number;
  y: number;
  onDelete: () => void;
  onDuplicate: () => void;
};

export const ContextMenu = ({ x, y, onDelete, onDuplicate }: Props) => {
  return (
    <div
      style={{ top: y, left: x }}
      className="absolute bg-white shadow rounded border z-50"
    >
      <button className="block px-4 py-2 hover:bg-gray-100" onClick={onDuplicate}>
        Duplicate
      </button>
      <button className="block px-4 py-2 hover:bg-gray-100" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
};
