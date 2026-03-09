// import { Modal } from "antd";
// import "../../styles/final-extracted-modal.scss";
// import ReactJson from "react-json-view";
// import React from "react";

// interface FinalExtractedDataModal {
//   visible: boolean;
//   onClose: () => void;
//   data?: any[];
//   loading: boolean;
//   error: string;
// }

// export default function FinalExtractedDataModal({
//   visible,
//   onClose,
//   data,
//   loading,
//   error,
// }: FinalExtractedDataModal) {
//   const formatPayload = (payload: unknown): string => {
//     if (payload === null || payload === undefined) return "";
//     if (typeof payload === "string") {
//       try {
//         const parsed = JSON.parse(payload);
//         return JSON.stringify(parsed, null, 2);
//       } catch {
//         return payload;
//       }
//     }
//     try {
//       return JSON.stringify(payload, null, 2);
//     } catch {
//       return String(payload);
//     }
//   };

//   const tryParseJsonString = (value: unknown): unknown => {
//     if (typeof value !== "string") return value;
//     try {
//       return JSON.parse(value) as unknown;
//     } catch {
//       return value;
//     }
//   };

//   const tryParseJsonLikeString = (value: unknown): unknown => {
//     if (typeof value !== "string") return value;

//     const trimmed = value.trim();
//     if (!trimmed) return value;

//     const parsed = tryParseJsonString(trimmed);
//     if (parsed !== trimmed) return parsed;

//     const wrappedAsArray = `[${trimmed}]`;
//     const parsedArray = tryParseJsonString(wrappedAsArray);
//     if (parsedArray !== wrappedAsArray) return parsedArray;

//     return value;
//   };

//   const normalizeJsonPayload = (value: unknown): unknown => {
//     let normalized = value;

//     for (let depth = 0; depth < 6; depth += 1) {
//       if (typeof normalized !== "string") break;
//       const trimmed = normalized.trim();
//       if (!trimmed) break;

//       const parsed = tryParseJsonLikeString(trimmed);
//       if (parsed === normalized) break;
//       normalized = parsed;
//     }

//     return normalized;
//   };

//   const isJsonContainer = (
//     value: unknown,
//   ): value is Record<string, unknown> | unknown[] =>
//     typeof value === "object" && value !== null;

//   const RAW_JSON_THEME = {
//     base00: "transparent",
//     base01: "#f8fafc",
//     base02: "#e2e8f0",
//     base03: "#64748b",
//     base04: "#475569",
//     base05: "#1e293b",
//     base06: "#0f172a",
//     base07: "#020617",
//     base08: "#b91c1c",
//     base09: "#b45309",
//     base0A: "#a16207",
//     base0B: "#166534",
//     base0C: "#0f766e",
//     base0D: "#1d4ed8",
//     base0E: "#6d28d9",
//     base0F: "#be185d",
//   };

//   const JsonPayloadViewer = ({ payload }: { payload: unknown }) => {
//     const [copied, setCopied] = React.useState(false);
//     const [filterText, setFilterText] = React.useState("");
//     const normalizedPayload = normalizeJsonPayload(payload);
//     const formattedPayload = formatPayload(normalizedPayload);
//     const isCollapsible = isJsonContainer(normalizedPayload);
//     const normalizedFilter = filterText.trim().toLowerCase();

//     const filterJsonTree = (value: unknown, query: string): unknown => {
//       if (!query) return value;

//       if (value === null || value === undefined) {
//         return String(value).toLowerCase().includes(query) ? value : undefined;
//       }

//       if (
//         typeof value === "string" ||
//         typeof value === "number" ||
//         typeof value === "boolean"
//       ) {
//         return String(value).toLowerCase().includes(query) ? value : undefined;
//       }

//       if (Array.isArray(value)) {
//         const filtered = value
//           .map((item) => filterJsonTree(item, query))
//           .filter((item) => item !== undefined);
//         return filtered.length > 0 ? filtered : undefined;
//       }

