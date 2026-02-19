import React, { useState, useMemo, useEffect, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmissionDocuments, type SubmissionDocument } from '../../services/document-list-service';
import apiClient from '../../services/handler';
import { InstanceStepsModal, type InstanceLogStep } from './InstanceStepsModal';


interface UploadedDocument {
  id: string;
  documentName: string;
  documentType: string;
  customerName: string;
  confidence: number;
  createdAt: string;
  documentSize: string;
  extractedDataKey: string;
  originalFileKey: string;
}

const mapToUploadedDocument = (doc: SubmissionDocument): UploadedDocument => ({
  id: doc.documentId,
  documentName: doc.fileName,
  documentType: doc.documentType,
  extractedDataKey: doc.extractedDataKey,
  originalFileKey: doc.originalFileKey,
  documentSize: doc.fileSize,
  customerName: '-',
  confidence: 0,
  createdAt: new Date().toISOString(),
});

const DocumentUploaded: React.FC = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId?: string }>();

  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [instanceSteps, setInstanceSteps] = useState<InstanceLogStep[] | null>(null);
  const [instanceStepsLoading, setInstanceStepsLoading] = useState(false);
  const [instanceStepsError, setInstanceStepsError] = useState<string | null>(null);
  const [showInstanceStepsModal, setShowInstanceStepsModal] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    if (!submissionId) return;

    const fetchDocuments = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getSubmissionDocuments(submissionId);
        setDocuments(data.map(mapToUploadedDocument));
      } catch (err) {
        console.error('Failed to fetch submission documents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [submissionId]);

  const documentTypes = ['All', ...Array.from(new Set(documents.map(d => d.documentType)))];

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setCurrentPage(1);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        doc.documentName.toLowerCase().includes(q) ||
        doc.customerName.toLowerCase().includes(q) ||
        doc.documentType.toLowerCase().includes(q) ||
        doc.id.toLowerCase().includes(q);
      return matchesSearch && (typeFilter === 'All' || doc.documentType === typeFilter);
    });
  }, [documents, searchTerm, typeFilter]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const handleView = (docId: string) => {};

  const handleDownload = (docId: string, docName: string) => {
  };

  const handleOpenLogs = async (instanceId: string) => {
    setActiveInstanceId(instanceId);
    setShowInstanceStepsModal(true);
    setInstanceStepsLoading(true);
    setInstanceStepsError(null);
    setInstanceSteps(null);

    try {
      // const response = await apiClient.get<InstanceLogStep[]>(`/logs/${instanceId}`);
      const response = [
    {
        "id": "1eb47afa-2c5a-4757-8f0b-acc8a73212f5",
        "workflowInstanceId": "e71f905a-46a5-4967-9c20-32fb3ddfb48e",
        "nodeId": "task-jzmduj4v",
        "nodeType": "task",
        "nodeName": "DOCUMENT_WATCHER",
        "status": "STARTED",
        "message": "Node started",
        "requestPayload": null,
        "responsePayload": null,
        "executedAt": "2026-02-18T14:49:20.916376",
        "durationFormatted": null
    },
    {
        "id": "6bbe3c32-71d8-4c14-8b19-f10464d8daad",
        "workflowInstanceId": "e71f905a-46a5-4967-9c20-32fb3ddfb48e",
        "nodeId": "task-jzmduj4v",
        "nodeType": "task",
        "nodeName": "DOCUMENT_WATCHER",
        "status": "COMPLETED",
        "message": "Document uploaded",
        "requestPayload": "{\"fileName\": \"Acord140_V2.pdf\", \"fileSize\": 330641}",
        "responsePayload": "{}",
        "executedAt": "2026-02-18T14:49:25.917013",
        "durationFormatted": "5s"
    },
    {
        "id": "eeb4ef5c-5c08-4ea6-81b8-356d8784baf4",
        "workflowInstanceId": "e71f905a-46a5-4967-9c20-32fb3ddfb48e",
        "nodeId": "task-njgl43fw",
        "nodeType": "task",
        "nodeName": "DOCUMENT_CLASSIFIER",
        "status": "STARTED",
        "message": "Node started",
        "requestPayload": null,
        "responsePayload": null,
        "executedAt": "2026-02-18T14:49:25.942514",
        "durationFormatted": null
    },
    {
        "id": "59fbc1cf-9b66-49f6-9f2e-388f5f087297",
        "workflowInstanceId": "e71f905a-46a5-4967-9c20-32fb3ddfb48e",
        "nodeId": "task-njgl43fw",
        "nodeType": "task",
        "nodeName": "DOCUMENT_CLASSIFIER",
        "status": "COMPLETED",
        "message": "Document Classification completed",
        "requestPayload": "{\"filename\": \"ACORD 140\", \"document_type\": \"pdf_with_images_and_text\"}",
        "responsePayload": "{}",
        "executedAt": "2026-02-18T14:49:29.648069",
        "durationFormatted": "3s"
    },
    {
        "id": "ed57ff36-0f24-4d5f-b973-df59782bb667",
        "workflowInstanceId": "e71f905a-46a5-4967-9c20-32fb3ddfb48e",
        "nodeId": "task-lickzlke",
        "nodeType": "task",
        "nodeName": "DOCUMENT_INGESTION",
        "status": "STARTED",
        "message": "Node started",
        "requestPayload": null,
        "responsePayload": null,
        "executedAt": "2026-02-18T14:49:29.672516",
        "durationFormatted": null
    },
    {
        "id": "d8fe5a9a-7868-45ee-b7bd-ef9e7e9f05af",
        "workflowInstanceId": "e71f905a-46a5-4967-9c20-32fb3ddfb48e",
        "nodeId": "task-lickzlke",
        "nodeType": "task",
        "nodeName": "DOCUMENT_INGESTION",
        "status": "COMPLETED",
        "message": "Document Ingestion Completed",
        "requestPayload": "{\"documentType\": \"ACORD 140 Property Section\", \"documentExtractedKey\": \"5b41a801-3b46-4262-8245-be9fd3befb70/e71f905a-46a5-4967-9c20-32fb3ddfb48e/Acord140_V2.pdf.json\"}",
        "responsePayload": "{}",
        "executedAt": "2026-02-18T14:50:21.184077",
        "durationFormatted": "51s"
    }
]
      setInstanceSteps(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Failed to fetch instance logs:', err);
      setInstanceStepsError(err instanceof Error ? err.message : 'Failed to load logs');
      setInstanceSteps([]);
    } finally {
      setInstanceStepsLoading(false);
    }
  };

  const closeLogsModal = () => {
    setShowInstanceStepsModal(false);
    setInstanceSteps(null);
    setInstanceStepsError(null);
    setActiveInstanceId(null);
  };

  const handleDocumentClick = (doc: UploadedDocument) => {
    navigate(`/document-review/${encodeURIComponent(doc.extractedDataKey)}/${encodeURIComponent(doc.originalFileKey)}`);
  }

  const getFileIcon = (filename: string): JSX.Element => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const colors: Record<string, string> = {
      pdf: 'text-red-600', xlsx: 'text-green-600', xls: 'text-green-600',
      docx: 'text-blue-600', doc: 'text-blue-600', zip: 'text-yellow-600',
    };
    return (
      <svg className={`w-4 h-4 ${colors[ext ?? ''] ?? 'text-gray-600'} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {error && (
          <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-2 flex-shrink-0">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="px-0 pt-2 pb-1.5 flex-shrink-0">
          <div className="flex items-end gap-2">
            <div className="flex-1 grid grid-cols-4 gap-2">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-2 top-1.5 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Document Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={resetFilters}
              className="px-2.5 py-1 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              title="Reset Filters"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-0 pb-3">
          <div className="border border-gray-200 rounded flex flex-col overflow-hidden">
            <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-280px)]">
              <table className="w-full divide-y divide-gray-200 text-lg">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[30%]">Document Name</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Document Type</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">Customer Name</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Progress Score</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Created At</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Document Size</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-2 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-400">No data</p>
                      </td>
                    </tr>
                  ) : (
                    currentDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            {getFileIcon(doc.documentName)}
                            <button
                              onClick={() => handleDocumentClick(doc)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block text-left flex-1 min-w-0"
                            >
                              {doc.documentName}
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <span className="text-xs text-gray-900">{doc.documentType}</span>
                        </td>
                        <td className="px-2 py-2">
                          <span className="text-xs font-medium text-gray-900 truncate block">{doc.customerName}</span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-900">
                              {doc.confidence ? Math.round(Number(doc.confidence) * 100) : 0}%
                            </span>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-600 rounded-full transition-all"
                                style={{ width: `${doc.confidence ? Number(doc.confidence) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <span className="text-xs text-gray-600">{formatDate(doc.createdAt)}</span>
                        </td>
                        <td className="px-2 py-2">
                          <span className="text-xs text-gray-600">{doc.documentSize}</span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleView(doc.id)} className="text-blue-600 hover:text-blue-800" title="View">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                
                              </svg>
                            </button>
                            <button onClick={() => handleDownload(doc.id, doc.documentName)} className="text-green-600 hover:text-green-800" title="Download">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <button onClick={() => handleOpenLogs(doc.id)} className="text-cyan-600 hover:text-cyan-800" title="View Logs">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredDocuments.length > 0 && (
              <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                <div className="text-xs text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredDocuments.length)}</span> of{' '}
                  <span className="font-medium">{filteredDocuments.length}</span> documents
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-0.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-2 py-0.5 text-xs font-medium rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2)
                        return <span key={page} className="text-gray-400 px-0.5">...</span>;
                      return null;
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <InstanceStepsModal
        isOpen={showInstanceStepsModal}
        activeInstanceId={activeInstanceId}
        instanceSteps={instanceSteps}
        instanceStepsLoading={instanceStepsLoading}
        instanceStepsError={instanceStepsError}
        onClose={closeLogsModal}
      />
    </>
  );
};

export default DocumentUploaded;



