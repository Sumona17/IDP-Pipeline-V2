import React, { useState, useMemo } from 'react';
import queueData from '../../../../../public/data/queueData.json';
import { useNavigate } from "react-router-dom";



// interface Document {
//   id: string;
//   documentName: string;
//   documentType: string;
//   status: string;
//   confidence: number | null;
//   submittedBy: string;
//   submittedAt: string;
//   processedAt: string | null;
//   classifier: string | null;
//   validationStatus: string;
//   assignedTo: string | null;
//   source: string;
// }
interface SubDocument {
  documentName: string | string[];
  documentType: string;
  confidence: number | null;
}


interface Document {
  id: string;
  documents: SubDocument[];
  status: string;
  submittedBy: string;
  submittedAt: string;
  processedAt: string | null;
  classifier: string | null;
  validationStatus: string;
  assignedTo: string | null;
  source: string;
}


const DocumentQueue: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

 const documents: Document[] = queueData.documents.map((doc: any) => {
  if (doc.documents) {
    return doc;
  }

  return {
    ...doc,
    documents: [
      {
        documentName: doc.documentName,
        documentType: doc.documentType,
        confidence: doc.confidence ?? null
      }
    ]
  };
});

const normalizeNames = (name: string | string[]): string[] => {
  return Array.isArray(name) ? name : [name];
};

  const navigate = useNavigate();

  const statuses = ['All', ...Array.from(new Set(documents.map(doc => doc.status)))];
  // const types = ['All', ...Array.from(new Set(documents.map(doc => doc.documentType)))];
const types = [
  'All',
  ...Array.from(
    new Set(
      documents.flatMap(doc =>
        Array.isArray(doc.documents)
          ? doc.documents.map(d => d.documentType)
          : []
      )
    )
  )
];


  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // const matchesSearch = doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //                      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //                      doc.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch =
  doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
  doc.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
 doc.documents.some(d =>
  normalizeNames(d.documentName).some(n =>
    n.toLowerCase().includes(searchTerm.toLowerCase())
  )
);


      const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
      // const matchesType = typeFilter === 'All' || doc.documentType === typeFilter;
      const matchesType =
  typeFilter === 'All' ||
  doc.documents.some(d => d.documentType === typeFilter);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [documents, searchTerm, statusFilter, typeFilter]);

  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'Failed': 'bg-red-100 text-red-800 border-red-200',
      'Human Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Queued': 'bg-gray-100 text-gray-800 border-gray-200',
      'Invalid Document': 'bg-red-100 text-red-800 border-red-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getConfidenceColor = (confidence: number | null): string => {
    if (confidence === null) return 'text-gray-400';
    if (confidence >= 0.9) return 'text-green-600 font-semibold';
    if (confidence >= 0.7) return 'text-blue-600 font-medium';
    if (confidence >= 0.5) return 'text-yellow-600 font-medium';
    return 'text-red-600 font-semibold';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: documents.length,
    completed: documents.filter(d => d.status === 'Completed').length,
    processing: documents.filter(d => d.status === 'Processing').length,
    failed: documents.filter(d => d.status === 'Failed' || d.status === 'Invalid Document').length,
    humanReview: documents.filter(d => d.status === 'Human Review').length,
  };

  return (
    <div>
      <div>
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Document Processing Queue</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-xs">
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-5 gap-2 mb-2 flex-shrink-0">
          <div className="bg-white rounded border border-gray-200 p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total</p>
                <p className="text-base font-semibold text-gray-900 mt-0.5">{stats.total}</p>
              </div>
              <div className="p-1.5 bg-gray-100 rounded">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded border border-gray-200 p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-base font-semibold text-green-600 mt-0.5">{stats.completed}</p>
              </div>
              <div className="p-1.5 bg-green-100 rounded">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded border border-gray-200 p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Processing</p>
                <p className="text-base font-semibold text-blue-600 mt-0.5">{stats.processing}</p>
              </div>
              <div className="p-1.5 bg-blue-100 rounded">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded border border-gray-200 p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Review</p>
                <p className="text-base font-semibold text-yellow-600 mt-0.5">{stats.humanReview}</p>
              </div>
              <div className="p-1.5 bg-yellow-100 rounded">
                <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded border border-gray-200 p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Failed</p>
                <p className="text-base font-semibold text-red-600 mt-0.5">{stats.failed}</p>
              </div>
              <div className="p-1.5 bg-red-100 rounded">
                <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded border border-gray-200 p-2 mb-2 flex-shrink-0">
          <div className="grid grid-cols-4 gap-2">
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
                <svg className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
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
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="bg-white rounded border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Score
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-2 py-6 text-center text-gray-500">
                        <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xs">No documents found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-2 whitespace-nowrap">
                          <button
                            onClick={() => navigate("/document-review")}
                            className="text-xs font-medium text-blue-600 hover:underline"
                            >
                            {doc.id}
                            </button>
                        </td>
                        <td className="px-2 py-2 max-w-[200px]">
                          <div className="flex items-center">
                            <div className="ml-1.5 min-w-0">
                              {/* <div className="text-xs font-medium text-gray-900 truncate">{doc.documentName}</div> */}
                              <div className="space-y-0.5">
{(doc.documents ?? []).map((d, idx) => (
  <div key={idx} className="space-y-0.5">
    {normalizeNames(d.documentName).map((name, i) => (
      <div
        key={i}
        className="text-xs font-medium text-gray-900 truncate"
        title={name}
      >
        {name}
      </div>
    ))}
  </div>
))}

</div>

                              {/* <div className="text-xs text-gray-500">{doc.source}</div> */}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
  {doc.documents.some(d => d.confidence !== null) ? (
    doc.documents.map((d, idx) => (
      d.confidence !== null && (
        <div key={idx} className="flex items-center mb-1">
          <span className={`text-xs ${getConfidenceColor(d.confidence)}`}>
            {(d.confidence * 100).toFixed(0)}%
          </span>
          <div className="ml-1.5 w-10 bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${
                d.confidence >= 0.9 ? 'bg-green-600' :
                d.confidence >= 0.7 ? 'bg-blue-600' :
                d.confidence >= 0.5 ? 'bg-yellow-600' :
                'bg-red-600'
              }`}
              style={{ width: `${d.confidence * 100}%` }}
            />
          </div>
        </div>
      )
    ))
  ) : (
    <span className="text-xs text-gray-400">-</span>
  )}
</td>

                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="text-xs text-gray-500">{formatDate(doc.submittedAt)}</span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs">
                          <div className="flex items-center space-x-1.5">
                            <button className="text-blue-600 hover:text-blue-800 font-medium">
                              View
                            </button>
                            <span className="text-gray-300">|</span>
                            <button className="text-gray-600 hover:text-gray-800">
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {filteredDocuments.length > 0 && (
            <div className="bg-gray-50 px-2 py-1.5 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-700">
                  Showing <span className="font-medium">1-{filteredDocuments.length}</span> of{' '}
                  <span className="font-medium">{filteredDocuments.length}</span>
                </div>
                <div className="flex space-x-1">
                  <button className="px-2 py-0.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    Prev
                  </button>
                  <button className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-medium">
                    1
                  </button>
                  <button className="px-2 py-0.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentQueue;