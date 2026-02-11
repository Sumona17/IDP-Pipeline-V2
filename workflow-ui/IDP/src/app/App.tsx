// import React, { useState, useRef, useEffect } from 'react';
// import { Document, Page, pdfjs } from 'react-pdf';
// import { Search, ChevronDown, ChevronRight, FileText, ZoomIn, ZoomOut, Loader } from 'lucide-react';
// import acordPdf from './assets/Acord125_V2.pdf';


// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.js',
//   import.meta.url
// ).toString();


// // Type definitions
// interface BoundingBox {
//   Width: number;
//   Height: number;
//   Left: number;
//   Top: number;
// }

// interface ExtractedValue {
//   value: string;
//   confidence: number;
//   page: number;
//   boundingBox: BoundingBox | null;
// }

// interface SelectedField {
//   value: string;
//   confidence: number;
//   page: number;
//   boundingBox: BoundingBox | null;
//   label: string;
// }

// const acordData = {
//   "documentType": "ACORD 125",
//   "sections": {
//     "agency": {
//       "agencyName": {
//         "value": "Aon Global Brokers",
//         "confidence": 99.951171875,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.11322050541639328,
//           "Height": 0.008148377761244774,
//           "Left": 0.039105646312236786,
//           "Top": 0.08535023033618927
//         }
//       },
//       "agencyPhoneNumber": {
//         "value": "44412345678",
//         "confidence": 97.607421875,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.07947105169296265,
//           "Height": 0.007767722941935062,
//           "Left": 0.11446130275726318,
//           "Top": 0.17653892934322357
//         }
//       },
//       "agencyEmail": {
//         "value": "rjohn@aonglobal.com",
//         "confidence": 99.90234375,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.12640385329723358,
//           "Height": 0.010299015790224075,
//           "Left": 0.09843695908784866,
//           "Top": 0.20647180080413818
//         }
//       },
//       "agencyContactName": {
//         "value": "Mr. Rubin John",
//         "confidence": 99.9267578125,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.08778592199087143,
//           "Height": 0.008019187487661839,
//           "Left": 0.09196005761623383,
//           "Top": 0.1612137109041214
//         }
//       }
//     },
//     "applicant": {
//       "applicantName": {
//         "value": "Apex Landscaping Inc.",
//         "confidence": 94.326904296875,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.1313663274049759,
//           "Height": 0.009768798016011715,
//           "Left": 0.03933333978056908,
//           "Top": 0.6384437680244446
//         }
//       },
//       "applicantMailingAddress": {
//         "value": "123-05 84th Avenue, Kew Gardens New York - 11415",
//         "confidence": 99.658203125,
//         "page": 1,
//         "boundingBox": null
//       },
//       "applicantPhone": {
//         "value": "55590927672",
//         "confidence": 98.974609375,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.188084214925766,
//           "Height": 0.00806900393217802,
//           "Left": 0.506050705909729,
//           "Top": 0.6540398597717285
//         }
//       },
//       "applicantWebsite": {
//         "value": "www.apexhigh.com",
//         "confidence": 99.853515625,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.11319330334663391,
//           "Height": 0.0101515157148242,
//           "Left": 0.5092862844467163,
//           "Top": 0.683588981628418
//         }
//       },
//       "applicantFEIN": {
//         "value": "12-3456789",
//         "confidence": 98.330078125,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.06846557557582855,
//           "Height": 0.008126889355480671,
//           "Left": 0.8634397983551025,
//           "Top": 0.638583242893219
//         }
//       },
//       "applicantContactName": {
//         "value": "Mr. Robert Curie",
//         "confidence": 99.609375,
//         "page": 2,
//         "boundingBox": {
//           "Width": 0.18818941712379456,
//           "Height": 0.011357731185853481,
//           "Left": 0.03544178605079651,
//           "Top": 0.07027667760848999
//         }
//       },
//       "applicantContactPhone": {
//         "value": "5559011167",
//         "confidence": 98.14453125,
//         "page": 2,
//         "boundingBox": {
//           "Width": 0.07232551276683807,
//           "Height": 0.00784696638584137,
//           "Left": 0.03924822807312012,
//           "Top": 0.10081548988819122
//         }
//       },
//       "applicantContactEmail": {
//         "value": "rbc@apex.com",
//         "confidence": 99.73957824707031,
//         "page": 2,
//         "boundingBox": {
//           "Width": 0.243317648768425,
//           "Height": 0.011736352927982807,
//           "Left": 0.035642508417367935,
//           "Top": 0.11565883457660675
//         }
//       }
//     },
//     "businessInfo": {
//       "businessType": {
//         "value": "Corporation",
//         "confidence": null,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.07270181179046631,
//           "Height": 0.006114240735769272,
//           "Left": 0.058806516230106354,
//           "Top": 0.7012460231781006
//         }
//       },
//       "SIC": {
//         "value": "9089",
//         "confidence": 100,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.028484849259257317,
//           "Height": 0.008197533898055553,
//           "Left": 0.6258240938186646,
//           "Top": 0.6403419971466064
//         }
//       },
//       "NAICS": {
//         "value": "561730",
//         "confidence": 100,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.043224480003118515,
//           "Height": 0.007958624511957169,
//           "Left": 0.8970849514007568,
//           "Top": 0.0855892151594162
//         }
//       },
//       "yearBusinessStarted": {
//         "value": "04/21/2000",
//         "confidence": 99.90234375,
//         "page": 2,
//         "boundingBox": {
//           "Width": 0.0648278295993805,
//           "Height": 0.00809826422482729,
//           "Left": 0.8639956116676331,
//           "Top": 0.49463263154029846
//         }
//       },
//       "descriptionOfOperations": {
//         "value": "Mowing, tree trimming (under 15 ft), garden design, snow removal; no chemical spraying",
//         "confidence": 99.86572265625,
//         "page": 2,
//         "boundingBox": {
//           "Width": 0.5098302364349365,
//           "Height": 0.010293067432940006,
//           "Left": 0.039927978068590164,
//           "Top": 0.5246456861495972
//         }
//       },
//       "numberOfMembers": {
//         "value": "5",
//         "confidence": 99.84375,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.06385955959558487,
//           "Height": 0.008060143329203129,
//           "Left": 0.8675928115844727,
//           "Top": 0.0551743283867836
//         }
//       }
//     },
//     "policyInformation": {
//       "proposedEffectiveDate": {
//         "value": "01/01/2025",
//         "confidence": 99.54426574707031,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.06536129862070084,
//           "Height": 0.00824124924838543,
//           "Left": 0.05297785624861717,
//           "Top": 0.5853658318519592
//         }
//       },
//       "proposedExpirationDate": {
//         "value": "12/31/2025",
//         "confidence": 99.755859375,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.06420950591564178,
//           "Height": 0.008164842613041401,
//           "Left": 0.16847826540470123,
//           "Top": 0.5853462219238281
//         }
//       },
//       "carrier": {
//         "value": "AIG Insurance",
//         "confidence": 99.951171875,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.08343169838190079,
//           "Height": 0.00811728835105896,
//           "Left": 0.5095629096031189,
//           "Top": 0.08542405068874359
//         }
//       },
//       "naicCode": {
//         "value": "561730",
//         "confidence": 99.4140625,
//         "page": 1,
//         "boundingBox": {
//           "Width": 0.043224480003118515,
//           "Height": 0.007958624511957169,
//           "Left": 0.8970849514007568,
//           "Top": 0.0855892151594162
//         }
//       }
//     },
//     "premises": [
//       {
//         "locationNumber": {
//           "value": "1",
//           "confidence": 96.9970703125,
//           "page": 2,
//           "boundingBox": {
//             "Width": 0.2095593959093094,
//             "Height": 0.010597524233162403,
//             "Left": 0.5149708986282349,
//             "Top": 0.03254660218954086
//           }
//         },
//         "street": {
//           "value": "371 7th Ave",
//           "confidence": 99.951171875,
//           "page": 2,
//           "boundingBox": {
//             "Width": 0.11940223723649979,
//             "Height": 0.007987885735929012,
//             "Left": 0.08247337490320206,
//             "Top": 0.16137860715389252
//           }
//         },
//         "city": {
//           "value": "New York",
//           "confidence": 99.951171875,
//           "page": 2,
//           "boundingBox": {
//             "Width": 0.09499210864305496,
//             "Height": 0.008167034015059471,
//             "Left": 0.08251040428876877,
//             "Top": 0.19157397747039795
//           }
//         },
//         "state": {
//           "value": "NY",
//           "confidence": 99.853515625,
//           "page": 2,
//           "boundingBox": {
//             "Width": 0.06757193058729172,
//             "Height": 0.008141457103192806,
//             "Left": 0.3295120298862457,
//             "Top": 0.19157494604587555
//           }
//         },
//         "zipCode": {
//           "value": "10001",
//           "confidence": 98.046875,
//           "page": 2,
//           "boundingBox": {
//             "Width": 0.05437633395195007,
//             "Height": 0.007816720753908157,
//             "Left": 0.329254686832428,
//             "Top": 0.20704716444015503
//           }
//         },
//         "county": {
//           "value": "New York",
//           "confidence": 100,
//           "page": 2,
//           "boundingBox": {
//             "Width": 0.09499210864305496,
//             "Height": 0.008167034015059471,
//             "Left": 0.08251040428876877,
//             "Top": 0.19157397747039795
//           }
//         }
//       }
//     ]
//   }
// };

