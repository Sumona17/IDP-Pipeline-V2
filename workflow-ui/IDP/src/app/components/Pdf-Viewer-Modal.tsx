import { Modal, Spin, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "../styles/Pdf-View-Modal.scss";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerModalProps {
  visible: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string;
  fetchFile: (fileKey: string) => Promise<string>;
}

const PDF_BASE_WIDTH = 612;

export default function PdfViewerModal({
  visible,
  onClose,
  fileUrl,
  fileName,
  fetchFile,
}: PdfViewerModalProps) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !fileUrl) return;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setPdfData(null);
        setNumPages(0);

        const encodedPdfData = await fetchFile(fileUrl);
        const bytes = Uint8Array.from(atob(encodedPdfData), (c) => c.charCodeAt(0));
        setPdfData(bytes);
      } catch {
        message.error("Failed to load PDF. Please try again.");
        setPdfData(null);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [visible, fileUrl]);

  const scale = containerWidth ? Math.min(containerWidth / PDF_BASE_WIDTH, 1.5) : 1;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="85%"
      destroyOnClose
      title={fileName || "Document Viewer"}
      className="pdf-viewer-modal"
    >
      {loading ? (
        <div className="pdf-loading">
          <Spin size="large" />
        </div>
      ) : pdfData ? (
        <div ref={containerRef} className="pdf-container">
          <Document
            file={{ data: pdfData.slice() }}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => message.error("Unable to render PDF document.")}
          >
            {Array.from({ length: numPages }, (_, index) => (
              <div key={`page_${index + 1}`} className="pdf-page-wrapper">
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  width={Math.max(containerWidth - 40, 600)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </Document>
        </div>
      ) : (
        <strong className="pdf-no-preview">No preview available</strong>
      )}
    </Modal>
  );
}