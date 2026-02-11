export const Swimlane = ({ label }: { label: string }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-32 bg-gray-50 border-b flex items-center">
      <div className="w-32 text-center font-semibold border-r h-full flex items-center justify-center">
        {label}
      </div>
    </div>
  );
};