// const AcordDocumentViewer: React.FC = () => {
//   const [selectedField, setSelectedField] = useState<SelectedField | null>(null);
//   const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
//     agency: true,
//     applicant: true,
//     businessInfo: false,
//     policyInformation: false,
//     premises: false
//   });
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [numPages, setNumPages] = useState<number>(0);
//   const [zoom, setZoom] = useState(1);
//   const [pageWidth, setPageWidth] = useState(0);
//   const [pageHeight, setPageHeight] = useState(0);
//   const pageRef = useRef<HTMLDivElement>(null);

//   const toggleSection = (section: string) => {
//     setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
//   };

//   const handleFieldClick = (field: ExtractedValue, label: string) => {
//     if (field.boundingBox) {
//       setSelectedField({
//         value: field.value,
//         confidence: field.confidence,
//         page: field.page,
//         boundingBox: field.boundingBox,
//         label
//       });
//       setCurrentPage(field.page);
//     }
//   };

//   const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
//     setNumPages(numPages);
//   };

//   const onPageLoadSuccess = (page: any) => {
//     setPageWidth(page.width);
//     setPageHeight(page.height);
//   };

//   const getConfidenceColor = (confidence: number | null) => {
//     if (!confidence) return 'text-gray-500';
//     if (confidence >= 99) return 'text-green-600';
//     if (confidence >= 95) return 'text-yellow-600';
//     return 'text-red-600';
//   };

