import type { ExecutionInstance } from "./types";

interface StatisticsCardsProps {
  allInstances: ExecutionInstance[];
}

export const StatisticsCards = ({ allInstances }: StatisticsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="text-gray-500 text-sm font-medium">Total Runs</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">
          {allInstances && allInstances.length}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="text-gray-500 text-sm font-medium">Success Rate</div>
        <div className="text-3xl font-bold text-green-600 mt-2">
          {allInstances && allInstances.length > 0
            ? (
                (allInstances?.filter((i) => i.status === "COMPLETED").length /
                  allInstances.length) *
                100
              ).toFixed(2)
            : 0}
          %
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="text-gray-500 text-sm font-medium">Completed</div>
        <div className="text-3xl font-bold text-green-600 mt-2">
          {allInstances &&
            allInstances.filter((i) => i.status === "COMPLETED").length}
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="text-gray-500 text-sm font-medium">Failed</div>
        <div className="text-3xl font-bold text-red-600 mt-2">
          {allInstances &&
            allInstances.filter((i) => i.status === "FAILED").length}
        </div>
      </div>
    </div>
  );
};
