import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalSort } from "../../../utils/global-sort";
import { fetchMySubmissionList } from "../../../services/submission-list";
import * as XLSX from "xlsx";
interface QueueSubmission {
  submissionId: string;
  documentSource: string;
  status: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}
interface ColumnConfig {
  key: keyof QueueSubmission;
  label: string;
}

const MyQueue: React.FC = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [activeTab, setActiveTab] = useState("all");

  const [submissions, setSubmissions] = useState<QueueSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns: ColumnConfig[] = [
    { key: "submissionId", label: "Submission ID" },
    { key: "documentSource", label: "Document Source" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
    { key: "createdBy", label: "Created By" },
  ];

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setLoading(true);
        const data: any = await fetchMySubmissionList();
        setSubmissions(data);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setError("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  const normalizeStatus = (status: string): string =>
    status.toUpperCase().replace(/\s/g, "");

  const allCount = submissions.length;
  const pendingCount = submissions.filter((s) =>
    ["PENDING", "PENDINGREVIEW"].includes(normalizeStatus(s.status)),
  ).length;

  const inProgressCount = submissions.filter((s) =>
    ["INREVIEW", "INPROGRESS"].includes(normalizeStatus(s.status)),
  ).length;

  const completedCount = submissions.filter((s) =>
    ["COMPLETED"].includes(normalizeStatus(s.status)),
  ).length;

  const tabs = [
    { key: "all", label: `All (${allCount})` },
    { key: "pending", label: `Pending (${pendingCount})` },
    { key: "inprogress", label: `In Progress (${inProgressCount})` },
    { key: "completed", label: `Completed (${completedCount})` },
  ];

  const changeTab = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  const tabFilteredSubmissions = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return submissions.filter((s) =>
          ["PENDING", "PENDINGREVIEW"].includes(normalizeStatus(s.status)),
        );
      case "inprogress":
        return submissions.filter((s) =>
          ["INREVIEW", "INPROGRESS"].includes(normalizeStatus(s.status)),
        );
      case "completed":
        return submissions.filter((s) =>
          ["COMPLETED"].includes(normalizeStatus(s.status)),
        );
      default:
        return submissions;
    }
  }, [submissions, activeTab]);

  const filteredSubmissions = useMemo(() => {
    return tabFilteredSubmissions.filter((sub) => {
      const matchesSearch =
        sub.submissionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.documentSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.createdBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || sub.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tabFilteredSubmissions, searchTerm, statusFilter]);

  const { sortedData, SortHeader } =
    useGlobalSort<QueueSubmission>(filteredSubmissions);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const currentSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeTab]);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const handleSubmissionClick = (submissionId: string) => {
    navigate(`/submission-details/${submissionId}`);
  };

  const formatSubmissionId = (id: string) => id.slice(0, 8);


  const getStatusColor = (status: string): string => {
    const normalized = normalizeStatus(status);

    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      PENDINGREVIEW: "bg-yellow-100 text-yellow-800 border-yellow-200",
      INREVIEW: "bg-blue-100 text-blue-800 border-blue-200",
      INPROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
      COMPLETED: "bg-green-100 text-green-800 border-green-200",
    };

    return colors[normalized] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const exportToExcel = () => {
    if (!submissions.length) return;

    const worksheet = XLSX.utils.json_to_sheet(submissions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "My Queue");
    XLSX.writeFile(workbook, "my_queue.xlsx");
  };

  return (
    <div className="w-full p-2">
      <div className="flex items-center justify-between w-full">
        <div>
          <h2 className="text-[18px] font-semibold">My Queue ({allCount})</h2>
          <p className="text-sm text-gray-500">Your assigned submissions</p>
        </div>

        <button
          onClick={exportToExcel}
          disabled={!submissions.length}
          className="border border-[#3C20F6] text-[#3C20F6] bg-[#E6DAFF] px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
        >
          Export Table
        </button>
      </div>

      <div className="mt-3 inline-flex items-center bg-[#E6DAFF] px-1 h-10 rounded-full">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeTab(tab.key)}
            className={`px-4 h-10 text-sm font-medium rounded-full transition ${
              activeTab === tab.key
                ? "bg-[#3C20F6] text-white"
                : "text-[#3C20F6]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm mt-4 p-3 border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((column) =>
                  column.key === "createdAt" || column.key === "updatedAt" ? (
                    <SortHeader
                      key={column.key}
                      columnKey={column.key}
                      label={column.label}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase"
                    />
                  ) : (
                    <th
                      key={column.key}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase"
                    >
                      {column.label}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-sm text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-sm text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : currentSubmissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-sm text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                currentSubmissions.map((sub) => (
                  <tr key={sub.submissionId}>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleSubmissionClick(sub.submissionId)}
                        title={sub.submissionId}
                        className="text-xs font-medium text-[#3C20F6] hover:underline"
                      >
                        {formatSubmissionId(sub.submissionId)}
                      </button>
                    </td>

                    <td className="px-3 py-3">{sub.documentSource}</td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center justify-center min-w-[90px] px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          sub.status,
                        )}`}
                      >
                        {sub.status}
                      </span>
                    </td>

                    <td className="px-3 py-3">{formatDate(sub.createdAt)}</td>
                    <td className="px-3 py-3">{formatDate(sub.updatedAt)}</td>
                    <td className="px-3 py-3">{sub.createdBy}</td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyQueue;