//       if (typeof value === "object") {
//         const result: Record<string, unknown> = {};
//         Object.entries(value as Record<string, unknown>).forEach(
//           ([key, child]) => {
//             if (key.toLowerCase().includes(query)) {
//               result[key] = child;
//               return;
//             }
//             const filteredChild = filterJsonTree(child, query);
//             if (filteredChild !== undefined) {
//               result[key] = filteredChild;
//             }
//           },
//         );
//         return Object.keys(result).length > 0 ? result : undefined;
//       }

//       return undefined;
//     };

//     const filteredPayload = normalizedFilter
//       ? filterJsonTree(normalizedPayload, normalizedFilter)
//       : normalizedPayload;
//     const hasFilterMatches = filteredPayload !== undefined;

//     const handleCopy = async () => {
//       try {
//         if (typeof navigator === "undefined" || !navigator.clipboard) return;
//         await navigator.clipboard.writeText(formattedPayload);
//         setCopied(true);
//         setTimeout(() => setCopied(false), 1500);
//       } catch {}
//     };

//     return (
//       <div className="rounded-lg border border-slate-200 overflow-hidden">
//         <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200">
//           <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
//             Final Extracted JSON
//           </span>
//           <div className="flex items-center gap-2">
//             <input
//               type="text"
//               value={filterText}
//               onChange={(event) => setFilterText(event.target.value)}
//               placeholder="Filter keys/values..."
//               className="h-7 w-40 rounded border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-slate-400"
//             />
//             <button
//               type="button"
//               onClick={handleCopy}
//               className="text-[11px] font-semibold px-2.5 py-1 rounded border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
//               title="Copy full raw JSON"
//             >
//               {copied ? "Copied Full JSON" : "Copy Full JSON"}
//             </button>
//           </div>
//         </div>
//         <div className="text-xs max-h-80 overflow-auto bg-slate-50 text-slate-800 px-3 py-3 leading-relaxed">
//           {isCollapsible && hasFilterMatches ? (
//             <ReactJson
//               src={filteredPayload as Record<string, unknown>}
//               name={false}
//               collapsed={false}
//               iconStyle="triangle"
//               displayDataTypes={false}
//               displayObjectSize
//               enableClipboard={false}
//               theme={RAW_JSON_THEME}
//               style={{
//                 backgroundColor: "transparent",
//                 fontSize: "12px",
//                 fontFamily:
//                   "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
//                 lineHeight: 1.5,
//               }}
//             />
//           ) : normalizedFilter && !hasFilterMatches ? (
//             <div className="text-[12px] text-slate-500">
//               No keys matched "{filterText}".
//             </div>
//           ) : (
//             <pre className="whitespace-pre-wrap break-words">
//               {formattedPayload}
//             </pre>
//           )}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <Modal
//       open={visible}
//       onCancel={onClose}
//       footer={null}
//       width={700}
//       centered
//       className="final-confirm-modal"
//     >
//       <>
//         {error !== "" && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
//             <p className="text-sm text-red-700">{error}</p>
//           </div>
//         )}
//         {loading == false ? (
//           <>
//             <div
//               className="button-container"
//               // style={{ fontSize: "20px" }}
//             >
//               <strong className="confirm-text">Final Extracted Data</strong>
//             </div>

//             <JsonPayloadViewer payload={data?.[0]?.data} />

//             <button className="confirm-btn mt-3" onClick={onClose}>
//               OK
//             </button>
//           </>
//         ) : (
//           "Loading final extracted data..."
//         )}
//       </>
//     </Modal>
//   );
// }



import { Modal } from "antd";
import "../../styles/final-extracted-modal.scss";
import React from "react";
import DocumentViewer from "../../components/DocumentViewer";

interface FinalExtractedDataModal {
  visible: boolean;
  onClose: () => void;
  data?: any[];
  loading: boolean;
  error: string;
}

export default function FinalExtractedDataModal({
  visible,
  onClose,
  data,
  loading,
  error,
}: FinalExtractedDataModal) {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      className="final-confirm-modal"
    >
      <>
        {error !== "" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {loading == false ? (
          <>
            <div className="button-container">
              <strong className="confirm-text">Final Extracted Data</strong>
            </div>

            <DocumentViewer data={data?.[0]?.data} />

            <button className="confirm-btn mt-3" onClick={onClose}>
              OK
            </button>
          </>
        ) : (
          "Loading final extracted data..."
        )}
      </>
    </Modal>
  );
}