import { Modal, Spin, message } from "antd";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { fetchDocument } from "../services/documnet-view-service";
import "../styles/Pdf-View-Modal.scss";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerModalProps {
  visible: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string;
}

const PDF_BASE_WIDTH = 612;
const PAGE_HEIGHT_ESTIMATE = 850; // px, used as placeholder before page renders
const RENDER_BUFFER = 1; // extra pages to render above/below viewport

export default function PdfViewerModal({
  visible,
  onClose,
  fileUrl,
  fileName,
}: PdfViewerModalProps) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2]));

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const pdfFile = useMemo(
    () => (pdfData ? { data: pdfData } : null),
    [pdfData]
  );

  // Faster base64 → Uint8Array than Uint8Array.from(atob(...))
  const base64ToBytes = useCallback((base64: string): Uint8Array => {
    const binary = atob(base64.trim());
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }, []);

  // Track which pages are visible using IntersectionObserver
  const setupPageObserver = useCallback(() => {
    if (!scrollRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            const pageNum = Number(entry.target.getAttribute("data-page"));
            if (!pageNum) return;
            if (entry.isIntersecting) {
              // Add page + buffer pages around it
              for (let i = pageNum - RENDER_BUFFER; i <= pageNum + RENDER_BUFFER; i++) {
                if (i >= 1) next.add(i);
              }
            }
          });
          return next;
        });
      },
      {
        root: scrollRef.current,
        rootMargin: "200px 0px", // pre-load slightly ahead of scroll
        threshold: 0,
      }
    );

    pageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (numPages > 0) {
      const cleanup = setupPageObserver();
      return cleanup;
    }
  }, [numPages, setupPageObserver]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) {
        setContainerWidth((prev) => (Math.abs(w - prev) > 5 ? w : prev));
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
        setVisiblePages(new Set([1, 2]));

        const base64 = await fetchDocument(fileUrl);
        setPdfData(base64ToBytes(base64));
      } catch (err) {
        console.error("PDF load error:", err);
        message.error("Failed to load PDF. Please try again.");
        setPdfData(null);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [visible, fileUrl, base64ToBytes]);

  const pageWidth = Math.max(containerWidth - 40, 600);
  const scale = Math.min(containerWidth / PDF_BASE_WIDTH, 1.5);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="85%"
      title={fileName || "Document Viewer"}
      className="pdf-viewer-modal"
    >
      {loading ? (
        <div className="pdf-loading">
          <Spin size="large" />
        </div>
      ) : pdfFile ? (
        <div ref={containerRef} className="pdf-container">
          {/* Scrollable viewport — IntersectionObserver root */}
          <div ref={scrollRef} className="pdf-scroll-area">
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                // Pre-load first few pages immediately
                setVisiblePages(new Set(Array.from({ length: Math.min(3, numPages) }, (_, i) => i + 1)));
              }}
              onLoadError={(err) => {
                console.error("PDF render error:", err);
                message.error("Unable to render PDF document.");
              }}
            >
              {Array.from({ length: numPages }, (_, index) => {
                const pageNum = index + 1;
                const isVisible = visiblePages.has(pageNum);

                return (
                  <div
                    key={`page_${pageNum}`}
                    className="pdf-page-wrapper"
                    data-page={pageNum}
                    ref={(el) => {
                      if (el) pageRefs.current.set(pageNum, el);
                      else pageRefs.current.delete(pageNum);
                    }}
                    // Reserve space so scroll position stays stable
                    style={{
                      minHeight: isVisible ? undefined : PAGE_HEIGHT_ESTIMATE,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {isVisible && (
                      <Page
                        pageNumber={pageNum}
                        width={pageWidth}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    )}
                  </div>
                );
              })}
            </Document>
          </div>
        </div>
      ) : (
        <strong className="pdf-no-preview">No preview available</strong>
      )}
    </Modal>
  );
}