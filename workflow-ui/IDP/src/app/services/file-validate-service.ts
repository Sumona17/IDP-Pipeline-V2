import { baseUrl } from '../config/configuration';
import apiClient from './handler';

export interface ValidateDataRequest {
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

export const getValidateData = async (payload: ValidateDataRequest): Promise<ValidateDataResponse> => {
  const response = await apiClient.post<ValidateDataApiResponse>(
    `${baseUrl}/api/v1/submissions/getValidateData`,
    payload,
    { useCustomUrl: true }
  );
  return response.data;
};