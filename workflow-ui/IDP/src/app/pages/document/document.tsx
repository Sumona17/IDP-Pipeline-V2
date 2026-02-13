import React, { useState, useMemo, useEffect, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import documentUploadedData from '../../../../public/data/uploadedDocumentData.json';

interface UploadedDocument {
  id: string;
  documentName: string;
  documentType: string;
  customerName: string;
  createdAt: string;
  documentSize: string;
}

const DocumentUploaded: React.FC = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId?: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const documents: UploadedDocument[] = documentUploadedData.documents;

  useEffect(() => {
    if (submissionId) {
      console.log('Viewing documents for submission:', submissionId);
    }
  }, [submissionId]);

  // Get unique values for filters
  const documentTypes = ['All', ...Array.from(new Set(documents.map(doc => doc.documentType)))];

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setCurrentPage(1);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'All' || doc.documentType === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [documents, searchTerm, typeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle view
  const handleView = (docId: string) => {
    // Open document in new tab/window
    window.open(`/api/documents/${docId}/view`, '_blank');
  };

  const handleDownload = (docId: string, docName: string) => {
    const link = document.createElement('a');
    link.href = `/api/documents/${docId}/download`;
    link.download = docName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDocumentClick = (docId: string) => {
    navigate('/document-review');
  };

  const getFileIcon = (filename: string): JSX.Element => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        );
      case 'xlsx':
      case 'xls':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        );
      case 'docx':
      case 'doc':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        );
      case 'zip':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
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
            className="px-2.5 py-1 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
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
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[30%]">Document Name</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Document Type</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">Customer Name</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Created At</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Document Size</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-12 text-center text-gray-500">
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
                        <div className="flex items-center space-x-2">
                          {getFileIcon(doc.documentName)}
                          <button
                            onClick={() => handleDocumentClick(doc.id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer truncate block text-left"
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
                        <span className="text-xs text-gray-600">{formatDate(doc.createdAt)}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs text-gray-600">{doc.documentSize}</span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleView(doc.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDownload(doc.id, doc.documentName)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                            title="Download"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
                <span className="font-medium">{Math.min(endIndex, filteredDocuments.length)}</span> of{' '}
                <span className="font-medium">{filteredDocuments.length}</span> documents
              </div>
              
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-0.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="text-gray-400 px-0.5">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUploaded;