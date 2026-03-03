import { XCircle } from "lucide-react";
import { useState } from "react";
import ReactJson from "react-json-view";
import type { InstanceStep } from "./types";
import { getStepStatusStyle, formatPayload } from "./utils";

interface InstanceStepsModalProps {
  activeInstanceMeta: { id: string; workflowId?: string } | null;
  instanceSteps: InstanceStep[] | null;
  instanceStepsLoading: boolean;
  instanceStepsError: string | null;
  setActiveInstanceMeta: (
    meta: { id: string; workflowId?: string } | null,
  ) => void;
  setInstanceSteps: (steps: InstanceStep[] | null) => void;
  setInstanceStepsError: (error: string | null) => void;
}

interface DocumentReviewDiffValue {
  key?: unknown;
  field?: unknown;
  originalValue?: unknown;
  newValue?: unknown;
  overrideValue?: unknown;
}

interface DocumentReviewTableRow {
  field: string;
  originalValue: string;
  overrideValue: string;
}

interface DocumentReviewParsedPayload {
  rows: DocumentReviewTableRow[];
  updatedBy: string;
  updatedAt: string;
}

interface ClassifierValue {
  description: string;
}

interface DocumentClassifierParsedPayload {
  lob: ClassifierValue;
  formType: ClassifierValue;
  fileName: string;
  documentType: string;
}

const tryParseJsonString = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const isJsonContainer = (value: unknown): value is Record<string, unknown> | unknown[] =>
  typeof value === "object" && value !== null;

const RAW_JSON_THEME = {
  base00: "transparent", // background
  base01: "#0f172a", // darker panel blocks
  base02: "#1e293b", // lines/borders
  base03: "#94a3b8", // comments/meta
  base04: "#cbd5e1", // subtle text
  base05: "#e2e8f0", // default text
  base06: "#f1f5f9",
  base07: "#ffffff",
  base08: "#fda4af", // null / errors
  base09: "#fdba74", // numbers
  base0A: "#facc15", // accents
  base0B: "#86efac", // strings
  base0C: "#67e8f9", // booleans
  base0D: "#7dd3fc", // keys
  base0E: "#c4b5fd", // braces/icons
  base0F: "#f9a8d4",
};

const JsonPayloadViewer = ({ payload }: { payload: unknown }) => {
  const [copied, setCopied] = useState(false);
  const [filterText, setFilterText] = useState("");
  const formattedPayload = formatPayload(payload);
  const normalizedPayload = tryParseJsonString(tryParseJsonString(payload));
  const isCollapsible = isJsonContainer(normalizedPayload);
  const normalizedFilter = filterText.trim().toLowerCase();

  const filterJsonTree = (value: unknown, query: string): unknown => {
    if (!query) return value;

    if (value === null || value === undefined) return undefined;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return undefined;
    }

    if (Array.isArray(value)) {
      const filtered = value
        .map((item) => filterJsonTree(item, query))
        .filter((item) => item !== undefined);
      return filtered.length > 0 ? filtered : undefined;
    }

    if (typeof value === "object") {
      const result: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
        if (key.toLowerCase().includes(query)) {
          result[key] = child;
          return;
        }
        const filteredChild = filterJsonTree(child, query);
        if (filteredChild !== undefined) {
          result[key] = filteredChild;
        }
      });
      return Object.keys(result).length > 0 ? result : undefined;
    }

    return undefined;
  };

  const filteredPayload = normalizedFilter
    ? filterJsonTree(normalizedPayload, normalizedFilter)
    : normalizedPayload;
  const hasFilterMatches = filteredPayload !== undefined;

  const handleCopy = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) return;
      await navigator.clipboard.writeText(formattedPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Best effort copy action.
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Raw JSON
        </span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            placeholder="Filter keys/values..."
            className="h-7 w-40 rounded border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-slate-400"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] font-semibold px-2.5 py-1 rounded border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
            title="Copy full raw JSON"
          >
            {copied ? "Copied Full JSON" : "Copy Full JSON"}
          </button>
        </div>
      </div>
      <div className="text-xs max-h-80 overflow-auto bg-slate-950 text-slate-100 px-3 py-3 leading-relaxed">
        {isCollapsible && hasFilterMatches ? (
          <ReactJson
            src={filteredPayload as Record<string, unknown>}
            name={false}
            collapsed={1}
            iconStyle="triangle"
            displayDataTypes={false}
            displayObjectSize
            enableClipboard={false}
            theme={RAW_JSON_THEME}
            style={{
              backgroundColor: "transparent",
              fontSize: "12px",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
              lineHeight: 1.5,
            }}
          />
        ) : normalizedFilter && !hasFilterMatches ? (
          <div className="text-[12px] text-slate-300">
            No keys matched "{filterText}".
          </div>
        ) : (
          <pre>{formattedPayload}</pre>
        )}
      </div>
    </div>
  );
};

const toDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  return String(value);
};

const formatUnixToLocaleDate = (rawTimestamp: unknown): string => {
  if (
    rawTimestamp === null ||
    rawTimestamp === undefined ||
    rawTimestamp === ""
  ) {
    return "-";
  }

  const parsed = Number(rawTimestamp);
  if (Number.isNaN(parsed)) return "-";

  const millis = parsed < 1_000_000_000_000 ? parsed * 1000 : parsed;
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
};

const parseDocumentReviewPayload = (
  payload: unknown,
): DocumentReviewParsedPayload | null => {
  if (!payload) return null;

  const normalizedPayload =
    typeof payload === "string"
      ? (() => {
          try {
            return JSON.parse(payload) as unknown;
          } catch {
            return null;
          }
        })()
      : payload;

  if (!normalizedPayload || typeof normalizedPayload !== "object") return null;

  const data = normalizedPayload as {
    diff?: unknown;
    updatedBy?: unknown;
    updatedAt?: unknown;
  };

  const diff = data.diff;
  if (!Array.isArray(diff) || diff.length === 0) return null;

  const rows: DocumentReviewTableRow[] = [];
  diff.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const values = entry as DocumentReviewDiffValue;
    rows.push({
      field: toDisplayValue(values.field ?? values.key),
      originalValue: toDisplayValue(values.originalValue),
      overrideValue: toDisplayValue(values.newValue ?? values.overrideValue),
    });
  });

  if (rows.length === 0) return null;

  return {
    rows,
    updatedBy: toDisplayValue(data.updatedBy),
    updatedAt: formatUnixToLocaleDate(data.updatedAt),
  };
};

const parseDocumentClassifierPayload = (
  payload: unknown,
): DocumentClassifierParsedPayload | null => {
  if (!payload) return null;

  const normalizedPayload = tryParseJsonString(tryParseJsonString(payload));

  if (!normalizedPayload || typeof normalizedPayload !== "object") return null;

  const data = normalizedPayload as {
    lob?: unknown;
    form_type?: unknown;
    formType?: unknown;
    file_name?: unknown;
    fileName?: unknown;
    document_type?: unknown;
    documentType?: unknown;
  };

  const lob = data.lob as { code?: unknown; description?: unknown } | undefined;
  const formTypeSource = (data.form_type ?? data.formType) as
    | { code?: unknown; description?: unknown }
    | undefined;
  const fileNameSource = data.file_name ?? data.fileName;
  const documentTypeSource = data.document_type ?? data.documentType;

  const hasExpectedShape =
    lob &&
    typeof lob === "object" &&
    formTypeSource &&
    typeof formTypeSource === "object" &&
    fileNameSource !== undefined &&
    documentTypeSource !== undefined;

  if (!hasExpectedShape) return null;

  return {
    lob: {
      description: toDisplayValue(lob.description),
    },
    formType: {
      description: toDisplayValue(formTypeSource.description),
    },
    fileName: toDisplayValue(fileNameSource),
    documentType: toDisplayValue(documentTypeSource),
  };
};

