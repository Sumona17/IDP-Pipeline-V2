import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getValidateData } from '../../services/file-validate-service';

interface BoundingBox {
  Left: number;
  Top: number;
  Width: number;
  Height: number;
}

interface TableRow {
  key: string;
  section?: string;
  field: string;
  fieldPath?: string;
  value: string;
  confidence: number | null;
  confidencePercent: string;
  boundingBox: BoundingBox | null;
  page: number;
  review: boolean;
  overrideValue: string;
  isSection?: boolean;
}

interface RowEdit {
  review: boolean;
  overrideValue: string;
}

const DocumentComparison: React.FC = () => {
  const { submissionId, documentId, extractedDataKey: encodedDataKey, originalFileKey: encodedFileKey } = useParams<{ submissionId: string; documentId: string; extractedDataKey: string; originalFileKey: string }>();

  const extractedDataKey = decodeURIComponent(encodedDataKey ?? '');
  const originalFileKey  = decodeURIComponent(encodedFileKey ?? '');

  console.log("documentId::", documentId);
  

  const [apiResponse, setApiResponse]             = useState<any>(null);
  const [encodedPdfData, setEncodedPdfData]       = useState<string>('');
  const [selectedField, setSelectedField]         = useState<TableRow | null>(null);
  const [currentPage, setCurrentPage]             = useState<number>(1);
  const [totalPages, setTotalPages]               = useState<number>(0);
  const [zoom, setZoom]                           = useState<number>(1);
  const [baseScale, setBaseScale]                 = useState<number>(1);
  const [searchText, setSearchText]               = useState('');
  const [confidenceFilter, setConfidenceFilter]   = useState('all');
  const [rowEdits, setRowEdits]                   = useState<Record<string, RowEdit>>({});
  const [renderedPages, setRenderedPages]         = useState<Record<number, any>>({});
  const [naturalPageSize, setNaturalPageSize]     = useState({ width: 0, height: 0 });
  const [highlightBox, setHighlightBox]           = useState<any>(null);
  const [isPdfLoading, setIsPdfLoading]           = useState(false);
  const [isDataLoading, setIsDataLoading]         = useState(true);
  const [pdfError, setPdfError]                   = useState<string>('');
  const [dataError, setDataError]                 = useState<string>('');

  const containerRef      = useRef<HTMLDivElement>(null);
  const pdfScrollRef      = useRef<HTMLDivElement>(null);
  const pdfDocRef         = useRef<any>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const renderTasksRef    = useRef<Record<number, any>>({});
  const pdfjsRef          = useRef<any>(null);

  const DPI_SCALE            = 2;
  const CONFIDENCE_THRESHOLD = 70;

  const formatConfidenceScore = (score: number | null): string => {
    if (score === null || score === undefined) return '-';
    return Math.round(score).toString();
  };

  const getConfidenceColor = (confidence: number | null): string => {
    if (confidence === null) return 'text-gray-600';
    if (confidence >= 95) return 'text-emerald-600';
    if (confidence >= CONFIDENCE_THRESHOLD) return 'text-amber-600';
    return 'text-red-600';
  };

  const getConfidenceBg = (confidence: number | null): string => {
    if (confidence === null) return 'bg-white';
    if (confidence >= 95) return 'bg-white';
    if (confidence >= CONFIDENCE_THRESHOLD) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const getHighlightColor = (confidenceScore: number | null): string => {
    const score = Number(confidenceScore);
    if (!score || score < CONFIDENCE_THRESHOLD) return '#EF4444';
    return '#3C20F6';
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const flattenData = (data: any): TableRow[] => {
    const rows: TableRow[] = [];
    const sections = data?.extractedData?.sections ?? data?.sections ?? {};

    const processSection = (sectionName: string, sectionData: any, page: number) => {
      if (Array.isArray(sectionData)) {
        sectionData.forEach((item, index) => {
          Object.entries(item).forEach(([key, value]: [string, any]) => {
            if (value && typeof value === 'object' && 'value' in value) {
              rows.push({
                key: `${page}-${sectionName}-${key}-${index}`,
                section: sectionName,
                field: formatLabel(key),
                fieldPath: key,
                value: String(value.value),
                confidence: value.confidence ?? null,
                confidencePercent: formatConfidenceScore(value.confidence),
                boundingBox: value.boundingBox || null,
                page: value.page || page,
                review: false,
                overrideValue: '',
              });
            }
          });
        });
      } else if (typeof sectionData === 'object') {
        Object.entries(sectionData).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object' && 'value' in value) {
            rows.push({
              key: `${page}-${sectionName}-${key}`,
              section: sectionName,
              field: formatLabel(key),
              fieldPath: key,
              value: String(value.value),
              confidence: value.confidence ?? null,
              confidencePercent: formatConfidenceScore(value.confidence),
              boundingBox: value.boundingBox || null,
              page: value.page || page,
              review: false,
              overrideValue: '',
            });
          }
        });
      }
    };

    Object.entries(sections).forEach(([sectionName, sectionData]) => {
      rows.push({
        key: `section-${sectionName}`,
        field: sectionName.replace(/_/g, ' ').toUpperCase(),
        value: '',
        confidence: null,
        confidencePercent: '-',
        boundingBox: null,
        page: 1,
        review: false,
        overrideValue: '',
        isSection: true,
      });
      processSection(sectionName, sectionData, 1);
    });

    return rows;
  };

  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  useEffect(() => {
    const loadData = async () => {
      setIsDataLoading(true);
      setDataError('');
      try {
        const data = await getValidateData({ submissionId, documentId, extractedDataKey, originalFileKey }) as any;
        setApiResponse(data);
        if (data?.encodedPdfData) setEncodedPdfData(data.encodedPdfData);
      } catch (error) {
        setDataError(error instanceof Error ? error.message : 'Failed to load extracted data');
      } finally {
        setIsDataLoading(false);
      }
    };
    if (extractedDataKey && originalFileKey) loadData();
  }, [extractedDataKey, originalFileKey]);

  useEffect(() => {
    if (!encodedPdfData) return;
    const loadPdf = async () => {
      setIsPdfLoading(true);
      setPdfError('');
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
        pdfjsRef.current = pdfjs;
        const pdfBytes = base64ToUint8Array(encodedPdfData);
        const loadingTask = pdfjs.getDocument({ data: pdfBytes, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true });
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        const page = await pdf.getPage(1);
        const naturalWidth  = page.view[2];
        const naturalHeight = page.view[3];
        setNaturalPageSize({ width: naturalWidth, height: naturalHeight });
        const container = containerRef.current;
        if (container) {
          const { width: clientWidth } = container.getBoundingClientRect();
          setBaseScale((clientWidth - 40) / naturalWidth);
        }
      } catch (error: any) {
        setPdfError(error.name === 'InvalidPDFException' ? 'Invalid PDF file' : error.message || 'Unknown error loading PDF');
      } finally {
        setIsPdfLoading(false);
      }
    };
    loadPdf();
  }, [encodedPdfData]);

  const renderAllPDFPages = async () => {
    if (!pdfDocRef.current || !containerRef.current) return;
    Object.values(renderTasksRef.current).forEach((task: any) => { if (task?.cancel) task.cancel(); });
    renderTasksRef.current = {};
    try {
      const currentScale = baseScale * zoom;
      const newRenderedPages: Record<number, any> = {};
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page     = await pdfDocRef.current.getPage(pageNum);
        const canvas   = document.createElement('canvas');
        const context  = canvas.getContext('2d', { alpha: false });
        const viewport = page.getViewport({ scale: currentScale * DPI_SCALE });
        canvas.height = viewport.height;
        canvas.width  = viewport.width;
        context!.fillStyle = 'white';
        context!.fillRect(0, 0, canvas.width, canvas.height);
        const displayWidth  = viewport.width  / DPI_SCALE;
        const displayHeight = viewport.height / DPI_SCALE;
        canvas.style.width           = `${displayWidth}px`;
        canvas.style.height          = `${displayHeight}px`;
        canvas.style.display         = 'block';
        canvas.style.marginBottom    = '16px';
        canvas.style.border          = '1px solid #E5E7EB';
        canvas.style.boxShadow       = '0 4px 6px -1px rgba(0,0,0,0.1)';
        canvas.style.backgroundColor = 'white';
        canvas.style.borderRadius    = '8px';
        const renderTask = page.render({ canvasContext: context!, viewport });
        renderTasksRef.current[pageNum] = renderTask;
        try {
          await renderTask.promise;
          newRenderedPages[pageNum] = { canvas, viewport, pageHeight: displayHeight, pageWidth: displayWidth, displayScale: currentScale };
        } catch (err: any) {
          if (err.name !== 'RenderingCancelledException') console.error('Rendering error:', err);
        }
      }
      setRenderedPages(newRenderedPages);
    } catch (error) {
      console.error('Error rendering PDF:', error);
    }
  };

  useEffect(() => {
    if (baseScale && pdfDocRef.current && totalPages > 0) {
      const timeoutId = setTimeout(() => renderAllPDFPages(), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [zoom, baseScale, totalPages]);

  useEffect(() => {
    if (pagesContainerRef.current && Object.keys(renderedPages).length > 0) {
      pagesContainerRef.current.innerHTML = '';
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageData = renderedPages[pageNum];
        if (pageData) pagesContainerRef.current.appendChild(pageData.canvas);
      }
    }
  }, [renderedPages, totalPages]);

  const handleRowClick = (record: TableRow) => {
    if (record.isSection) return;
    setSelectedField(record);
    if (record.boundingBox && record.page) {
      setHighlightBox({ ...record.boundingBox, page: record.page, confidenceScore: getHighlightColor(record.confidence) });
      setCurrentPage(record.page);
      setTimeout(() => scrollToHighlight(record.boundingBox!, record.page), 200);
    } else {
      setHighlightBox(null);
    }
  };

  const scrollToHighlight = (bbox: BoundingBox, targetPage: number) => {
    if (!pdfScrollRef.current || !renderedPages[targetPage]) return;
    const currentScale = baseScale * zoom;
    let cumulativeHeight = 0;
    for (let i = 1; i < targetPage; i++) {
      const prev = renderedPages[i];
      if (prev) cumulativeHeight += prev.pageHeight + 16;
    }
    const canvasHeight       = naturalPageSize.height * currentScale;
    const top                = bbox.Top    * canvasHeight;
    const boxHeight          = bbox.Height * canvasHeight;
    const absoluteHighlightY = cumulativeHeight + top + boxHeight / 2;
    const containerHeight    = pdfScrollRef.current.getBoundingClientRect().height;
    pdfScrollRef.current.scrollTo({ top: Math.max(0, absoluteHighlightY - containerHeight / 2), behavior: 'smooth' });
  };

  const renderHighlightBox = () => {
    if (!highlightBox || Object.keys(renderedPages).length === 0 || !highlightBox.page) return null;
    const targetPage = highlightBox.page;
    const pageData   = renderedPages[targetPage];
    if (!pageData) return null;
    let cumulativeHeight = 0;
    for (let i = 1; i < targetPage; i++) {
      const prev = renderedPages[i];
      if (prev) cumulativeHeight += prev.pageHeight + 16;
    }
    const currentScale = baseScale * zoom;
    const canvasWidth  = naturalPageSize.width  * currentScale;
    const canvasHeight = naturalPageSize.height * currentScale;
    const left         = highlightBox.Left   * canvasWidth;
    const top          = highlightBox.Top    * canvasHeight;
    const boxWidth     = highlightBox.Width  * canvasWidth;
    const boxHeight    = highlightBox.Height * canvasHeight;
    const absoluteTop  = cumulativeHeight + top;
    const borderColor  = highlightBox.confidenceScore;
    return (
      <div
        className="absolute pointer-events-none border-[3px] transition-all rounded"
        style={{ left: `${left - 4}px`, top: `${absoluteTop - 4}px`, width: `${boxWidth + 8}px`, height: `${boxHeight + 8}px`, borderColor, backgroundColor: `${borderColor}20`, zIndex: 30 }}
      >
        {selectedField && (
          <div className="absolute -top-9 left-0 bg-[#3C20F6] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {selectedField.field}
            </span>
          </div>
        )}
      </div>
    );
  };

  const handleReviewChange = (checked: boolean, record: TableRow) => {
    setRowEdits((prev) => ({
      ...prev,
      [record.key]: { review: checked, overrideValue: prev[record.key]?.overrideValue || record.value || '' },
    }));
  };

  const handleOverrideChange = (value: string, record: TableRow) => {
    setRowEdits((prev) => ({ ...prev, [record.key]: { review: true, overrideValue: value } }));
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(apiResponse?.extractedData ?? apiResponse, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'extracted-data.json'; link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!encodedPdfData) return;
    const bytes = base64ToUint8Array(encodedPdfData);
    const blob  = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url   = URL.createObjectURL(blob);
    const link  = document.createElement('a');
    link.href = url; link.download = 'document.pdf'; link.click();
    URL.revokeObjectURL(url);
  };

  const buildTableRows  = (): TableRow[] => (!apiResponse ? [] : flattenData(apiResponse));

  const getFilteredRows = (): TableRow[] => {
    const allRows = buildTableRows();
    return allRows.filter((row) => {
      const searchLower   = searchText.toLowerCase();
      const matchesSearch = !searchText || row.field.toLowerCase().includes(searchLower) || row.value.toLowerCase().includes(searchLower);
      if (row.isSection) return matchesSearch;
      const score = row.confidence;
      let matchesConfidence = true;
      if (confidenceFilter !== 'all' && score !== null) {
        switch (confidenceFilter) {
          case 'below_50': matchesConfidence = score < 50; break;
          case '50_75':    matchesConfidence = score >= 50 && score < 75; break;
          case '75_80':    matchesConfidence = score >= 75 && score < 80; break;
          case '80_85':    matchesConfidence = score >= 80 && score < 85; break;
          case '85_90':    matchesConfidence = score >= 85 && score < 90; break;
          case '90_above': matchesConfidence = score >= 90; break;
        }
      }
      return matchesSearch && matchesConfidence;
    });
  };

  const filteredRows = getFilteredRows();

  if (isPdfLoading || isDataLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3C20F6] mx-auto mb-5" />
          <p className="text-lg font-semibold text-gray-800 mb-1">Loading Document Review</p>
          <p className="text-sm text-gray-400">Please wait while we prepare your document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E6DAFF] rounded-xl">
              <svg className="w-5 h-5 text-[#3C20F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[18px] font-semibold text-gray-900">Document Review</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {apiResponse?.extractedData?.documentType ?? 'Review and validate extracted document data'}
              </p>
            </div>
          </div>

          {/* Center: errors */}
          <div className="flex flex-col gap-1">
            {dataError && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">⚠️ Data: {dataError}</p>
            )}
            {pdfError && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">⚠️ PDF: {pdfError}</p>
            )}
          </div>

          {/* Right: export */}
          <button
            onClick={handleExportData}
            className="border border-[#3C20F6] text-[#3C20F6] bg-[#E6DAFF] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#d4c5ff] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12" />
            </svg>
            Export Data
          </button>
        </div>
      </div>

      {/* ── Main panels ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">

        {/* ── Left: data table ─────────────────────────────── */}
        <div className="w-[45%] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">

          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
                className="pl-3 pr-8 py-2 text-xs font-medium border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#3C20F6] focus:border-transparent bg-white appearance-none cursor-pointer outline-none"
              >
                <option value="all">All Confidence %</option>
                <option value="below_50">Below 50%</option>
                <option value="50_75">50% – 75%</option>
                <option value="75_80">75% – 80%</option>
                <option value="80_85">80% – 85%</option>
                <option value="85_90">85% – 90%</option>
                <option value="90_above">90% & Above</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search extracted data..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#3C20F6] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#E6DAFF] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#3C20F6] border-b border-[#d4c5ff] w-[20%]">Document Provision</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#3C20F6] border-b border-[#d4c5ff] w-[20%]">Extracted Value</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#3C20F6] border-b border-[#d4c5ff] w-[10%]">Confidence</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#3C20F6] border-b border-[#d4c5ff] w-[8%]">Review</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#3C20F6] border-b border-[#d4c5ff] w-[22%]">Override Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredRows.map((record) => {
                  if (record.isSection) {
                    return (
                      <tr key={record.key} className="bg-gray-50">
                        <td colSpan={5} className="px-4 py-2.5 font-semibold text-[#3C20F6] text-xs border-l-4 border-[#3C20F6]">
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {record.field}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const editState     = rowEdits[record.key];
                  const isReviewed    = editState?.review || false;
                  const overrideValue = editState?.overrideValue || record.value;

                  return (
                    <tr
                      key={record.key}
                      onClick={() => handleRowClick(record)}
                      className={`cursor-pointer transition-all duration-150 ${getConfidenceBg(record.confidence)} ${
                        selectedField?.key === record.key
                          ? 'bg-[#E6DAFF] border-l-4 border-l-[#3C20F6]'
                          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-3 text-xs font-medium text-gray-900">{record.field}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{record.value}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getConfidenceColor(record.confidence)} ${
                          record.confidence !== null && record.confidence >= 95 ? 'bg-emerald-100' :
                          record.confidence !== null && record.confidence >= CONFIDENCE_THRESHOLD ? 'bg-amber-100' :
                          record.confidence !== null ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {record.confidencePercent !== '-' ? `${record.confidencePercent}%` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isReviewed}
                          onChange={(e) => handleReviewChange(e.target.checked, record)}
                          className="w-4 h-4 text-[#3C20F6] rounded border-2 border-gray-300 focus:ring-2 focus:ring-[#3C20F6] focus:ring-offset-1 cursor-pointer accent-[#3C20F6]"
                        />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          disabled={!isReviewed}
                          value={overrideValue}
                          onChange={(e) => handleOverrideChange(e.target.value, record)}
                          placeholder="Override value"
                          className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#3C20F6] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed outline-none transition-colors"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: PDF viewer ────────────────────────────── */}
        <div className="w-[55%] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">

          {/* PDF toolbar */}
          <div className="border-b border-gray-100 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#3C20F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Document
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Total Pages: {totalPages}</p>
              </div>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-xs">
              <div className="flex items-center gap-1 font-semibold text-gray-700">
                <span className="px-2 py-0.5 bg-[#E6DAFF] text-[#3C20F6] rounded-full text-xs font-medium">
                  {String(currentPage).padStart(2, '0')}
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">{String(totalPages).padStart(2, '0')}</span>
              </div>

              <div className="flex-1 flex items-center gap-2">
                <button
                  onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.25))}
                  disabled={zoom <= 0.25}
                  className="p-1 rounded border border-[#3C20F6] text-[#3C20F6] hover:bg-[#E6DAFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>

                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="range" min="0.25" max="4" step="0.25" value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-28 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3C20F6]"
                  />
                  <span className="text-xs font-semibold text-gray-700 min-w-[40px] text-center px-1.5 py-0.5 bg-white border border-gray-200 rounded">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <button
                  onClick={() => setZoom((prev) => Math.min(prev + 0.25, 4))}
                  disabled={zoom >= 4}
                  className="p-1 rounded border border-[#3C20F6] text-[#3C20F6] hover:bg-[#E6DAFF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleDownloadPdf}
                disabled={!encodedPdfData}
                className="border border-[#3C20F6] text-[#3C20F6] bg-[#E6DAFF] px-3 py-1 rounded-full text-xs font-medium hover:bg-[#d4c5ff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>

          {/* PDF canvas */}
          <div ref={pdfScrollRef} className="flex-1 overflow-auto p-4 bg-gray-50">
            <div ref={containerRef} className="relative">
              <div ref={pagesContainerRef} className="relative" />
              {renderHighlightBox()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentComparison;