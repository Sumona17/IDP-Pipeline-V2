import { useEffect, useState } from "react";
import { Table, Button, message, Progress } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getSubmissionDocuments,
  type SubmissionDocument,
} from "../../services/document-list-service";
import { InstanceStepsModal, type InstanceLogStep } from "./InstanceStepsModal";
import { workflowBaseURL } from "../../config/configuration";
import { fetchDocument } from "../../services/documnet-view-service";
import apiClient from "../../services/handler";

import "../../styles/uploaded-documents.scss";
import { documentColumns } from "../../data/static-text";
import PdfViewerModal from "../../components/Pdf-Viewer-Modal";
import { formatTimestamp } from "../../utils/global-sort";
import UploadDrawer from "../../components/file-upload/file-upload";
import { getValidateData } from "../../services/file-validate-service";
import FinalExtractedDataModal from "./final-extracted-data-modal";
import { useAuth } from "react-oidc-context";

interface DocumentRow {
  key: string;
  id: string;
  name: string;
  customer: string;
  date: string;
  size: string;
  fileUrl: string;
  status: string;
  createdAt: string;
  extractedDataKey: string;
  originalFileKey: string;
  fileProgress: string;
}

const INGESTION_IN_PROGRESS = "Ingestion in Progress";

const mapToDocumentRow = (doc: SubmissionDocument): DocumentRow => ({
  key: doc.documentId,
  id: doc.documentId,
  name: doc.fileName,
  status: doc.status ?? "—",
  customer: "-",
  createdAt: doc?.createdAt
    ? formatTimestamp(parseInt(doc.createdAt), true)
    : "-",
  date: new Date().toLocaleDateString("en-US"),
  size: doc.fileSize,
  fileUrl: doc.originalFileKey,
  extractedDataKey: doc.extractedDataKey,
  originalFileKey: doc.originalFileKey,
  fileProgress: doc.fileProgress ?? "",
});

