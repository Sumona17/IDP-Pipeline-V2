export const ROUTE_PATHS = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  DOCUMENT_REVIEW: "/document-review/:extractedDataKey/:originalFileKey",
  DOCUMENT: "/uploaded-documents-list/:submissionId",
  NOT_FOUND: "*",
  CALLBACK: "/callback",
} as const;