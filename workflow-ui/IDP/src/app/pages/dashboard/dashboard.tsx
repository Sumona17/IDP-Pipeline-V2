import React, { useCallback, useEffect, useState } from "react";
import OpenQueue from "./open-queue/open-queue";
import MyQueue from "./my-queue/my-queue";
import MyApproval from "./my-approval/my-approval";
import UploadDrawer from "../../components/file-upload/file-upload";
import { fetchAllSubmissions } from "../../services/fetch-all-submission";

type TabType = "open" | "my" | "approval";

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("open");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    loadSubmissions();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Document Processing Queue
        </h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-[#3C20F6] text-white px-5 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 hover:bg-[#2d18c4] transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0L9 7m3-3l3 3"
            />
          </svg>
          Upload Files
        </button>
      </div>

      <div className="flex-shrink-0 border-b border-gray-300">
        <div className="px-6 flex">
          <button
            onClick={() => setActiveTab("open")}
            className={`relative px-6 py-3 text-sm font-semibold font-medium transition-colors ${activeTab === "open" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
          >
            Open Queue
            {activeTab === "open" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === "my" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
          >
            My Queue
            {activeTab === "my" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("approval")}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === "my" ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
          >
            My Approval
            {activeTab === "approval" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "open" && (
          <div className="h-full p-0">
            <OpenQueue
              submissions={submissions}
              loading={loading}
              refreshSubmissions={loadSubmissions}
            />
          </div>
        )}
        {activeTab === "my" && (
          <div className="h-full p-0">
            <MyQueue />
          </div>
        )}
        {activeTab === "approval" && (
          <div className="h-full p-0">
            <MyApproval />
          </div>
        )}
      </div>

      <UploadDrawer open={drawerOpen} onClose={handleDrawerClose} />
    </div>
  );
};

export default Dashboard;
