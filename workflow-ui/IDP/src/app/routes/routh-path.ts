export const ROUTE_PATHS = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  DOCUMENT_REVIEW: "/document-review/:submissionId/:documentId/:extractedDataKey/:originalFileKey",
  SUBMISSIONDETAILS: "/submission-details/:submissionId",
  NOT_FOUND: "*",
  CALLBACK: "/callback",
} as const;