import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatTimestamp, useGlobalSort } from "../../../utils/global-sort";
import { fetchAllSubmissions } from "../../../services/fetch-all-submission";
import { updateSubmissionStatus } from "../../../services/status-update";
import { useAuth } from "react-oidc-context";
interface ApiSubmission {
  documentSource?: string;
  submissionId: string;
  incomingPath: string;
  status: string;
  createdBy?: string | null;
  createdAt: string;
}
interface QueueDocument {
  id: string;
  documentSource: string;
  status: string;
  createdBy: string;
  createdAt: string;
}
interface ColumnConfig {
  key: keyof QueueDocument;
  label: string;
}

const OpenQueue: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const [documents, setDocuments] = useState<QueueDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const ITEMS_PER_PAGE = 5;

  const columns: ColumnConfig[] = [
    { key: "id", label: "Submission ID" },
    { key: "createdBy", label: "Created By" },
    { key: "createdAt", label: "Created At" },
    { key: "documentSource", label: "Source" },
    { key: "status", label: "Status" },
  ];

  const { sortedData, SortHeader } = useGlobalSort<QueueDocument>(documents);

  const totalPages = useMemo(
    () => Math.ceil(sortedData.length / ITEMS_PER_PAGE),
    [sortedData],
  );

  const currentDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedData, currentPage]);

  const formatSubmissionId = (id: string) => id.slice(0, 8);

  const mapSubmission = useCallback(
    (item: ApiSubmission): QueueDocument => ({
      id: item.submissionId,
      documentSource:
        item.documentSource === "EMAIL_UPLOAD" ? "Email" : item.documentSource,
      status:
        item.status === "PENDING"
          ? "Pending Review"
          : item.status === "IN-REVIEW"
            ? "In Progress"
            : item.status,
      createdBy: item.createdBy ?? "-",
      createdAt: item.createdAt,
    }),
    [],
  );

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setLoading(true);
        const data: ApiSubmission[] = await fetchAllSubmissions();
        setDocuments(data.map(mapSubmission));
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [mapSubmission]);

  const handleSubmissionClick = useCallback(
    async (submissionId: string) => {
      try {
        const email = auth.user?.profile?.email ?? "";
        const userName = email.split("@")[0] ?? "";

        await updateSubmissionStatus({
          submissionId,
          status: "IN-REVIEW",
          userName,
          eMail: email,
        });

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === submissionId ? { ...doc, status: "In Progress" } : doc,
          ),
        );

        navigate(`/submission-details/${submissionId}`);
      } catch (error) {
        console.error("Failed to update status:", error);
      }
    },
    [auth.user, navigate],
  );

  return (
    <div className="w-full p-2">
      <div className="bg-white rounded-xl shadow-sm mt-4 p-3 border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((column) => (
                  <SortHeader
                    key={column.key}
                    columnKey={column.key}
                    label={column.label}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase"
                  />
                ))}
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : currentDocuments.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-6">
                    No data available
                  </td>
                </tr>
              ) : (
                currentDocuments.map((doc) => (
                  <tr key={doc.id} className=" hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleSubmissionClick(doc.id)}
                        className="text-[#3C20F6] text-xs font-medium hover:underline"
                        title={doc.id}
                      >
                        {formatSubmissionId(doc.id)}
                      </button>
                    </td>

                    <td className="px-3 py-2">{doc.createdBy}</td>

                    <td className="px-3 py-2">
                      {formatTimestamp(parseInt(doc.createdAt), true)}
                    </td>

                    <td className="px-3 py-2">{doc.documentSource}</td>

                    <td className="px-3 py-2">{doc.status}</td>

                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleSubmissionClick(doc.id)}
                        className="text-blue-600 text-xs font-medium hover:underline"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-3 py-1 border rounded text-xs disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-xs flex items-center">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-3 py-1 border rounded text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenQueue;