export const InstanceStepsModal = ({
  activeInstanceMeta,
  instanceSteps,
  instanceStepsLoading,
  instanceStepsError,
  setActiveInstanceMeta,
  setInstanceSteps,
  setInstanceStepsError,
}: InstanceStepsModalProps) => {
  const [showRawPayloadByStep, setShowRawPayloadByStep] = useState<
    Record<string, boolean>
  >({});

  if (!activeInstanceMeta) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        <div className="bg-white border-b p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          </div>
          <button
            onClick={() => {
              setActiveInstanceMeta(null);
              setInstanceSteps(null);
              setInstanceStepsError(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {instanceStepsLoading && (
            <div className="text-sm text-gray-500">Loading steps...</div>
          )}

          {instanceStepsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">{instanceStepsError}</p>
            </div>
          )}

          {!instanceStepsLoading &&
            instanceSteps &&
            instanceSteps.length > 0 && (
              <div className="space-y-4">
                {instanceSteps
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.executedAt).getTime() -
                      new Date(b.executedAt).getTime(),
                  )
                  .map((step) => {
                    const style = getStepStatusStyle(step.status);
                    const isDocumentReview =
                      step.nodeName === "DOCUMENT_REVIEW";
                    const isDocumentClassifier = step.nodeName === "DOCUMENT_CLASSIFIER";
                    const documentReviewData = isDocumentReview
                      ? parseDocumentReviewPayload(step.responsePayload)
                      : null;
                    const documentClassifierData = isDocumentClassifier
                      ? parseDocumentClassifierPayload(step.responsePayload)
                      : null;
                    const isRawPayloadVisible = Boolean(
                      showRawPayloadByStep[step.id],
                    );
                    const shouldShowResponsePayload = Boolean(
                      step.responsePayload,
                    );
                    return (
                      <div key={step.id} className="relative pl-6">
                        <div className="absolute left-2 top-2 h-full w-px bg-gray-200" />
                        <div
                          className={`absolute left-0 top-2 h-3 w-3 rounded-full ${style.dot}`}
                        />
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {step.nodeName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {step.nodeType} · {step.nodeId}
                              </div>
                              <div className="text-xs text-gray-500">
                                {step.durationFormatted
                                  ? step.durationFormatted
                                  : "0s"}
                              </div>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${style.badge}`}
                            >
                              {step.status}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            {step.message}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {new Date(step.executedAt).toLocaleString()}
                          </div>
                          {(step.requestPayload ||
                            shouldShowResponsePayload) && (
                            <div className="mt-3 space-y-2">
                              {step.requestPayload && (
                                <details className="bg-white border border-gray-200 rounded-md">
                                  <summary className="cursor-pointer text-xs font-semibold text-gray-700 px-3 py-2">
                                    Request Payload
                                  </summary>
                                  <div className="px-3 pb-3">
                                    <JsonPayloadViewer payload={step.requestPayload} />
                                  </div>
                                </details>
                              )}
                              {shouldShowResponsePayload && (
                                <details className="bg-white border border-gray-200 rounded-md">
                                  <summary className="cursor-pointer text-xs font-semibold text-gray-700 px-3 py-2">
                                    Response Payload
                                  </summary>
                                  {documentReviewData ? (
                                    <div className="px-3 pb-3 pt-2 space-y-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                          Document Review Changes
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setShowRawPayloadByStep((prev) => ({
                                              ...prev,
                                              [step.id]: !prev[step.id],
                                            }))
                                          }
                                          className="text-xs font-medium px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                                        >
                                          {isRawPayloadVisible
                                            ? "Show Table"
                                            : "Show Raw JSON"}
                                        </button>
                                      </div>
                                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-600">
                                              Updated By
                                            </span>
                                            <span className="inline-flex items-center rounded bg-white px-2 py-1 border border-slate-200">
                                              {documentReviewData.updatedBy}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-600">
                                              Updated At
                                            </span>
                                            <span className="inline-flex items-center rounded bg-white px-2 py-1 border border-slate-200">
                                              {documentReviewData.updatedAt}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      {isRawPayloadVisible ? (
                                        <JsonPayloadViewer payload={step.responsePayload} />
                                      ) : (
                                        <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                                          <table className="min-w-full divide-y divide-slate-200 text-xs">
                                            <thead className="bg-slate-100">
                                              <tr>
                                                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                                  Field
                                                </th>
                                                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                                  Initial Value
                                                </th>
                                                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                                  Overridden Value
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                              {documentReviewData.rows.map(
                                                (row, index) => (
                                                  <tr
                                                    key={`${row.field}-${index}`}
                                                    className="hover:bg-slate-50"
                                                  >
                                                    <td className="px-3 py-2 text-slate-700">
                                                      {row.field || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-700">
                                                      {row.originalValue}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-700">
                                                      {row.overrideValue}
                                                    </td>
                                                  </tr>
                                                ),
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  ) : documentClassifierData ? (
                                    <div className="px-3 pb-3 pt-2 space-y-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                          Document Classification
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setShowRawPayloadByStep((prev) => ({
                                              ...prev,
                                              [step.id]: !prev[step.id],
                                            }))
                                          }
                                          className="text-xs font-medium px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                                        >
                                          {isRawPayloadVisible ? "Show Summary" : "Show Raw JSON"}
                                        </button>
                                      </div>
                                      {isRawPayloadVisible ? (
                                        <JsonPayloadViewer payload={step.responsePayload} />
                                      ) : (
                                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
                                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Line Of Business
                                              </div>
                                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                                {documentClassifierData.lob.description}
                                              </div>
                                            </div>
                                            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Form Type
                                              </div>
                                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                                {documentClassifierData.formType.description}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                File Name
                                              </div>
                                              <div className="mt-1 text-sm text-slate-800 break-all">
                                                {documentClassifierData.fileName}
                                              </div>
                                            </div>
                                            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
                                              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                Document Type
                                              </div>
                                              <div className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                                {documentClassifierData.documentType}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="px-3 pb-3">
                                      <JsonPayloadViewer payload={step.responsePayload} />
                                    </div>
                                  )}
                                </details>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

          {!instanceStepsLoading &&
            instanceSteps &&
            instanceSteps.length === 0 && (
              <div className="text-sm text-gray-500">
                No steps found for this instance.
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
