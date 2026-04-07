import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  getValidateData,
  submitExtractedData,
  updateExtractedData,
} from "../../services/file-validate-service";
import editIcon from "../../../../public/assets/icons/penicon.png";
import arrowIcon from "../../../../public/assets/icons/arrowicon.png";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../../components/confirmation-modal";


interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface TableRow {
  key: string;
  section?: string;
  field: string;
  fieldPath?: string;
  value: string;
  confidence: number | null;
  confidencePercent: string;
  boundingBox: BoundingBox | null;
  page: number;
  review: boolean;
  overrideValue: string;
  isSection?: boolean;
}

interface RowEdit {
  review: boolean;
  overrideValue: string;
}

interface EditedEntry {
  originalValue: string;
  newValue: string;
}

interface DiffEntry {
  key: string;
  section: string;
  field: string;
  fieldPath?: string;
  originalValue: string;
  newValue: string;
  confidence: number | null;
  page: number;
}

type ToastType = "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: number) => void;
}> = ({ toasts, onRemove }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium min-w-[280px] max-w-sm animate-slide-in transition-all
          ${toast.type === "success"
            ? "bg-white border-emerald-200 text-emerald-800"
            : "bg-white border-red-200 text-red-800"
          }`}
      >
        {toast.type === "success" ? (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        ) : (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        )}
        <span className="flex-1">{toast.message}</span>
        <button
          onClick={() => onRemove(toast.id)}
          className={`flex-shrink-0 hover:opacity-60 transition-opacity ${toast.type === "success" ? "text-emerald-400" : "text-red-400"}`}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    ))}
  </div>
);

const DocumentComparison: React.FC = () => {
  const {
    submissionId,
    documentId,
    extractedDataKey: encodedDataKey,
    originalFileKey: encodedFileKey,
  } = useParams<{
    submissionId: string;
    documentId: string;
    extractedDataKey: string;
    originalFileKey: string;
  }>();

  const extractedDataKey = decodeURIComponent(encodedDataKey ?? "");
  const originalFileKey = decodeURIComponent(encodedFileKey ?? "");

  const [apiResponse, setApiResponse] = useState<any>(null);
  const [encodedPdfData, setEncodedPdfData] = useState<string>("");
  const [selectedField, setSelectedField] = useState<TableRow | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [baseScale, setBaseScale] = useState<number>(1);
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [rowEdits, setRowEdits] = useState<Record<string, RowEdit>>({});
  const [renderedPages, setRenderedPages] = useState<Record<number, any>>({});
  const [naturalPageSize, setNaturalPageSize] = useState({
    width: 0,
    height: 0,
  });
  const [highlightBox, setHighlightBox] = useState<any>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string>("");
  const [dataError, setDataError] = useState<string>("");
  const [editingField, setEditingField] = useState<any>(null);
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, EditedEntry>>(
    {},
  );
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [pdfPageDimsIn, setPdfPageDimsIn] = useState<Record<number, { width: number; height: number }>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [currentSaveAction, setCurrentSaveAction] = useState(null);
  const [diff, setDiff] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfScrollRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const renderTasksRef = useRef<Record<number, any>>({});
  const pdfjsRef = useRef<any>(null);

  const DPI_SCALE = 2;
  const CONFIDENCE_THRESHOLD = 70;
  const TOAST_DURATION_MS = 4000;

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      TOAST_DURATION_MS,
    );
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const formatConfidenceScore = (score: number | null): string =>
    score === null || score === undefined ? "-" : Math.round(score).toString();

  const getConfidenceColor = (confidence: number | null): string => {
    if (confidence === null) return "text-gray-600";
    if (confidence >= 95) return "text-emerald-600";
    if (confidence >= CONFIDENCE_THRESHOLD) return "text-amber-600";
    return "text-red-600";
  };

  const getConfidenceBg = (confidence: number | null): string => {
    if (confidence === null) return "bg-white";
    if (confidence >= 95) return "bg-white";
    if (confidence >= CONFIDENCE_THRESHOLD) return "bg-amber-50";
    return "bg-red-50";
  };

  const transformBBoxForRotation = (bbox: BoundingBox, rotation: number): BoundingBox => {
    const { left, top, width, height } = bbox;
    switch (rotation) {
      case 90:
        return { left: top, top: 1 - left - width, width: height, height: width };
      case 180:
        return { left: 1 - left - width, top: 1 - top - height, width, height };
      case 270:
        return { left: 1 - top - height, top: left, width: height, height: width };
      default:
        return bbox;
    }
  };
  const getHighlightColor = (confidenceScore: number | null): string => {
    const score = Number(confidenceScore);
    return !score || score < CONFIDENCE_THRESHOLD ? "#EF4444" : "#3C20F6";
  };

  const formatLabel = (key: string): string =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();

  const parseJsonIfString = (value: any): any => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return value;
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  };

  const getByPath = (obj: any, path: string): any => {
    if (!path) return obj;
    return path
      .split(".")
      .reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);
  };

  const resolveExtractedData = (source: any): any => {
    const parsedSource = parseJsonIfString(source);
    const candidatePaths = [
      "extractedData.data",
      "extractedData.data.data",
      "extractedData.extractedDataJson",
      "extractedDataJson",
      "data.extractedData.data",
      "data.extractedData.data.data",
      "data.extractedData.extractedDataJson",
      "data.extractedDataJson",
      "data.data",
      "extractedData",
      "data.extractedData",
      "data",
      "",
    ];

    const candidates = candidatePaths.map((path) =>
      parseJsonIfString(getByPath(parsedSource, path)),
    );

    return (
      candidates.find(
        (candidate) =>
          candidate &&
          typeof candidate === "object" &&
          (candidate?.result?.contents?.[0]?.fields || candidate?.sections),
      ) ??
      null
    );
  };

  const normalizeConfidence = (confidence: unknown): number | null => {
    if (confidence === null || confidence === undefined) return null;
    const numeric = Number(confidence);
    if (Number.isNaN(numeric)) return null;
    return numeric <= 1 ? numeric * 100 : numeric;
  };

  // const flattenData = (data: any): TableRow[] => {
  //   const rows: TableRow[] = [];
  //   const sections = data?.sections ?? data?.sections ?? {};
  //   console.log('sections', sections)

  //   const processSection = (sectionName: string, sectionData: any, page: number) => {
  //     if (Array.isArray(sectionData)) {
  //       sectionData.forEach((item, index) => {
  //         Object.entries(item).forEach(([key, value]: [string, any]) => {
  //           if (value && typeof value === 'object' && 'value' in value) {
  //             console.log('value', value)
  //             rows.push({
  //               key: `${page}-${sectionName}-${key}-${index}`,
  //               section: sectionName,
  //               field: formatLabel(key),
  //               fieldPath: key,
  //               value: String(value.value),
  //               confidence: value.confidence ?? null,
  //               confidencePercent: formatConfidenceScore(value.confidence),
  //               boundingBox: value.bounding_box || null,
  //               page: value.page || page,
  //               review: false,
  //               overrideValue: '',
  //             });
  //           }
  //         });
  //       });
  //     } else if (typeof sectionData === 'object') {
  //       Object.entries(sectionData).forEach(([key, value]: [string, any]) => {
  //         if (value && typeof value === 'object' && 'value' in value) {
  //           rows.push({
  //             key: `${page}-${sectionName}-${key}`,
  //             section: sectionName,
  //             field: formatLabel(key),
  //             fieldPath: key,
  //             value: String(value.value),
  //             confidence: value.confidence ?? null,
  //             confidencePercent: formatConfidenceScore(value.confidence),
  //             boundingBox: value.bounding_box || null,
  //             page: value.page || page,
  //             review: false,
  //             overrideValue: '',
  //           });
  //         }
  //       });
  //     }
  //   };

  //   Object.entries(sections).forEach(([sectionName, sectionData]) => {
  //     rows.push({
  //       key: `section-${sectionName}`,
  //       field: sectionName.replace(/_/g, ' ').toUpperCase(),
  //       value: '',
  //       confidence: null,
  //       confidencePercent: '-',
  //       boundingBox: null,
  //       page: 1,
  //       review: false,
  //       overrideValue: '',
  //       isSection: true,
  //     });
  //     processSection(sectionName, sectionData, 1);
  //   });

  //   return rows;
  // };

  // Page dimensions (inches) keyed by page number — from Azure DI pages array
  const getPageDimensions = (): Record<number, { width: number; height: number }> => {
    const extractedData = resolveExtractedData(apiResponse);
    const pages = extractedData?.result?.contents?.[0]?.pages ?? [];
    const dims: Record<number, { width: number; height: number }> = {};
    pages.forEach((p: any) => {
      if (p.pageNumber != null) {
        dims[p.pageNumber] = { width: p.width ?? 8.5, height: p.height ?? 11 };
      }
    });
    return dims;
  };

  const parseSourceToBoundingBox = (
    source: string | undefined,
    pageNum: number,
  ): BoundingBox | null => {
    if (!source) return null;

    const dims: { width: number; height: number } =
      pdfPageDimsIn[pageNum] ??
      getPageDimensions()[pageNum] ??
      { width: 8.5, height: 11 };

    const pattern =
      /D\((\d+),([\d.]+),([\d.]+),([\d.]+),([\d.]+),([\d.]+),([\d.]+),([\d.]+),([\d.]+)\)/g;
    const allX: number[] = [];
    const allY: number[] = [];
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const coords = match.slice(2).map(Number);
      coords.forEach((v, i) => (i % 2 === 0 ? allX : allY).push(v));
    }
    if (allX.length === 0) return null;

    const left = Math.min(...allX) / dims.width;
    const top = Math.min(...allY) / dims.height;
    const right = Math.max(...allX) / dims.width;
    const bottom = Math.max(...allY) / dims.height;
    return { left, top, width: right - left, height: bottom - top };
  };

  const getLeafValue = (fieldObj: any): string => {
    if (fieldObj === null || fieldObj === undefined) return "";
    if (typeof fieldObj !== "object") return String(fieldObj);
    if (fieldObj.valueString !== undefined) return String(fieldObj.valueString ?? "");
    if (fieldObj.valueBoolean !== undefined) return fieldObj.valueBoolean ? "Yes" : "No";
    if (fieldObj.valueNumber !== undefined) return String(fieldObj.valueNumber ?? "");
    if (fieldObj.valueDate !== undefined) return String(fieldObj.valueDate ?? "");
    if (fieldObj.valueInteger !== undefined) return String(fieldObj.valueInteger ?? "");
    if (fieldObj.value !== undefined) return String(fieldObj.value ?? "");
    if (fieldObj.checked !== undefined) return fieldObj.checked ? "Yes" : "No";
    if (fieldObj.content !== undefined) return String(fieldObj.content ?? "");
    return "";
  };

  const getPageFromSource = (source: string | undefined): number => {
    if (!source) return 1;
    const match = source.match(/D\((\d+),/) ?? source.match(/\/pages\/(\d+)/);
    return match ? Number(match[1]) : 1;
  };

  const buildGenericRows = (root: any): TableRow[] => {
    const rows: TableRow[] = [];
    const sectionKeys = new Set<string>();
    const MAX_ROWS = 500;
    const SKIP_KEYS = new Set([
      "encodedPdfData",
      "markdown",
      "spans",
      "words",
      "lines",
      "paragraphs",
      "tables",
      "figures",
      "elements",
      "boundingRegions",
      "polygon",
      "contentFormat",
      "stringIndexType",
      "apiVersion",
      "analyzerId",
      "createdAt",
      "usage",
      "warnings",
    ]);

    const ensureSection = (sectionName: string) => {
      const sectionLabel = formatLabel(sectionName || "Mapped Data");
      const sectionKey = `section-generic-${sectionLabel}`;
      if (sectionKeys.has(sectionKey)) return sectionLabel;
      sectionKeys.add(sectionKey);
      rows.push({
        key: sectionKey,
        section: sectionLabel,
        field: sectionLabel,
        fieldPath: "",
        value: "",
        confidence: null,
        confidencePercent: "-",
        boundingBox: null,
        page: 1,
        review: false,
        overrideValue: "",
        isSection: true,
      });
      return sectionLabel;
    };

    const walk = (
      node: any,
      path: string[],
      sectionHint: string,
      depth: number,
    ) => {
      if (rows.length >= MAX_ROWS || depth > 12 || node === null || node === undefined) {
        return;
      }

      if (Array.isArray(node)) {
        node.forEach((item, index) => {
          walk(item, [...path, `[${index}]`], sectionHint, depth + 1);
        });
        return;
      }

      if (typeof node !== "object") return;

      const hasFieldValue =
        "valueString" in node ||
        "valueBoolean" in node ||
        "valueNumber" in node ||
        "valueDate" in node ||
        "valueInteger" in node ||
        "value" in node ||
        "checked" in node ||
        ("confidence" in node && ("source" in node || "content" in node));

      if (hasFieldValue) {
        const fieldPath = path.join(".").replace(/\.\[/g, "[");
        const rawField = (path[path.length - 1] || "value").replace(/\[\d+\]/g, "");
        const page = node.page || getPageFromSource(node.source);
        const confidence = normalizeConfidence(node.confidence ?? node.confidence_score);
        const value = getLeafValue(node);
        const section = ensureSection(sectionHint);

        rows.push({
          key: `generic-${page}-${fieldPath}-${rows.length}`,
          section,
          field: formatLabel(rawField || "value"),
          fieldPath,
          value,
          confidence,
          confidencePercent: formatConfidenceScore(confidence),
          boundingBox: node.bounding_box || parseSourceToBoundingBox(node.source, page),
          page,
          review: false,
          overrideValue: "",
        });
        return;
      }

      Object.entries(node).forEach(([key, value]) => {
        if (SKIP_KEYS.has(key)) return;
        if (typeof value === "string" && value.length > 2000) return;
        const nextSection = path.length === 0 ? key : sectionHint;
        walk(value, [...path, key], nextSection, depth + 1);
      });
    };

    walk(root, [], "Mapped Data", 0);
    return rows;
  };

  const flattenData = (rawExtractedData: any): TableRow[] => {
    const rows: TableRow[] = [];
    const extractedData =
      resolveExtractedData(rawExtractedData) ?? parseJsonIfString(rawExtractedData);
    if (!extractedData || typeof extractedData !== "object") return rows;

    // Dynamic schema (Azure DI style)
    const fields = extractedData?.result?.contents?.[0]?.fields;
    if (fields && typeof fields === "object") {
      const processLeafField = (
        key: string,
        fieldObj: any,
        sectionName: string,
        pathPrefix: string,
      ) => {
        const type = fieldObj?.type;
        if (type === "object" && fieldObj.valueObject) {
          processObject(fieldObj.valueObject, sectionName, `${pathPrefix}.${key}`);
          return;
        }
        if (type === "array" && fieldObj.valueArray) {
          fieldObj.valueArray.forEach((item: any, i: number) => {
            if (item.valueObject) {
              processObject(item.valueObject, sectionName, `${pathPrefix}.${key}[${i}]`);
            }
          });
          return;
        }

        const fullPath = `${pathPrefix}.${key}`;
        const normalizedConfidence = normalizeConfidence(fieldObj?.confidence);
        const page = getPageFromSource(fieldObj?.source);

        rows.push({
          key: `${sectionName}-${fullPath}`,
          section: sectionName,
          field: key,
          fieldPath: fullPath,
          value: getLeafValue(fieldObj),
          confidence: normalizedConfidence,
          confidencePercent: formatConfidenceScore(normalizedConfidence),
          page,
          boundingBox: parseSourceToBoundingBox(fieldObj?.source, page),
          review: false,
          overrideValue: "",
        });
      };

      const processObject = (obj: any, sectionName: string, pathPrefix: string) => {
        if (!obj || typeof obj !== "object") return;
        Object.entries(obj).forEach(([key, value]: any) => {
          processLeafField(key, value, sectionName, pathPrefix);
        });
      };

      Object.entries(fields).forEach(([sectionName, sectionData]: any) => {
        if (!sectionData) return;

        rows.push({
          key: `section-${sectionName}`,
          section: sectionName,
          field: sectionName,
          fieldPath: "",
          value: "",
          confidence: null,
          confidencePercent: "-",
          boundingBox: null,
          page: 1,
          review: false,
          overrideValue: "",
          isSection: true,
        });

        if (sectionData.type === "object" && sectionData.valueObject) {
          processObject(sectionData.valueObject, sectionName, sectionName);
        } else if (sectionData.type === "array" && sectionData.valueArray) {
          sectionData.valueArray.forEach((item: any, i: number) => {
            if (item.valueObject) {
              processObject(item.valueObject, sectionName, `${sectionName}[${i}]`);
            }
          });
        } else {
          const normalizedConfidence = normalizeConfidence(sectionData?.confidence);
          const page = getPageFromSource(sectionData?.source);
          rows.push({
            key: `${sectionName}-${sectionName}`,
            section: sectionName,
            field: sectionName,
            fieldPath: sectionName,
            value: getLeafValue(sectionData),
            confidence: normalizedConfidence,
            confidencePercent: formatConfidenceScore(normalizedConfidence),
            page,
            boundingBox: parseSourceToBoundingBox(sectionData?.source, page),
            review: false,
            overrideValue: "",
          });
        }
      });

      return rows;
    }

    // Legacy schema (static sections)
    const legacySections = extractedData?.sections;
    if (!legacySections) return buildGenericRows(extractedData);

    const pushLegacyLeafRows = (
      sectionName: string,
      sectionData: any,
      fallbackPage: number,
      parentPath = "",
    ) => {
      if (!sectionData || typeof sectionData !== "object") return;

      if (Array.isArray(sectionData)) {
        sectionData.forEach((item, index) => {
          pushLegacyLeafRows(
            sectionName,
            item,
            fallbackPage,
            parentPath ? `${parentPath}[${index}]` : `[${index}]`,
          );
        });
        return;
      }

      Object.entries(sectionData).forEach(([key, value]: [string, any]) => {
        const fullPath = parentPath ? `${parentPath}.${key}` : key;

        if (
          value &&
          typeof value === "object" &&
          ("value" in value || "checked" in value)
        ) {
          const normalizedConfidence = normalizeConfidence(
            value.confidence ?? value.confidence_score,
          );
          const page = value.page || fallbackPage || 1;

          rows.push({
            key: `p${page}-${sectionName}-${fullPath}`,
            section: sectionName,
            field: formatLabel(key),
            fieldPath: fullPath,
            value:
              value.value !== undefined
                ? String(value.value ?? "")
                : value.checked
                  ? "Yes"
                  : "No",
            confidence: normalizedConfidence,
            confidencePercent: formatConfidenceScore(normalizedConfidence),
            boundingBox: value.bounding_box || null,
            page,
            review: false,
            overrideValue: "",
          });
          return;
        }

        pushLegacyLeafRows(sectionName, value, fallbackPage, fullPath);
      });
    };

    if (Array.isArray(legacySections)) {
      legacySections.forEach((pageObj: any, pageIndex: number) => {
        if (!pageObj || typeof pageObj !== "object") return;
        const page = pageObj.page ?? pageIndex + 1;
        const { page: _ignoredPage, ...pageSections } = pageObj;

        Object.entries(pageSections).forEach(([sectionName, sectionData]) => {
          rows.push({
            key: `section-p${page}-${sectionName}`,
            section: sectionName,
            field: sectionName,
            fieldPath: "",
            value: "",
            confidence: null,
            confidencePercent: "-",
            boundingBox: null,
            page,
            review: false,
            overrideValue: "",
            isSection: true,
          });
          pushLegacyLeafRows(sectionName, sectionData, page);
        });
      });
      return rows;
    }

    Object.entries(legacySections).forEach(([sectionName, sectionData]) => {
      rows.push({
        key: `section-${sectionName}`,
        section: sectionName,
        field: sectionName.replace(/_/g, " ").toUpperCase(),
        fieldPath: "",
        value: "",
        confidence: null,
        confidencePercent: "-",
        boundingBox: null,
        page: 1,
        review: false,
        overrideValue: "",
        isSection: true,
      });

      pushLegacyLeafRows(sectionName, sectionData, 1);
    });

    return rows.length > 0 ? rows : buildGenericRows(extractedData);
  };
  const computeDiff = useCallback((): DiffEntry[] => {
    if (!apiResponse) return [];
    return flattenData(apiResponse)
      .filter(
        (row) =>
          !row.isSection &&
          editedValues[row.key] &&
          editedValues[row.key].newValue !==
          editedValues[row.key].originalValue,
      )
      .map((row) => ({
        key: row.key,
        section: row.section ?? "",
        field: row.field,
        fieldPath: row.fieldPath,
        originalValue: editedValues[row.key].originalValue,
        newValue: editedValues[row.key].newValue,
        confidence: row.confidence,
        page: row.page,
      }));
  }, [apiResponse, editedValues]);

  // const buildUpdatedData = useCallback((): any => {
  //   if (!apiResponse) return {};
  //   const diff = computeDiff();
  //   if (diff.length === 0) return apiResponse?.extractedData?.data ?? apiResponse;

  //   const updated = JSON.parse(JSON.stringify(apiResponse?.extractedData?.data ?? apiResponse));
  //   const sections = updated?.sections ?? updated?.extractedData?.data?.sections ?? {};

  //   console.log(updated);
  //   console.log("**********************88");
  //   console.log(sections);

  //   diff.forEach(({ section, fieldPath, newValue }) => {
  //     if (!section || !fieldPath || !sections[section]) return;
  //     const sd = sections[section];
  //     if (Array.isArray(sd)) {
  //       sd.forEach((item: any) => {
  //         if (item[fieldPath]?.value !== undefined) item[fieldPath].value = newValue;
  //       });
  //     } else if (sd?.[fieldPath]?.value !== undefined) {
  //       sd[fieldPath].value = newValue;
  //     }
  //   });

  //   return updated;
  // }, [apiResponse, computeDiff]);

  const buildUpdatedData = useCallback((): any => {
    if (!apiResponse) return {};

    const diff = computeDiff();
    if (diff.length === 0) {
      return apiResponse?.extractedData?.data ?? apiResponse;
    }

    const updated = JSON.parse(
      JSON.stringify(apiResponse?.extractedData?.data ?? apiResponse),
    );

    const pages = updated?.sections ?? [];

    diff.forEach(({ section, fieldPath, newValue, page }) => {
      if (!section || !fieldPath) return;

      const pageObj = pages.find((p: any) => p.page === page);
      if (!pageObj || !pageObj[section]) return;

      const updateField = (obj: any, path: string) => {
        const parts = path.split(".");
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];

          const arrayMatch = part.match(/(.*)\[(\d+)\]/);
          if (arrayMatch) {
            const [, key, index] = arrayMatch;
            current = current[key]?.[Number(index)];
          } else {
            current = current?.[part];
          }

          if (!current) return;
        }

        const lastKey = parts[parts.length - 1];
        const fieldObj = current?.[lastKey];

        if (!fieldObj) return;

        if (fieldObj.value !== undefined) {
          fieldObj.value = newValue;
        } else if (fieldObj.checked !== undefined) {
          if (typeof newValue === "string") {
            fieldObj.checked = newValue.toLowerCase() === "yes";
          } else {
            fieldObj.checked = Boolean(newValue);
          }
        }

        // if (current?.[lastKey]?.value !== undefined) {
        //   current[lastKey].value = newValue;
        // }
      };

      updateField(pageObj[section], fieldPath);
    });

    return updated;
  }, [apiResponse, computeDiff]);

  const handleOpenConfirmModal = (action) => {
    const computedDiff = computeDiff();
    setDiff(computedDiff);
    setOpenConfirmModal(true);
    setCurrentSaveAction(action);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setCurrentSaveAction(null);
  };

  const handleSubmit = useCallback(async () => {
    const computedDiff = computeDiff();
    const updatedData = buildUpdatedData();

    setIsSubmitting(true);
    try {
      await updateExtractedData({
        submissionId: submissionId!,
        documentId: documentId!,
        extractedDataJson: updatedData,
        diffJson: computedDiff,
      });
      handleCloseConfirmModal();
      showToast("success", "Document saved successfully.");
    } catch (error) {
      handleCloseConfirmModal();
      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [computeDiff, buildUpdatedData, submissionId, documentId, showToast]);

  const handleFinalSubmit = useCallback(async () => {
    const computedDiff = computeDiff();
    setDiff(computedDiff);

    const updatedData = buildUpdatedData();
    setIsSubmitting(true);
    try {
      await submitExtractedData({
        submissionId: submissionId!,
        documentId: documentId!,
        extractedDataJson: updatedData,
        isFinalSubmit: false,
        isUpdated: computedDiff?.length > 0,
        diffJson: computedDiff,
      });
      handleCloseConfirmModal();
      showToast("success", "Document submitted successfully.");
      setTimeout(() => navigate(-1), 800);
    } catch (error) {
      handleCloseConfirmModal();
      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [computeDiff, buildUpdatedData, submissionId, documentId, showToast]);

  useEffect(() => {
    console.log("diff from useeffect", diff);
  }, [diff]);

  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++)
      bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      setDataError("");
      try {
        const response = (await getValidateData({
          submissionId,
          documentId,
          extractedDataKey,
          originalFileKey,
        })) as any;
        // The API wraps its payload in a top-level "data" key — unwrap it
        // so apiResponse matches the same shape the static JSON provided.
        const baseData = parseJsonIfString(response?.data ?? response);
        let data = baseData;
        if (baseData && typeof baseData === "object") {
          const normalizedExtractedData = parseJsonIfString(baseData.extractedData);
          data = {
            ...baseData,
            extractedData:
              normalizedExtractedData &&
                typeof normalizedExtractedData === "object"
                ? {
                  ...normalizedExtractedData,
                  data: parseJsonIfString(normalizedExtractedData.data),
                }
                : normalizedExtractedData,
          };
        }
        setApiResponse(data);
        if (data?.encodedPdfData) setEncodedPdfData(data.encodedPdfData);
      } catch (error) {
        setDataError(
          error instanceof Error
            ? error.message
            : "Failed to load extracted data",
        );
      } finally {
        setIsDataLoading(false);
      }
    };
    if (extractedDataKey && originalFileKey) loadData();
  }, [extractedDataKey, originalFileKey]);
  useEffect(() => {
    if (!encodedPdfData) return;
    const loadPdf = async () => {
      setIsPdfLoading(true);
      setPdfError("");
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url,
        ).toString();
        pdfjsRef.current = pdfjs;
        const pdfBytes = base64ToUint8Array(encodedPdfData);
        const loadingTask = pdfjs.getDocument({
          data: pdfBytes,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
        });
        const pdf = await loadingTask.promise;

        const dimsMap: Record<number, { width: number; height: number }> = {};
        for (let i = 1; i <= pdf.numPages; i++) {
          const p = await pdf.getPage(i);
          const angle = p.rotate || 0;
          // Swap width/height for 90° or 270° rotated pages so dims are in display space
          const w = (angle === 90 || angle === 270) ? p.view[3] / 72 : p.view[2] / 72;
          const h = (angle === 90 || angle === 270) ? p.view[2] / 72 : p.view[3] / 72;
          dimsMap[i] = { width: w, height: h };
        }
        setPdfPageDimsIn(dimsMap);
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        const page = await pdf.getPage(1);
        setNaturalPageSize({ width: page.view[2], height: page.view[3] });
        const container = containerRef.current;
        if (container) {
          const { width: clientWidth } = container.getBoundingClientRect();
          setBaseScale((clientWidth - 40) / page.view[2]);
        }
      } catch (error: any) {
        setPdfError(
          error.name === "InvalidPDFException"
            ? "Invalid PDF file"
            : error.message || "Unknown error loading PDF",
        );
      } finally {
        setIsPdfLoading(false);
      }
    };
    loadPdf();
  }, [encodedPdfData]);

  const renderAllPDFPages = async () => {
    if (!pdfDocRef.current || !containerRef.current) return;
    Object.values(renderTasksRef.current).forEach((task: any) => {
      if (task?.cancel) task.cancel();
    });
    renderTasksRef.current = {};
    try {
      const currentScale = baseScale * zoom;
      const newRenderedPages: Record<number, any> = {};
      const newRotations: Record<number, number> = {};   // ← NEW

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDocRef.current.getPage(pageNum);
        const rotation = page.rotate || 0;               // ← NEW

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        const viewport = page.getViewport({ scale: currentScale * DPI_SCALE });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        context!.fillStyle = "white";
        context!.fillRect(0, 0, canvas.width, canvas.height);
        const displayWidth = viewport.width / DPI_SCALE;
        const displayHeight = viewport.height / DPI_SCALE;
        Object.assign(canvas.style, {
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          display: "block",
          marginBottom: "16px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          backgroundColor: "white",
          borderRadius: "8px",
        });
        const renderTask = page.render({ canvasContext: context!, viewport });
        renderTasksRef.current[pageNum] = renderTask;
        try {
          await renderTask.promise;
          newRenderedPages[pageNum] = {
            canvas,
            viewport,
            pageHeight: displayHeight,
            pageWidth: displayWidth,
            displayScale: currentScale,
            rotation,                                     // ← NEW
          };
        } catch (err: any) {
          if (err.name !== "RenderingCancelledException") throw err;
        }
      }
      setRenderedPages(newRenderedPages);
      setPageRotations(newRotations);                     // ← NEW
    } catch { }
  };
  useEffect(() => {
    if (baseScale && pdfDocRef.current && totalPages > 0) {
      const id = setTimeout(() => renderAllPDFPages(), 100);
      return () => clearTimeout(id);
    }
  }, [zoom, baseScale, totalPages]);

  useEffect(() => {
    if (pagesContainerRef.current && Object.keys(renderedPages).length > 0) {
      pagesContainerRef.current.innerHTML = "";
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageData = renderedPages[pageNum];
        if (pageData) pagesContainerRef.current.appendChild(pageData.canvas);
      }
    }
  }, [renderedPages, totalPages]);

  const scrollToPage = useCallback(
    (targetPage: number, behavior: ScrollBehavior = "smooth") => {
      if (
        !pdfScrollRef.current ||
        !renderedPages[targetPage] ||
        targetPage < 1 ||
        targetPage > totalPages
      )
        return;

      let cumulativeHeight = 0;
      for (let i = 1; i < targetPage; i++) {
        const prev = renderedPages[i];
        if (prev) cumulativeHeight += prev.pageHeight + 16;
      }

      pdfScrollRef.current.scrollTo({
        top: Math.max(0, cumulativeHeight),
        behavior,
      });
    },
    [renderedPages, totalPages],
  );

  useEffect(() => {
    if (Object.keys(renderedPages).length === 0) return;
    scrollToPage(currentPage);
  }, [currentPage, renderedPages, scrollToPage]);

  const handleRowClick = (record: TableRow) => {
    if (record.isSection) return;
    setSelectedField(record);
    if (record.boundingBox && record.page) {
      setHighlightBox({
        ...record.boundingBox,
        page: record.page,
        confidenceScore: getHighlightColor(record.confidence),
      });
      setCurrentPage(record.page);
      setTimeout(
        () => scrollToHighlight(record.boundingBox!, record.page),
        200,
      );
    } else {
      setHighlightBox(null);
    }
  };

  const scrollToHighlight = (bbox: BoundingBox, targetPage: number) => {
    if (!pdfScrollRef.current || !renderedPages[targetPage]) return;

    let cumulativeHeight = 0;
    for (let i = 1; i < targetPage; i++) {
      const prev = renderedPages[i];
      if (prev) cumulativeHeight += prev.pageHeight + 16;
    }

    // Use this page's own rendered height (correct for landscape pages)
    const canvasHeight = renderedPages[targetPage].pageHeight;
    const absoluteHighlightY =
      cumulativeHeight + bbox.top * canvasHeight + (bbox.height * canvasHeight) / 2;
    const containerHeight = pdfScrollRef.current.getBoundingClientRect().height;
    pdfScrollRef.current.scrollTo({
      top: Math.max(0, absoluteHighlightY - containerHeight / 2),
      behavior: "smooth",
    });
  };

const renderHighlightBox = () => {
  if (!highlightBox || Object.keys(renderedPages).length === 0 || !highlightBox.page)
    return null;

  const pageData = renderedPages[highlightBox.page];
  if (!pageData) return null;

  let cumulativeHeight = 0;
  for (let i = 1; i < highlightBox.page; i++) {
    const prev = renderedPages[i];
    if (prev) cumulativeHeight += prev.pageHeight + 16;
  }

  // Use each page's own rendered canvas dimensions (CSS pixels).
  // Azure DI coordinates are already in display/visual space so NO
  // rotation transform is needed — pdfjs handles rotation in the viewport.
  const canvasWidth  = pageData.pageWidth;
  const canvasHeight = pageData.pageHeight;
  const { left, top, width, height } = highlightBox;
  const borderColor = highlightBox.confidenceScore;

  return (
    <div
      className="absolute pointer-events-none border-[3px] transition-all rounded"
      style={{
        left:            `${left  * canvasWidth  - 4}px`,
        top:             `${cumulativeHeight + top * canvasHeight - 4}px`,
        width:           `${width  * canvasWidth  + 8}px`,
        height:          `${height * canvasHeight + 8}px`,
        borderColor,
        backgroundColor: `${borderColor}20`,
        zIndex:          30,
      }}
    >
      {selectedField && (
        <div className="absolute -top-9 left-0 bg-[#3C20F6] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {selectedField.field}
          </span>
        </div>
      )}
    </div>
  );
};

  const handleEditChange = (
    recordKey: string,
    originalValue: string,
    newValue: string,
  ) => {
    setEditedValues((prev) => ({
      ...prev,
      [recordKey]: {
        originalValue: prev[recordKey]?.originalValue ?? originalValue,
        newValue,
      },
    }));
  };

  const handleDownloadPdf = () => {
    if (!encodedPdfData) return;
    const bytes = base64ToUint8Array(encodedPdfData);
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: "document.pdf",
    }).click();
    URL.revokeObjectURL(url);
  };

  const buildTableRows = (): TableRow[] =>
    !apiResponse ? [] : flattenData(apiResponse);
  const getFilteredRows = (): TableRow[] => {
    const allRows = buildTableRows();

    const buildByConfidenceFilter = (activeConfidenceFilter: string): TableRow[] => {
      const result: TableRow[] = [];
      let currentSection: TableRow | null = null;
      let sectionRows: TableRow[] = [];

      const passesFilter = (row: TableRow) => {
        const score = row.confidence;

        let mc = true;
        if (activeConfidenceFilter !== "all" && score !== null) {
          switch (activeConfidenceFilter) {
            case "below_50":
              mc = score < 50;
              break;
            case "50_75":
              mc = score >= 50 && score < 75;
              break;
            case "75_80":
              mc = score >= 75 && score < 80;
              break;
            case "80_85":
              mc = score >= 80 && score < 85;
              break;
            case "85_90":
              mc = score >= 85 && score < 90;
              break;
            case "90_above":
              mc = score >= 90;
              break;
          }
        }

        const mp = pageFilter === "all" ? true : row.page === Number(pageFilter);

        return mc && mp;
      };

      const pushSectionIfValid = () => {
        if (currentSection && sectionRows.length > 0) {
          result.push(currentSection, ...sectionRows);
        }
      };

      for (const row of allRows) {
        if (row.isSection) {
          pushSectionIfValid();

          currentSection = row;
          sectionRows = [];
          continue;
        }

        if (passesFilter(row)) {
          sectionRows.push(row);
        }
      }

      pushSectionIfValid();
      return result;
    };

    const primaryResult = buildByConfidenceFilter(confidenceFilter);
    if (primaryResult.length === 0 && confidenceFilter !== "all") {
      return buildByConfidenceFilter("all");
    }
    return primaryResult;
  };

  const allRows = buildTableRows();
  const uniquePages = Array.from(
    new Set(
      allRows
        .filter((r) => !r.isSection && r.page !== undefined)
        .map((r) => r.page),
    ),
  ).sort((a, b) => a - b);
  const filteredRows = getFilteredRows();
  const changedCount = Object.values(editedValues).filter(
    (e) => e.newValue !== e.originalValue,
  ).length;

  if (isPdfLoading || isDataLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3C20F6] mx-auto mb-5" />
          <p className="text-lg font-semibold text-gray-800 mb-1">
            Loading Document Review
          </p>
          <p className="text-sm text-gray-400">
            Please wait while we prepare your document...
          </p>
        </div>
      </div>
    );
  }

  const routeState = (location.state as {
    docStatus?: string;
    isApprovalWindow?: boolean;
  } | null) ?? null;

  const docStatus = routeState?.docStatus ?? "";

  const isDisabled = !(routeState?.isApprovalWindow ?? false);
  const isSaveSubmitDisabled =
    docStatus == "Pending Approval" || docStatus == "Approved";

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <button
        className="border border-[#3C20F6] text-[#3C20F6] bg-[#E6DAFF] px-3 py-1 rounded-full text-sm font-medium hover:bg-[#d4c5ff] transition-colors"
        onClick={() => navigate(-1)}
      >
        Back
      </button>
      <div className="px-0 py-4 flex gap-6">
        {/* Submission ID */}
        <div className="bg-[#FFFFFF] rounded-lg px-6 py-3 min-w-[180px]">
          <p className="text-xs text-gray-500 mb-1">Submission ID</p>
          <p
            className="text-sm font-medium text-gray-900 cursor-pointer"
            title={apiResponse?.extractedData?.headerInfo?.submissionId}
          >
            {apiResponse?.extractedData?.headerInfo?.submissionId
              ?.toString()
              .slice(0, 7)}
          </p>
        </div>

        {/* Form Name */}
        <div className="bg-[#FFFFFF] rounded-lg px-6 py-3 min-w-[220px]">
          <p className="text-xs text-gray-500 mb-1">Form Name</p>
          <p className="text-sm font-medium text-gray-900">
            {apiResponse?.extractedData?.headerInfo?.documentName}
          </p>
        </div>

        {/* Broker Name */}
        <div className="bg-[#FFFFFF] rounded-lg px-6 py-3 min-w-[200px]">
          <p className="text-xs text-gray-500 mb-1">Document Type</p>
          <p className="text-sm font-medium text-gray-900">
            {apiResponse?.extractedData?.headerInfo?.documentType}
          </p>
        </div>

        {/* Customer Name */}
        {/* <div className="bg-[#FFFFFF] rounded-lg px-6 py-3 min-w-[200px]">
        <p className="text-xs text-gray-500 mb-1">Customer Name</p>
        <p className="text-sm font-medium text-gray-900">
          {apiResponse?.extractedData?.headerInfo?.customerName}
        </p>
      </div> */}
      </div>

      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        <div className=" border-b border-gray-200 shadow-sm"></div>

        <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E6DAFF] rounded-xl">
                <svg
                  className="w-5 h-5 text-[#3C20F6]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-[18px] font-semibold text-gray-900">
                  Document Review
                </h1>
                {/* <p className="text-xs text-gray-400 mt-0.5">
                  {apiResponse?.extractedData?.data?.documentType ?? 'Review and validate extracted document data'}
                </p> */}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {dataError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                  ⚠️ Data: {dataError}
                </p>
              )}
              {pdfError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                  ⚠️ PDF: {pdfError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                className="border border-[#3C20F6] text-[#3C20F6] bg-[#E6DAFF] px-3 py-1 rounded-full text-sm font-medium hover:bg-[#d4c5ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                onClick={() => handleOpenConfirmModal("save")}
                disabled={isSaveSubmitDisabled}
              >
                Save
              </button>
              <button
                className="relative border border-[#3C20F6] text-[#3C20F6] bg-[#E6DAFF] px-4 py-1 rounded-full text-sm font-medium hover:bg-[#d4c5ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                onClick={() => handleOpenConfirmModal("submit")}
                disabled={isSaveSubmitDisabled}
              >
                Send for Approval
                {/* {changedCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#3C20F6] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {changedCount}
                  </span>
                )} */}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden gap-4 p-4">
          <div className="w-[65%] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold text-[#4318FF] flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-[#3C20F6]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    Document
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Total Pages:{" "}
                    <span className="text-xs text-gray-600">{totalPages}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 text-xs">
                  <div className="flex items-center gap-1 font-semibold">
                    <span className="px-2 py-0.5 text-[#3C20F6] rounded-full text-xs font-medium">
                      {String(currentPage).padStart(2, "0")}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600">
                      {String(totalPages).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      onClick={() => setZoom((p) => Math.max(p - 0.25, 0.25))}
                      disabled={zoom <= 0.25}
                      className="p-1 rounded-full border border-[#3C20F6] text-[#3C20F6] hover:bg-[#E6DAFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="range"
                        min="0.25"
                        max="4"
                        step="0.25"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-28 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3C20F6]"
                      />
                      <span className="text-xs font-semibold text-gray-700 min-w-[40px] text-center px-1.5 py-0.5 bg-white">
                        {Math.round(zoom * 125)}%
                      </span>
                    </div>
                    <button
                      onClick={() => setZoom((p) => Math.min(p + 0.25, 4))}
                      disabled={zoom >= 4}
                      className="p-1 rounded-full border border-[#3C20F6] text-[#3C20F6] hover:bg-[#E6DAFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={!encodedPdfData}
                    className="border border-[#3C20F6] text-[#3C20F6] bg-[#E6DAFF] px-3 py-1 rounded-full text-xs font-medium hover:bg-[#d4c5ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={pdfScrollRef}
              className="flex-1 overflow-auto p-4 bg-gray-50"
            >
              <div ref={containerRef} className="relative">
                <div ref={pagesContainerRef} className="relative" />
                {renderHighlightBox()}
              </div>
            </div>
          </div>

          <div className="w-[35%] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <h2 className="px-4 py-3 text-sm font-semibold text-[#4318FF]">
              Mapped Data
            </h2>

            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <select
                  value={confidenceFilter}
                  onChange={(e) => setConfidenceFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 text-xs font-medium border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#3C20F6] bg-white appearance-none cursor-pointer outline-none"
                >
                  <option value="all">All Confidence %</option>
                  <option value="below_50">Below 50%</option>
                  <option value="50_75">50% – 75%</option>
                  <option value="75_80">75% – 80%</option>
                  <option value="80_85">80% – 85%</option>
                  <option value="85_90">85% – 90%</option>
                  <option value="90_above">90% & Above</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                  <svg
                    className="w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <div className="relative flex-shrink-0 ml-2">
                <select
                  value={pageFilter}
                  onChange={(e) => {
                    const selectedPage = e.target.value;
                    setPageFilter(selectedPage);
                    if (selectedPage !== "all") {
                      const page = Number(selectedPage);
                      setCurrentPage(page);
                      setHighlightBox(null);
                      setTimeout(() => scrollToPage(page), 100);
                    }
                  }}
                  className="pl-3 pr-8 py-2 text-xs font-medium border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#3C20F6] bg-white appearance-none cursor-pointer outline-none"
                >
                  <option value="all">All Pages</option>
                  {uniquePages.map((page) => (
                    <option key={page} value={page}>
                      Page {page}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                  <svg
                    className="w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <table className="w-full border-collapse text-sm">
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredRows.map((record) => {
                    if (record.isSection) {
                      return (
                        <tr key={record.key} className="bg-gray-50">
                          <td
                            colSpan={5}
                            className="px-4 py-2.5 font-semibold text-[#3C20F6] text-xs border-l-4 border-[#3C20F6]"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              {record.field}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const currentDisplayValue =
                      editedValues[record.key]?.newValue ?? record.value;
                    const hasChanged =
                      editedValues[record.key] &&
                      editedValues[record.key].newValue !==
                      editedValues[record.key].originalValue;

                    return (
                      <tr
                        key={record.key}
                        onClick={() => handleRowClick(record)}
                        className={`cursor-pointer transition-all duration-150 ${getConfidenceBg(record.confidence)} ${selectedField?.key === record.key
                          ? "bg-[#E6DAFF] border-l-4 border-l-[#3C20F6]"
                          : "hover:bg-gray-50 border-l-4 border-l-transparent"
                          }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-900">
                              {record.field}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getConfidenceColor(record.confidence)} ${record.confidence !== null &&
                                record.confidence >= 95
                                ? "bg-emerald-100"
                                : record.confidence !== null &&
                                  record.confidence >= CONFIDENCE_THRESHOLD
                                  ? "bg-amber-100"
                                  : record.confidence !== null
                                    ? "bg-red-100"
                                    : "bg-gray-100"
                                }`}
                            >
                              {record.confidencePercent !== "-"
                                ? `${record.confidencePercent}%`
                                : "-"}
                            </span>
                          </div>
                          <div className="flex items-center border border-gray-200 rounded-lg px-2 py-1.5 bg-[#F6F6F6]">
                            {editingField === record.key ? (
                              <input
                                type="text"
                                autoFocus
                                value={currentDisplayValue}
                                disabled={isSaveSubmitDisabled}
                                onChange={(e) =>
                                  handleEditChange(
                                    record.key,
                                    record.value,
                                    e.target.value,
                                  )
                                }
                                onBlur={() => setEditingField(null)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs outline-none bg-transparent"
                              />
                            ) : (
                              <div className="flex-1 text-xs text-gray-700">
                                {hasChanged ? (
                                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                    <span className="line-through text-gray-500 text-left bg-[#F9B53642] truncate px-1 rounded">
                                      {editedValues[record.key].originalValue}
                                    </span>
                                    <div className="flex justify-center">
                                      <img
                                        src={arrowIcon}
                                        alt="→"
                                        className="w-5 h-5 object-contain"
                                      />
                                    </div>
                                    <span className="text-gray-800 text-right font-medium truncate">
                                      {editedValues[record.key].newValue}
                                    </span>
                                  </div>
                                ) : (
                                  <span>{record.value}</span>
                                )}
                              </div>
                            )}
                            {!isSaveSubmitDisabled && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingField(record.key);
                                }}
                                className="ml-2 flex-shrink-0"
                              >
                                <img
                                  src={editIcon}
                                  alt="edit"
                                  className="w-3 h-3 cursor-pointer"
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        visible={openConfirmModal}
        onClose={handleCloseConfirmModal}
        confirmText={
          currentSaveAction == "save"
            ? "Are you sure you want to save the data?"
            : "Are you sure you want to submit the data?"
        }
        onConfirm={
          currentSaveAction == "save" ? handleSubmit : handleFinalSubmit
        }
        data={diff}
      />
    </>
  );
};

export default DocumentComparison;

