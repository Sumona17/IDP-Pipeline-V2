import { RefreshCw, Download } from "lucide-react";

interface FiltersBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedTab: "workflows" | "instances";
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  autoRefresh: boolean;
  setAutoRefresh: (value: boolean) => void;
  exportData: () => void;
}

export const FiltersBar = ({
  searchTerm,
  setSearchTerm,
  selectedTab,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  autoRefresh,
  setAutoRefresh,
  exportData,
}: FiltersBarProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <input
            type="text"
            placeholder={
              selectedTab === "instances"
                ? "Search by instance ID..."
                : "Search by workflow name..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Status</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const newState = !autoRefresh;
              setAutoRefresh(newState);
              localStorage.setItem("autoRefresh", newState.toString());
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition flex-1 justify-center ${
              autoRefresh
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-700 border border-gray-300"
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Auto</span>
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            title="Export as JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
