import React, { useState, useRef, useEffect } from 'react';

interface BoundingBox {
  Width: number;
  Height: number;
  Left: number;
  Top: number;
}

interface FieldData {
  value: string | number | boolean;
  confidence: number | null;
  page: number;
  boundingBox: BoundingBox | null;
}

interface Section {
  [key: string]: FieldData | FieldData[] | Section | Section[];
}

interface DocumentData {
  documentType: string;
  sections: {
    [key: string]: Section | Section[];
  };
}

interface SelectedField {
  path: string;
  label: string;
  data: FieldData;
}

const formatLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const flattenData = (
  obj: any,
  parentKey = '',
  result: Array<{ path: string; label: string; data: FieldData }> = []
): Array<{ path: string; label: string; data: FieldData }> => {
  for (const key in obj) {
    const newPath = parentKey ? `${parentKey}.${key}` : key;
    if (obj[key] && typeof obj[key] === 'object' && 'value' in obj[key]) {
      result.push({
        path: newPath,
        label: formatLabel(key),
        data: obj[key] as FieldData,
      });
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item: any, index: number) => {
        if (item && typeof item === 'object' && 'value' in item) {
          result.push({
            path: `${newPath}[${index}]`,
            label: `${formatLabel(key)} ${index + 1}`,
            data: item,
          });
        } else if (item && typeof item === 'object') {
          flattenData(item, `${newPath}[${index}]`, result);
        }
      });
    } else if (obj[key] && typeof obj[key] === 'object') {
      flattenData(obj[key], newPath, result);
    }
  }
  return result;
};

const groupFieldsBySection = (fields: Array<{ path: string; label: string; data: FieldData }>) => {
  const sections: { [key: string]: Array<{ path: string; label: string; data: FieldData }> } = {};
  fields.forEach((field) => {
    const topLevelSection = field.path.split('.')[1] || 'other';
    if (!sections[topLevelSection]) {
      sections[topLevelSection] = [];
    }
    sections[topLevelSection].push(field);
  });
  return sections;
};