//   const formatFieldName = (name: string) => {
//     return name
//       .replace(/([A-Z])/g, ' $1')
//       .replace(/^./, str => str.toUpperCase())
//       .trim();
//   };

//   const FieldItem: React.FC<{ 
//     field: ExtractedValue; 
//     label: string;
//     isSelected: boolean;
//   }> = ({ field, label, isSelected }) => (
//     <div
//       onClick={() => handleFieldClick(field, label)}
//       className={`flex justify-between items-start p-3 rounded-lg transition-all ${
//         isSelected 
//           ? 'bg-blue-50 border-2 border-blue-500' 
//           : 'hover:bg-gray-50 border-2 border-transparent'
//       } ${field.boundingBox ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
//     >
//       <div className="flex-1">
//         <div className="text-xs text-gray-500 mb-1">{formatFieldName(label)}</div>
//         <div className="text-sm font-medium text-gray-900 break-words">{field.value}</div>
//       </div>
//       <div className="flex flex-col items-end gap-1 ml-2">
//         {field.confidence !== null && (
//           <span className={`text-xs font-semibold ${getConfidenceColor(field.confidence)}`}>
//             {field.confidence.toFixed(1)}%
//           </span>
//         )}
//         {field.boundingBox && (
//           <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
//             Page {field.page}
//           </span>
//         )}
//       </div>
//     </div>
//   );

