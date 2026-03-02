import { baseUrl } from "../config/configuration";
import apiClient from "./handler";

export interface ValidateDataRequest {
  submissionId: string;
  documentId: string;
  extractedDataKey: string;
  originalFileKey: string;
}

export interface ValidateDataResponse {
  encodedPdfData: string;
  extractedData: {
    documentType: string;
    sections: Record<string, any>;
  };
}

interface ValidateDataApiResponse {
  success: boolean;
  message: string;
  data: ValidateDataResponse;
}

export interface DiffEntry {
  key: string;
  section: string;
  field: string;
  fieldPath?: string;
  originalValue: string;
  newValue: string;
  confidence: number | null;
  page: number;
}

export interface UpdateExtractedDataRequest {
  submissionId: string;
  documentId: string;
  extractedDataJson: Record<string, any>;
  diffJson: DiffEntry[];
  isFinalSubmit?: boolean;
}

export interface UpdateExtractedDataResponse {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

export interface SubmitExtractedDataRequest {
  submissionId: string;
  documentId: string;
  extractedDataJson: Record<string, any>;
  isFinalSubmit: boolean;
  isUpdated: boolean;
}

export const getValidateData = async (
  payload: ValidateDataRequest,
): Promise<ValidateDataResponse> => {
  const response = await apiClient.post<ValidateDataApiResponse>(
    `${baseUrl}/api/v1/submissions/getValidateData`,
    payload,
    { useCustomUrl: true },
  );
  return response.data;
};

export const updateExtractedData = async (
  payload: UpdateExtractedDataRequest,
): Promise<UpdateExtractedDataResponse> => {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data?: Record<string, any>;
  }>(
    `${baseUrl}/api/v1/submissions/updateExtractedData`,
    {
      submissionId: payload.submissionId,
      documentId: payload.documentId,
      extractedDataJson: payload.extractedDataJson,
      diffJson: payload.diffJson,
      isFinalSubmit: payload?.isFinalSubmit
    },
    { useCustomUrl: true },
  );
  return response;
};

export const submitExtractedData = async (
  payload: SubmitExtractedDataRequest,
): Promise<UpdateExtractedDataResponse> => {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data?: Record<string, any>;
  }>(
    `${baseUrl}/api/v1/submissions/submitExtractedData`,
    {
      submissionId: payload.submissionId,
      documentId: payload.documentId,
      extractedDataJson: payload.extractedDataJson,
      isFinalSubmit: payload.isFinalSubmit,
      isUpdated: payload.isUpdated,
    },
    { useCustomUrl: true },
  );
  return response;
};