const DocumentComparison: React.FC = () => {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(4);
  const documentViewerRef = useRef<HTMLDivElement>(null);
  
  const pdfUrl = '/document.pdf';

  useEffect(() => {
    const sampleData: DocumentData = {
      documentType: "ACORD 125",
      sections: {
        agency: {
          agencyName: {
            value: "Aon Global Brokers",
            confidence: 99.951171875,
            page: 1,
            boundingBox: {
              Width: 0.11322050541639328,
              Height: 0.008148377761244774,
              Left: 0.039105646312236786,
              Top: 0.08535023033618927
            }
          },
          agencyPhoneNumber: {
            value: "44412345678",
            confidence: 97.607421875,
            page: 1,
            boundingBox: {
              Width: 0.07947105169296265,
              Height: 0.007767722941935062,
              Left: 0.11446130275726318,
              Top: 0.17653892934322357
            }
          },
          agencyEmail: {
            value: "rjohn@aonglobal.com",
            confidence: 99.90234375,
            page: 1,
            boundingBox: {
              Width: 0.12640385329723358,
              Height: 0.010299015790224075,
              Left: 0.09843695908784866,
              Top: 0.20647180080413818
            }
          }
        },
        applicant: {
          applicantName: {
            value: "Apex Landscaping Inc.",
            confidence: 94.326904296875,
            page: 1,
            boundingBox: {
              Width: 0.1313663274049759,
              Height: 0.009768798016011715,
              Left: 0.03933333978056908,
              Top: 0.6384437680244446
            }
          },
          applicantMailingAddress: {
            value: "123-05 84th Avenue, Kew Gardens New York - 11415",
            confidence: 99.658203125,
            page: 1,
            boundingBox: null
          },
          applicantPhone: {
            value: "55590927672",
            confidence: 98.974609375,
            page: 1,
            boundingBox: {
              Width: 0.188084214925766,
              Height: 0.00806900393217802,
              Left: 0.506050705909729,
              Top: 0.6540398597717285
            }
          }
        },
        policyInformation: {
          proposedEffectiveDate: {
            value: "01/01/2025",
            confidence: 99.54426574707031,
            page: 1,
            boundingBox: {
              Width: 0.06536129862070084,
              Height: 0.00824124924838543,
              Left: 0.05297785624861717,
              Top: 0.5853658318519592
            }
          },
          proposedExpirationDate: {
            value: "12/31/2025",
            confidence: 99.755859375,
            page: 1,
            boundingBox: {
              Width: 0.06420950591564178,
              Height: 0.008164842613041401,
              Left: 0.16847826540470123,
              Top: 0.5853462219238281
            }
          },
          carrier: {
            value: "AIG Insurance",
            confidence: 99.951171875,
            page: 1,
            boundingBox: {
              Width: 0.08343169838190079,
              Height: 0.00811728835105896,
              Left: 0.5095629096031189,
              Top: 0.08542405068874359
            }
          }
        }
      }
    };
    setDocumentData(sampleData);
  }, []);

  const handleFieldClick = (field: { path: string; label: string; data: FieldData }) => {
    setSelectedField(field);
    setEditMode(null);
    if(field.data.page) setCurrentPage(field.data.page);
  };

  const handleEditClick = (path: string, currentValue: string | number | boolean) => {
    setEditMode(path);
    setEditValue(String(currentValue));
  };

  const handleSaveEdit = (path: string) => {
    console.log('Saving edit:', path, editValue);
    setEditMode(null);
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setEditValue('');
  };

  const getConfidenceColor = (confidence: number | null): string => {
    if (confidence === null) return 'text-gray-500';
    if (confidence >= 95) return 'text-emerald-600';
    if (confidence >= 85) return 'text-amber-600';
    return 'text-red-600';
  };

  const getConfidenceBgColor = (confidence: number | null): string => {
    if (confidence === null) return 'bg-gray-100';
    if (confidence >= 95) return 'bg-emerald-50';
    if (confidence >= 85) return 'bg-amber-50';
    return 'bg-red-50';
  };

  if (!documentData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document data...</p>
        </div>
      </div>
    );
  }

  const allFields = flattenData(documentData.sections);
  const groupedFields = groupFieldsBySection(allFields);
  
  const filteredFields = allFields.filter((field) =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(field.data.value).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayFields = searchQuery
    ? filteredFields
    : selectedSection === 'all'
    ? allFields
    : groupedFields[selectedSection] || [];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Document Review</h1>
          <p className="text-sm text-gray-500 mt-1">
            {documentData.documentType} • Total Fields: {allFields.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {allFields.filter((f) => f.data.confidence && f.data.confidence >= 95).length} High Confidence
          </span>
          <span className="text-sm text-gray-600">•</span>
          <span className="text-sm text-gray-600">
            {allFields.filter((f) => f.data.confidence && f.data.confidence < 85).length} Needs Review
          </span>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 bg-white border-r border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedSection('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${
                  selectedSection === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Fields
              </button>
              {Object.keys(groupedFields).map((section) => (
                <button
                  key={section}
                  onClick={() => setSelectedSection(section)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${
                    selectedSection === section
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formatLabel(section)} ({groupedFields[section].length})
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="divide-y divide-gray-100">
              {displayFields.map((field, index) => (
                <div
                  key={field.path}
                  onClick={() => handleFieldClick(field)}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedField?.path === field.path
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {field.label}
                        </h3>
                        {field.data.boundingBox && (
                          <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            P{field.data.page}
                          </span>
                        )}
                      </div>
                      
                      {editMode === field.path ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveEdit(field.path); }}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-700 truncate flex-1">{String(field.data.value)}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditClick(field.path, field.data.value); }}
                            className="flex-shrink-0 text-blue-600 hover:text-blue-700"
                          >
                            {/* Edit Icon */}
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {field.data.confidence !== null && (
                      <div className={`ml-2 flex-shrink-0 ${getConfidenceBgColor(field.data.confidence)} px-2 py-0.5 rounded`}>
                        <span className={`text-xs font-medium ${getConfidenceColor(field.data.confidence)}`}>
                          {field.data.confidence.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-3/5 bg-gray-100 flex flex-col h-full">
          <div className="p-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Document Preview</h2>
                {selectedField && (
                  <p className="text-sm text-gray-600 mt-1">
                    Viewing: {selectedField.label}
                  </p>
                )}
              </div>
              {numPages > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-700">Page {currentPage} of {numPages}</span>
                  <button
                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage === numPages}
                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-200">
            <div
              ref={documentViewerRef}
              className="relative bg-white shadow-lg"
              style={{
                height: 'calc(100vh - 180px)',
                aspectRatio: '0.7727',
                width: 'auto'
              }}
            >
              <iframe
                src={`${pdfUrl}#page=${currentPage}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-none"
                title="PDF Document"
              />
              <div className="absolute inset-0 pointer-events-none">
                {selectedField?.data.boundingBox && selectedField.data.page === currentPage && (
                  <div
                    className="absolute border-2 border-blue-600 bg-blue-500 bg-opacity-25 z-20"
                    style={{
                      left: `${selectedField.data.boundingBox.Left * 100}%`,
                      top: `${selectedField.data.boundingBox.Top * 100}%`,
                      width: `${selectedField.data.boundingBox.Width * 100}%`,
                      height: `${selectedField.data.boundingBox.Height * 100}%`,
                    }}
                  >
                    <div className="absolute -top-7 left-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow whitespace-nowrap z-30">
                      {selectedField.label}
                    </div>
                  </div>
                )}
                {allFields
                  .filter((f) => f.data.boundingBox && f.data.page === currentPage)
                  .map((field, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFieldClick(field);
                      }}
                      className={`absolute cursor-pointer transition-all z-10 pointer-events-auto ${
                        selectedField?.path === field.path 
                          ? 'opacity-0'
                          : 'border border-blue-400 bg-blue-200 bg-opacity-10 hover:bg-opacity-30 hover:border-blue-600'
                      }`}
                      style={{
                        left: `${field.data.boundingBox!.Left * 100}%`,
                        top: `${field.data.boundingBox!.Top * 100}%`,
                        width: `${field.data.boundingBox!.Width * 100}%`,
                        height: `${field.data.boundingBox!.Height * 100}%`,
                      }}
                      title={field.label}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentComparison;