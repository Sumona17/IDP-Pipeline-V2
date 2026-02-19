import React, { useState, useMemo, useEffect } from 'react';
import openQueueData from '../../../../../public/data/openQueueData.json';
import { useNavigate } from 'react-router-dom';
import { useGlobalSort } from "../../../utils/global-sort";
import { fetchAllSubmissions } from '../../../services/fetch-all-submission';
import { updateSubmissionStatus } from '../../../services/status-update';
import { useAuth } from "react-oidc-context";



interface QueueDocument {
  id: string;
  heading: string;
  productLOB: string;
  from: string;
  customerName: string;
  brokerName: string;
  emailSubject: string;
  dateReceived: string;
  documentSource: string;
  status: string;
}

const OpenQueue: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [lobFilter, setLobFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
    const navigate = useNavigate();
const auth = useAuth();
  const [documents, setDocuments] = useState<QueueDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Get unique values for filters
  const documentSources = ['All', ...Array.from(new Set(documents.map(doc => doc.documentSource)))];
  const statuses = ['All', ...Array.from(new Set(documents.map(doc => doc.status)))];
  const lobs = ['All', ...Array.from(new Set(documents.map(doc => doc.productLOB)))];
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSourceFilter('All');
    setStatusFilter('All');
    setLobFilter('All');
    setCurrentPage(1);
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.brokerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.emailSubject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSource = sourceFilter === 'All' || doc.documentSource === sourceFilter;
      const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
      const matchesLOB = lobFilter === 'All' || doc.productLOB === lobFilter;
      
      return matchesSearch && matchesSource && matchesStatus && matchesLOB;
    });
  }, [documents, searchTerm, sourceFilter, statusFilter, lobFilter]);
  const { sortedData, SortHeader } = useGlobalSort(filteredDocuments);

  // Pagination calculations
  // const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // const currentDocuments = filteredDocuments.slice(startIndex, endIndex);
  const currentDocuments = sortedData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sourceFilter, statusFilter, lobFilter]);


  useEffect(() => {
  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await fetchAllSubmissions();

      const mappedData: QueueDocument[] = data.map((item) => ({
        id: item.submissionId,
        heading: item.submissionId,
        productLOB: '-',
        from: item.senderEmail,
        customerName: '-',
        brokerName: '-',
        emailSubject: '-',
        dateReceived: item.createdAt,
        documentSource:
          item.incomingPath === 'EMAIL_UPLOAD'
            ? 'Email'
            : item.incomingPath,
        status:
          item.status === 'PENDING'
            ? 'Pending Review'
            : item.status,
      }));

      setDocuments(mappedData);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  loadSubmissions();
}, []);

  // Status badge styling
  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'Pending Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'On Hold': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Document source badge styling
  const getSourceColor = (source: string): string => {
    const sourceColors: { [key: string]: string } = {
      'Email': 'bg-purple-100 text-purple-800 border-purple-200',
      'File Upload': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'SFTP': 'bg-teal-100 text-teal-800 border-teal-200',
    };
    return sourceColors[source] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

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

  //   const handleSubmissionClick = (submissionId: string) => {
  //   navigate(`/uploaded-documents-list/${submissionId}`);
  // };
const handleSubmissionClick = async (submissionId: string) => {
  try {
    const email = auth.user?.profile?.email as string;
    const userName = email?.split("@")[0];

    await updateSubmissionStatus({
      submissionId,
      status: 'IN-REVIEW',
      userName,
      eMail: email
    });

    setDocuments(prev =>
      prev.map(doc =>
        doc.id === submissionId
          ? { ...doc, status: 'In Progress' }
          : doc
      )
    );

    navigate(`/uploaded-documents-list/${submissionId}`);
  } catch (error) {
    console.error('Failed to update status:', error);
  }
};


  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="px-0 pt-2 pb-1.5 flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 grid grid-cols-5 gap-2">
            <div className="col-span-2">
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
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                {documentSources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Product/LOB</label>
              <select
                value={lobFilter}
                onChange={(e) => setLobFilter(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                {lobs.map(lob => (
                  <option key={lob} value={lob}>{lob}</option>
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

      {/* Table */}
      <div className="flex-1 overflow-hidden px-0 pb-3">
        <div className="border border-gray-200 rounded flex flex-col overflow-hidden">
          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-280px)]">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[8%]">Product/LOB</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">From</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Customer Name</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Broker Name</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[12%]">Email Subject</th>
                  {/* <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Date Received</th> */}
                    <SortHeader columnKey="dateReceived" label="Date Received" className="w-[10%]" />
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[8%]">Source</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[8%]">Status</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-12 text-center text-gray-500">
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
                        <span className="text-xs text-gray-900 line-clamp-2">{doc.productLOB}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs text-gray-600 truncate block">{doc.from}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs font-medium text-gray-900 truncate block">{doc.customerName}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs text-gray-900 truncate block">{doc.brokerName}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs text-gray-600 line-clamp-2">{doc.emailSubject}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs text-gray-600">{formatDate(doc.dateReceived)}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full border ${getSourceColor(doc.documentSource)}`}>
                          {doc.documentSource}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex px-2.5 py-0.5 items-center justify-center text-xs font-medium rounded-full border ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap" onClick={() => handleSubmissionClick(doc.id)}>
                          Review Submission
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                    // Show first page, last page, current page, and pages around current
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

export default OpenQueue;