//   const SectionHeader: React.FC<{ title: string; section: string }> = ({ title, section }) => (
//     <button
//       onClick={() => toggleSection(section)}
//       className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg mb-2"
//     >
//       <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
//       {expandedSections[section] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
//     </button>
//   );

//   const renderSection = (sectionName: string, data: any, parentKey = '') => {
//     const isSelected = (field: any) => 
//       selectedField?.value === field.value && 
//       selectedField?.page === field.page &&
//       selectedField?.boundingBox?.Left === field.boundingBox?.Left;

//     if (Array.isArray(data)) {
//       return data.map((item, idx) => (
//         <div key={idx} className="mb-3 border-l-2 border-blue-200 pl-3">
//           <div className="text-xs font-semibold text-blue-600 mb-2">Item {idx + 1}</div>
//           {Object.entries(item).map(([key, value]: [string, any]) => {
//             if (value && typeof value === 'object' && 'value' in value) {
//               return (
//                 <FieldItem
//                   key={key}
//                   field={value}
//                   label={`${parentKey} ${idx + 1} - ${key}`}
//                   isSelected={isSelected(value)}
//                 />
//               );
//             }
//             return null;
//           })}
//         </div>
//       ));
//     }

//     return Object.entries(data).map(([key, value]: [string, any]) => {
//       if (value && typeof value === 'object' && 'value' in value) {
//         return (
//           <FieldItem
//             key={key}
//             field={value}
//             label={key}
//             isSelected={isSelected(value)}
//           />
//         );
//       }
//       return null;
//     });
//   };

//   // Calculate bounding box position
//   const getBoundingBoxStyle = () => {
//     if (!selectedField?.boundingBox || !pageWidth || !pageHeight) return null;

//     const box = selectedField.boundingBox;
//     const scaledWidth = pageWidth * zoom;
//     const scaledHeight = pageHeight * zoom;

//     return {
//       left: `${box.Left * 100}%`,
//       top: `${box.Top * 100}%`,
//       width: `${box.Width * 100}%`,
//       height: `${box.Height * 100}%`,
//       position: 'absolute' as const,
//       border: '3px solid #3B82F6',
//       backgroundColor: 'rgba(59, 130, 246, 0.2)',
//       pointerEvents: 'none' as const,
//       zIndex: 10,
//       boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
//     };
//   };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Left Panel - JSON Data */}
//       <div className="w-1/2 border-r border-gray-200 bg-white overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="p-4 border-b border-gray-200">
//           <div className="flex items-center justify-between mb-3">
//             <div className="flex items-center gap-2">
//               <FileText className="text-white" size={24} />
//               <h1 className="text-xl font-bold text-black">ACORD 125</h1>
//             </div>
//             <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">
//               Document Extraction
//             </span>
//           </div>  
//         </div>

//         {/* Scrollable Content */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-4">
//           {/* Agency Section */}
//           <div>
//             <SectionHeader title="Agency Information" section="agency" />
//             {expandedSections.agency && (
//               <div className="space-y-2">
//                 {renderSection('agency', acordData.sections.agency)}
//               </div>
//             )}
//           </div>

//           {/* Applicant Section */}
//           <div>
//             <SectionHeader title="Applicant Information" section="applicant" />
//             {expandedSections.applicant && (
//               <div className="space-y-2">
//                 {renderSection('applicant', acordData.sections.applicant)}
//               </div>
//             )}
//           </div>

//           {/* Business Info Section */}
//           <div>
//             <SectionHeader title="Business Information" section="businessInfo" />
//             {expandedSections.businessInfo && (
//               <div className="space-y-2">
//                 {renderSection('businessInfo', acordData.sections.businessInfo)}
//               </div>
//             )}
//           </div>

//           {/* Policy Information Section */}
//           <div>
//             <SectionHeader title="Policy Information" section="policyInformation" />
//             {expandedSections.policyInformation && (
//               <div className="space-y-2">
//                 {renderSection('policyInformation', acordData.sections.policyInformation)}
//               </div>
//             )}
//           </div>

