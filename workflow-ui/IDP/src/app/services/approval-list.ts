import { baseUrl } from "../config/configuration";
import apiClient from "./handler";

export interface MyApprovalListResponse {
  submissionId: string;
  createdAt: string;
  incomingPath: string;
  senderEmail: string;
  status: string;
}

interface MyApprovalListApiResponse {
  success: boolean;
  message: string;
  data: MyApprovalListResponse[];
}

export const fetchMyApprovalList = async (): Promise<
  MyApprovalListResponse[]
> => {
  const response = await apiClient.get<MyApprovalListApiResponse>(
    `${baseUrl}/api/v1/inreviewsubmissions/myApprovalList`,
    { useCustomUrl: true } as any,
  );

  return response.data;
};
