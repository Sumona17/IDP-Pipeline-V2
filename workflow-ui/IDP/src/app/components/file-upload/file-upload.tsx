import React, { useState, useRef, type JSX } from 'react';
import { batchUploadFiles } from '../../services/file-upload-service';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface UploadDrawerProps {
  open: boolean;
  onClose: () => void;
  submissionId?: string;
}

const UploadDrawer: React.FC<UploadDrawerProps> = ({ open, onClose, submissionId }) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const resetAll = () => {
    setUploadingFiles([]);
    setIsDragging(false);
    setIsUploading(false);
    setSubmissionResult(null);
    abortControllersRef.current = {};
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isUploading) return;
    resetAll();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (filename: string): JSX.Element => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const colors: Record<string, string> = {
      pdf: 'text-red-500',
      xlsx: 'text-green-600',
      xls: 'text-green-600',
      docx: 'text-blue-500',
      doc: 'text-blue-500',
      zip: 'text-yellow-500',
    };
    return (
      <svg className={`w-4 h-4 ${colors[ext ?? ''] ?? 'text-gray-500'} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
      </svg>
    );
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const toAdd: UploadingFile[] = Array.from(newFiles).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
    }));
    setUploadingFiles(prev => [...prev, ...toAdd]);
    setSubmissionResult(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearCompleted = () => {
    setUploadingFiles(prev => prev.filter(f => f.status !== 'done'));
  };

  const handleUploadAll = async () => {
    const pending = uploadingFiles.filter(f => f.status === 'pending');
    if (!pending.length || isUploading) return;

    setIsUploading(true);
    setSubmissionResult(null);

    setUploadingFiles(prev =>
      prev.map(f => f.status === 'pending' ? { ...f, status: 'uploading', progress: 0 } : f)
    );

    try {
      const { submissionId: sid } = await batchUploadFiles(
        pending.map(f => f.file),
        abortControllersRef.current,
        {
          // Pass submissionId to the API only when it is already known
          ...(submissionId && { submissionId }),
          onFileProgress: (fileName, percent) => {
            setUploadingFiles(prev =>
              prev.map(f => f.file.name === fileName ? { ...f, progress: percent } : f)
            );
          },
          onFileSuccess: (fileName) => {
            setUploadingFiles(prev =>
              prev.map(f => f.file.name === fileName ? { ...f, status: 'done', progress: 100 } : f)
            );
          },
          onFileError: (fileName, error) => {
            const message = error instanceof Error ? error.message : 'Upload failed. Try again.';
            setUploadingFiles(prev =>
              prev.map(f => f.file.name === fileName ? { ...f, status: 'error', error: message } : f)
            );
          },
        }
      );
      setSubmissionResult(sid);
    } catch (err) {
      setUploadingFiles(prev =>
        prev.map(f =>
          f.status === 'uploading'
            ? { ...f, status: 'error', error: 'Could not reach the server. Try again.' }
            : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const pendingCount = uploadingFiles.filter(f => f.status === 'pending').length;
  const doneCount    = uploadingFiles.filter(f => f.status === 'done').length;
  const errorCount   = uploadingFiles.filter(f => f.status === 'error').length;

  const getStatusBadge = (status: UploadingFile['status'], progress: number) => {
    if (status === 'done') return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Done
      </span>
    );
    if (status === 'error') return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Error
      </span>
    );
    if (status === 'uploading') return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#3C20F6] bg-[#E6DAFF] border border-[#c5b3ff] px-2 py-0.5 rounded-full">
        <div className="w-2.5 h-2.5 border-2 border-[#3C20F6] border-t-transparent rounded-full animate-spin" />
        {progress}%
      </span>
    );
    return (
      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
        Pending
      </span>
    );
  };

  return (
    <>
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[460px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E6DAFF] rounded-lg">
              <svg className="w-4 h-4 text-[#3C20F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0L9 7m3-3l3 3" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Upload Documents</h2>
              <p className="text-xs text-gray-400 mt-0.5">Drag & drop or browse to select files</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 group select-none ${
              isUploading
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                : isDragging
                ? 'cursor-copy border-[#3C20F6] bg-[#E6DAFF]/40'
                : 'cursor-pointer border-[#c5b3ff] bg-[#E6DAFF]/20 hover:border-[#3C20F6] hover:bg-[#E6DAFF]/40'
            }`}
          >
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
              isDragging ? 'bg-[#E6DAFF]' : 'bg-white shadow-sm group-hover:bg-[#E6DAFF]'
            }`}>
              <svg className={`w-6 h-6 transition-colors ${
                isDragging ? 'text-[#3C20F6]' : 'text-gray-400 group-hover:text-[#3C20F6]'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className={`text-sm font-semibold mb-1 ${isDragging ? 'text-[#3C20F6]' : 'text-gray-700'}`}>
              {isDragging ? 'Release to add files' : 'Drop files here or click to browse'}
            </p>
            <p className="text-xs text-gray-400">PDF, DOCX, XLSX, ZIP, PNG, JPG</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
              onChange={handleFileInput}
              disabled={isUploading}
              className="hidden"
            />
          </div>

          {submissionResult && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-green-800">Upload complete</p>
                <p className="text-[11px] text-green-600 mt-0.5 break-all">
                  Submission ID: <span className="font-mono">{submissionResult}</span>
                </p>
              </div>
            </div>
          )}

          {uploadingFiles.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-medium text-gray-700">
                  {uploadingFiles.length} file{uploadingFiles.length !== 1 ? 's' : ''}
                </span>
                {pendingCount > 0 && <span className="text-amber-600">{pendingCount} pending</span>}
                {doneCount > 0    && <span className="text-green-600">{doneCount} uploaded</span>}
                {errorCount > 0   && <span className="text-red-500">{errorCount} failed</span>}
              </div>
              {doneCount > 0 && !isUploading && (
                <button
                  onClick={handleClearCompleted}
                  className="text-xs text-[#3C20F6] hover:underline underline-offset-2 transition-colors"
                >
                  Clear uploaded
                </button>
              )}
            </div>
          )}

          {uploadingFiles.length > 0 && (
            <div className="space-y-2">
              {uploadingFiles.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    f.status === 'done'      ? 'bg-green-50 border-green-200' :
                    f.status === 'error'     ? 'bg-red-50 border-red-200' :
                    f.status === 'uploading' ? 'bg-[#E6DAFF]/30 border-[#c5b3ff]' :
                                              'bg-white border-gray-200'
                  }`}
                >
                  <div className="mt-0.5">{getFileIcon(f.file.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{f.file.name}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {getStatusBadge(f.status, f.progress)}
                        {f.status !== 'uploading' && (
                          <button
                            onClick={() => removeFile(f.id)}
                            className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors rounded-full"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400">{formatFileSize(f.file.size)}</p>
                    {(f.status === 'uploading' || f.status === 'done') && (
                      <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            f.status === 'done' ? 'bg-green-500' : 'bg-[#3C20F6]'
                          }`}
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}
                    {f.status === 'error' && (
                      <p className="text-[11px] text-red-500 mt-1">{f.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadingFiles.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="mx-auto w-12 h-12 bg-[#E6DAFF]/40 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-[#c5b3ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xs text-gray-400">No files selected yet</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 px-5 py-3.5 bg-gray-50 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="border border-[#3C20F6] text-[#3C20F6] bg-[#E6DAFF] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#d4c5ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border border-[#3C20F6] text-[#3C20F6] bg-[#E6DAFF] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#d4c5ff] transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Files
            </button>
            <button
              onClick={handleUploadAll}
              disabled={pendingCount === 0 || isUploading}
              className="bg-[#3C20F6] hover:bg-[#2d18c4] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0L9 7m3-3l3 3" />
                  </svg>
                  Upload{pendingCount > 0 ? ` (${pendingCount})` : ' All'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadDrawer;