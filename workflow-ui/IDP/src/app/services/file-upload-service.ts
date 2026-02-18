import axiosCore from 'axios';
import apiClient from './handler';

export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
}

export interface PresignedUrlResponse {
  fileName: string;
  s3Key: string;
  uploadUrl: string;
  submissionId: string;
  documentId: string;
}

export interface UploadFileOptions {
  file: File;
  uploadUrl: string;
  abortSignal?: AbortSignal;
  onProgress?: (percent: number) => void;
}

export interface BatchUploadCallbacks {
  onFileProgress?: (fileName: string, percent: number) => void;
  onFileSuccess?: (fileName: string, meta: PresignedUrlResponse) => void;
  onFileError?: (fileName: string, error: unknown) => void;
}

export const getPresignedUrls = async (files: File[]): Promise<PresignedUrlResponse[]> => {
  const payload: PresignedUrlRequest[] = files.map((file) => ({
    fileName: file.name,
    contentType: file.type,
  }));
  return await apiClient.post<PresignedUrlResponse[]>('generate-presigned-url', payload);
};

export const uploadFileToS3 = async ({ file, uploadUrl, abortSignal, onProgress }: UploadFileOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('S3 upload network error'));

    abortSignal?.addEventListener('abort', () => {
      xhr.abort();
      const err = new Error('CanceledError');
      err.name = 'CanceledError';
      reject(err);
    });

    xhr.send(file);
  });
};

export const batchUploadFiles = async (
  files: File[],
  abortControllers: Record<string, AbortController>,
  callbacks: BatchUploadCallbacks = {}
): Promise<{ submissionId: string }> => {
  const presignedList = await getPresignedUrls(files);
  const submissionId = presignedList[0]?.submissionId ?? '';

  const presignedMap: Record<string, PresignedUrlResponse> = {};
  presignedList.forEach((p) => { presignedMap[p.fileName] = p; });

  const BATCH_SIZE = 5;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (file) => {
        const presigned = presignedMap[file.name];
        if (!presigned) {
          callbacks.onFileError?.(file.name, new Error('No presigned URL returned for this file.'));
          return;
        }

        const controller = new AbortController();
        abortControllers[file.name] = controller;

        try {
          await uploadFileToS3({
            file,
            uploadUrl: presigned.uploadUrl,
            abortSignal: controller.signal,
            onProgress: (percent) => callbacks.onFileProgress?.(file.name, percent),
          });
          callbacks.onFileSuccess?.(file.name, presigned);
        } catch (error: unknown) {
          if ((error as any)?.name === 'CanceledError') {
            console.log(`${file.name} cancelled`);
          } else {
            callbacks.onFileError?.(file.name, error);
          }
        }
      })
    );
  }

  return { submissionId };
};