export default function DocumentUploaded() {
  const auth = useAuth();
  const userGroups = Array.isArray(auth?.user?.profile?.["cognito:groups"])
    ? (auth?.user?.profile?.["cognito:groups"] as string[])
    : [];

  const isReviewer = userGroups.includes("reviewer");
  const isApprover = userGroups.includes("approver");
  const navigate = useNavigate();
  const location = useLocation();
  const { submissionId } = useParams<{ submissionId: string }>();

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfName, setSelectedPdfName] = useState("");

  const [instanceSteps, setInstanceSteps] = useState<InstanceLogStep[] | null>(
    null,
  );
  const [instanceStepsLoading, setInstanceStepsLoading] = useState(false);
  const [instanceStepsError, setInstanceStepsError] = useState<string | null>(
    null,
  );
  const [showInstanceStepsModal, setShowInstanceStepsModal] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [openFinalExtractedDataModal, setOpenFinalExtractedDataModal] =
    useState(false);
  const [isFinalDataLoading, setIsFinalDataLoading] = useState(true);
  const [finalExtractedData, setFinalExtractedData] = useState(null);
  const [finalDataError, setFinalDataError] = useState("");

  const isApprovalWindow = location.state?.isApprovalWindow;

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await getSubmissionDocuments(
        submissionId,
        location.state.isApprovalWindow,
      );
      setDocuments(data.map(mapToDocumentRow));
    } catch (err) {
      message.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!submissionId) return;

    fetchDocs();
  }, [submissionId, drawerOpen]);

  const openViewer = (fileKey: string, name: string) => {
    setSelectedPdfUrl(fileKey);
    setSelectedPdfName(name);
    setViewerVisible(true);
  };

  const closeViewer = () => {
    setViewerVisible(false);
    setSelectedPdfUrl(null);
    setSelectedPdfName("");
  };

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      message.loading({ content: "Downloading file...", key: "download" });
      const encodedPdfData = await fetchDocument(fileKey);
      const bytes = Uint8Array.from(atob(encodedPdfData), (c) =>
        c.charCodeAt(0),
      );
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      message.success({
        content: "File downloaded successfully",
        key: "download",
      });
    } catch (err) {
      message.error({ content: "Failed to download file", key: "download" });
    }
  };

  const handleOpenLogs = async (instanceId: string) => {
    setActiveInstanceId(instanceId);
    setShowInstanceStepsModal(true);
    setInstanceStepsLoading(true);
    setInstanceStepsError(null);
    setInstanceSteps(null);
    try {
      const response = await apiClient.get<InstanceLogStep[]>(
        `${workflowBaseURL}/logs/${instanceId}`,
      );
      setInstanceSteps(Array.isArray(response) ? response : []);
    } catch (err) {
      setInstanceStepsError(
        err instanceof Error ? err.message : "Failed to load logs",
      );
      setInstanceSteps([]);
    } finally {
      setInstanceStepsLoading(false);
    }
  };

  const closeLogsModal = () => {
    setShowInstanceStepsModal(false);
    setInstanceSteps(null);
    setInstanceStepsError(null);
    setActiveInstanceId(null);
  };

  // const handleDocumentClick = (record: DocumentRow) => {
  //   navigate(
  //     `/document-review/${submissionId}/${encodeURIComponent(record.id)}/${encodeURIComponent(record.extractedDataKey)}/${encodeURIComponent(record.originalFileKey)}`,
  //     { state: { docStatus: record.status } },
  //   );
  // };
  const handleDocumentClick = (record: DocumentRow) => {
    const baseRoute = isApprover ? "document-approval" : "document-review";

    navigate(
      `/${baseRoute}/${submissionId}/${encodeURIComponent(record.id)}/${encodeURIComponent(record.extractedDataKey)}/${encodeURIComponent(record.originalFileKey)}`,
      {
        state: {
          docStatus: record.status,
          isApprovalWindow,
        },
      },
    );
  };

  const handleViewFinalExtractedData = async (doc: DocumentRow) => {
    setOpenFinalExtractedDataModal(true);
    setIsFinalDataLoading(true);

    try {
      if (doc.status === "Approved") {
        const data = await getValidateData({
          submissionId: submissionId,
          documentId: doc.id,
          extractedDataKey: doc.extractedDataKey,
          originalFileKey: doc.originalFileKey,
        });

        setFinalExtractedData(data.extractedData);
        setIsFinalDataLoading(false);
      }
    } catch (error) {
      setFinalDataError(
        error instanceof Error
          ? error.message
          : "Failed to load extracted data",
      );
    } finally {
      setIsFinalDataLoading(false);
    }
  };
  const updatedColumns = documentColumns.map((col) => {
    if (col.key === "name") {
      return {
        ...col,
        render: (_: unknown, record: DocumentRow) => {
          const isIngesting = record.status === INGESTION_IN_PROGRESS;
          return isIngesting ? (
            <span
              className="text-gray-400 cursor-not-allowed truncate"
              title="Document is being ingested, please wait..."
            >
              {record.name}
            </span>
          ) : (
            <button
              onClick={() => handleDocumentClick(record)}
              className="text-[#3C20F6] hover:underline text-left truncate"
            >
              {record.name}
            </button>
          );
        },
      };
    }

    if (col.key === "actions") {
      return {
        ...col,
        render: (_: unknown, record: DocumentRow) => (
          <div className="doc-actions">
            <Button
              icon={<EyeOutlined />}
              onClick={() => openViewer(record.fileUrl, record.name)}
              className="doc-btn"
            >
              View
            </Button>

            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record.fileUrl, record.name)}
              className="doc-btn"
            >
              Download
            </Button>

            <Button
              className="doc-btn"
              title="View Logs"
              onClick={() => handleOpenLogs(record.id)}
              icon={
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h4"
                  />
                </svg>
              }
            >
              Logs
            </Button>
            {record.status == "Approved" ? (
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleViewFinalExtractedData(record)}
                className="doc-btn"
              >
                Final Extracted Data
              </Button>
            ) : (
              []
            )}
          </div>
        ),
      };
    }

    if (col.key === "fileProgress") {
      return {
        ...col,
        render: (_: unknown, record: DocumentRow) => {
          const progressValue = Number(record.fileProgress || 0);
          const color =
            progressValue === 100
              ? "#52c41a"
              : progressValue >= 70
                ? "#1890ff"
                : progressValue >= 30
                  ? "#faad14"
                  : "#ff4d4f";

          return (
            <div style={{ minWidth: 100 }}>
              <div style={{ display: "flex" }}>
                <span
                  style={{ fontSize: 12, fontWeight: 600, color, minWidth: 35 }}
                >
                  {progressValue}%
                </span>
                <Progress
                  percent={progressValue}
                  size="small"
                  showInfo={false}
                  strokeColor={color}
                  style={{ flex: 1, marginBottom: 0 }}
                  status={
                    progressValue === 100
                      ? "success"
                      : progressValue > 0
                        ? "active"
                        : undefined
                  }
                />
              </div>
            </div>
          );
        },
      };
    }

    return col;
  });

  const handleRefresh = () => {
    fetchDocs();
  };
  return (
    <div className="uploaded-docs-container">
      <div className="uploaded-docs-header">
        <h2 className="page-title">Documents Uploaded</h2>
        <div className="button-container">
          <button
            className="bg-[#3C20F6] text-white px-5 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 hover:bg-[#2d18c4] transition-colors"
            onClick={handleRefresh}
          >
            Refresh
          </button>
          {isReviewer && (
            <button
              className="bg-[#3C20F6] text-white px-5 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 hover:bg-[#2d18c4] transition-colors"
              onClick={() => setDrawerOpen(true)}
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
          )}
        </div>
      </div>

      <Table
        columns={updatedColumns}
        dataSource={documents}
        loading={loading}
        pagination={false}
        className="docs-table"
        rowKey="key"
        size="small"
      />

      <PdfViewerModal
        visible={viewerVisible}
        onClose={closeViewer}
        fileUrl={selectedPdfUrl}
        fileName={selectedPdfName}
      />

      <InstanceStepsModal
        isOpen={showInstanceStepsModal}
        activeInstanceId={activeInstanceId}
        instanceSteps={instanceSteps}
        instanceStepsLoading={instanceStepsLoading}
        instanceStepsError={instanceStepsError}
        onClose={closeLogsModal}
      />

      <UploadDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        submissionId={submissionId}
      />
      <FinalExtractedDataModal
        visible={openFinalExtractedDataModal}
        onClose={() => setOpenFinalExtractedDataModal(false)}
        data={[finalExtractedData]}
        loading={isFinalDataLoading}
        error={finalDataError}
      />
    </div>
  );
}
