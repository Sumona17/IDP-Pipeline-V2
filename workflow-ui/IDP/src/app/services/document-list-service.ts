import { baseUrl } from '../config/configuration';
import apiClient from './handler';

export interface SubmissionDocument {
  documentId: string;
  documentType: string;
  fileName: string;
  extractedDataKey: string;
  originalFileKey: string;
  fileSize: string;
  fileProgress: string
}


export const getSubmissionDocuments = async (submissionId: string): Promise<SubmissionDocument[]> => {
  const response = await apiClient.get<{ success: boolean; message: string; data: SubmissionDocument[] }>(
    `${baseUrl}/api/v1/submissions/documents/${submissionId}`,
    { useCustomUrl: true } as any
  );
  return response.data;
};