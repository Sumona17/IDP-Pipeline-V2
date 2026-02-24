import { useEffect, useState } from "react";
import { Table, Button, Upload, message, Progress } from "antd";
import type { UploadProps } from "antd";
import { EyeOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { getSubmissionDocuments, type SubmissionDocument } from "../../services/document-list-service";
import { InstanceStepsModal, type InstanceLogStep } from "./InstanceStepsModal";
import { workflowBaseURL } from "../../config/configuration";
import { fetchDocument } from "../../services/documnet-view-service";
import apiClient from "../../services/handler";

import "../../styles/uploaded-documents.scss";
import { documentColumns } from "../../data/static-text";
import PdfViewerModal from "../../components/Pdf-Viewer-Modal";
import { formatTimestamp } from "../../utils/global-sort";

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

const mapToDocumentRow = (doc: SubmissionDocument): DocumentRow => ({
  key: doc.documentId,
  id: doc.documentId,
  name: doc.fileName,
  status: doc.status ?? "—",
  customer: "-",
  createdAt:  formatTimestamp(parseInt(doc.createdAt), true),
  date: new Date().toLocaleDateString("en-US"),
  size: doc.fileSize,
  fileUrl: doc.originalFileKey,
  extractedDataKey: doc.extractedDataKey,
  originalFileKey: doc.originalFileKey,
  fileProgress: doc.fileProgress ?? "",
});

export default function DocumentUploaded() {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfName, setSelectedPdfName] = useState("");

  const [instanceSteps, setInstanceSteps] = useState<InstanceLogStep[] | null>(null);
  const [instanceStepsLoading, setInstanceStepsLoading] = useState(false);
  const [instanceStepsError, setInstanceStepsError] = useState<string | null>(null);
  const [showInstanceStepsModal, setShowInstanceStepsModal] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) return;
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const data = await getSubmissionDocuments(submissionId);
        setDocuments(data.map(mapToDocumentRow));
      } catch (err) {
        console.error("Failed to fetch submission documents:", err);
        message.error("Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [submissionId]);

  const handleUpload: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
    if (!submissionId) {
      message.error("Submission ID not found");
      return;
    }
    try {
      message.loading({ content: "Uploading document...", key: "upload" });
      message.success({ content: "Document uploaded successfully", key: "upload" });
      onSuccess?.("ok");
    } catch (error) {
      message.error({ content: "File upload failed", key: "upload" });
      onError?.(error as Error);
    }
  };

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
      const bytes = Uint8Array.from(atob(encodedPdfData), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      message.success({ content: "File downloaded successfully", key: "download" });
    } catch (err) {
      console.error("Failed to download document:", err);
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
        `${workflowBaseURL}/logs/${instanceId}`
      );
      setInstanceSteps(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Failed to fetch instance logs:", err);
      setInstanceStepsError(err instanceof Error ? err.message : "Failed to load logs");
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

 const handleDocumentClick = (record: DocumentRow) => {
  console.log('[DocumentUploaded] navigate params →', {
      submissionId,
      documentId: record.id,
      extractedDataKey: record.extractedDataKey,
      originalFileKey: record.originalFileKey,
    });
    navigate(
      `/document-review/${submissionId}/${encodeURIComponent(record.id)}/${encodeURIComponent(record.extractedDataKey)}/${encodeURIComponent(record.originalFileKey)}`
    );
  };
  const updatedColumns = documentColumns.map((col) => {
    if (col.key === "name") {
      return {
        ...col,
        render: (_: unknown, record: DocumentRow) => (
          <button
            onClick={() => handleDocumentClick(record)}
            className="text-[#3C20F6] hover:underline text-left truncate"
          >
            {record.name}
          </button>
        ),
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
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: color,
                minWidth: 35,
              }}
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
  return (
    <div className="uploaded-docs-container">
      <div className="uploaded-docs-header">
        <h2 className="page-title">Documents Uploaded</h2>

        <Upload accept=".pdf" showUploadList={false} customRequest={handleUpload}>
          <Button icon={<UploadOutlined />} className="upload-document-btn">
            Upload Document
          </Button>
        </Upload>
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
    </div>
  );
}