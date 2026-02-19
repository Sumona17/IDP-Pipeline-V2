import { baseUrl } from '../config/configuration';
import apiClient from './handler';

interface FetchDocumentApiResponse {
  success: boolean;
  message: string;
  data: string;
}

export const fetchDocument = async (originalFileKey: string): Promise<string> => {
  const response = await apiClient.get<FetchDocumentApiResponse>(
    `${baseUrl}/api/v1/download/fetchDocument?filePrefix=${encodeURIComponent(originalFileKey)}`,
    { useCustomUrl: true } as any
  );
  return response.data;
};