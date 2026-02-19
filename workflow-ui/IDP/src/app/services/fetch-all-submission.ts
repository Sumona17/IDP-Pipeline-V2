import { baseUrl } from '../config/configuration';
import apiClient from './handler';

export interface FetchAllSubmissionResponse {
  submissionId: string;
  createdAt: string;
  incomingPath: string;
  senderEmail: string;
  status: string;
}

interface FetchAllSubmissionApiResponse {
  success: boolean;
  message: string;
  data: FetchAllSubmissionResponse[];
}

export const fetchAllSubmissions = async (): Promise<FetchAllSubmissionResponse[]> => {
  const response = await apiClient.get<FetchAllSubmissionApiResponse>(
    `${baseUrl}/api/v1/submissions/fetchAllSubmissions`,
    { useCustomUrl: true }
  );

  return response.data; 
};