//           {/* Premises Section */}
//           <div>
//             <SectionHeader title="Premises / Locations" section="premises" />
//             {expandedSections.premises && (
//               <div className="space-y-2">
//                 {renderSection('premises', acordData.sections.premises, 'Location')}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Right Panel - PDF Viewer */}
//       <div className="w-1/2 bg-gray-100 flex flex-col">
//         {/* PDF Controls */}
//         <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <span className="text-sm font-medium text-gray-700">
//               Page {currentPage} {numPages > 0 && `of ${numPages}`}
//             </span>
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//                 disabled={currentPage === 1}
//                 className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition"
//               >
//                 Previous
//               </button>
//               <button
//                 onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
//                 disabled={currentPage === numPages}
//                 className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition"
//               >
//                 Next
//               </button>
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
//               className="p-2 hover:bg-gray-100 rounded transition"
//               title="Zoom Out"
//             >
//               <ZoomOut size={18} />
//             </button>
//             <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
//               {Math.round(zoom * 100)}%
//             </span>
//             <button
//               onClick={() => setZoom(Math.min(2, zoom + 0.1))}
//               className="p-2 hover:bg-gray-100 rounded transition"
//               title="Zoom In"
//             >
//               <ZoomIn size={18} />
//             </button>
//           </div>
//         </div>

//         {/* Selected Field Info */}
//         {selectedField && (
//           <div className="p-4 bg-blue-50 border-b border-blue-200">
//             <div className="flex items-start justify-between">
//               <div>
//                 <div className="text-xs font-semibold text-blue-600 mb-1">
//                   {formatFieldName(selectedField.label)}
//                 </div>
//                 <div className="text-sm font-medium text-gray-900">{selectedField.value}</div>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className={`text-xs font-semibold ${getConfidenceColor(selectedField.confidence)}`}>
//                   Confidence: {selectedField.confidence.toFixed(1)}%
//                 </span>
//                 <button
//                   onClick={() => setSelectedField(null)}
//                   className="text-blue-600 hover:text-blue-800 text-sm font-medium"
//                 >
//                   Clear
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* PDF Viewer Area */}
//         <div className="flex-1 overflow-auto p-8 flex items-start justify-center bg-gray-200">
//           <div className="bg-white shadow-2xl">
//             <Document
//               file={acordPdf}
//               onLoadSuccess={onDocumentLoadSuccess}
//               loading={
//                 <div className="flex items-center justify-center p-20">
//                   <div className="flex flex-col items-center gap-3">
//                     <Loader className="animate-spin text-blue-600" size={40} />
//                     <p className="text-sm text-gray-600">Loading PDF...</p>
//                   </div>
//                 </div>
//               }
//               error={
//                 <div className="flex items-center justify-center p-20">
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
//                     <p className="text-sm text-red-600">Failed to load PDF document.</p>
//                     <p className="text-xs text-red-500 mt-2">Please check if the file exists at the correct path.</p>
//                   </div>
//                 </div>
//               }
//               onLoadError={(err) => console.error('PDF load error:', err)}
//             >
//               <div ref={pageRef} className="relative">
//                 <Page
//                   pageNumber={currentPage}
//                   scale={zoom}
//                   onLoadSuccess={onPageLoadSuccess}
//                   renderTextLayer={false}
//                   renderAnnotationLayer={false}
//                 />
                
//                 {/* Bounding Box Overlay */}
//                 {selectedField && 
//                  selectedField.page === currentPage && 
//                  selectedField.boundingBox && 
//                  getBoundingBoxStyle() && (
//                   <div style={getBoundingBoxStyle()!} />
//                 )}
//               </div>
//             </Document>

//             {!selectedField && numPages > 0 && (
//               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//                 <div className="bg-white px-6 py-3 rounded-lg shadow-lg border-2 border-blue-200">
//                   <p className="text-sm text-gray-600">👈 Click a field on the left to highlight it here</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AcordDocumentViewer;