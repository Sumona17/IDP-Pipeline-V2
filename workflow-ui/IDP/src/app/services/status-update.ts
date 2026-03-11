import { baseUrl } from '../config/configuration';
import apiClient from './handler';

export interface UpdateStatusRequest {
  submissionId: string;
  status: string;
  userName: string;
  email: string;
}

export interface UpdateStatusResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateSubmissionStatus = async (
  payload: UpdateStatusRequest
): Promise<UpdateStatusResponse> => {

  const response = await apiClient.post<UpdateStatusResponse>(
    `${baseUrl}/api/v1/inreviewsubmissions/updateStatus`,
    payload,
    { useCustomUrl: true }
  );

  return response.data; 
};
