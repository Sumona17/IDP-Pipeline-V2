import { baseUrl } from '../config/configuration';
import apiClient from './handler';

export interface MySubmissionListResponse {
  submissionId: string;
  createdAt: string;
  incomingPath: string;
  senderEmail: string;
  status: string;
}

interface MySubmissionListApiResponse {
  success: boolean;
  message: string;
  data: MySubmissionListResponse[];
}

export const fetchMySubmissionList = async (): Promise<MySubmissionListResponse[]> => {
  const response = await apiClient.get<MySubmissionListApiResponse>(
    `${baseUrl}/api/v1/inreviewsubmissions/mySubmissionList?env=mvp`,
    { useCustomUrl: true }
  );

  return response.data;
};
