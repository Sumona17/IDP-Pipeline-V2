/* ═══════════════════════════════════════════════════════════════════════════
   N-LEVEL RECURSIVE DOCUMENT VIEWER  —  DocumentViewer.tsx
   Single-file React + TypeScript component combining index.html + script.ts
═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useState } from 'react';
import "../styles/DocumentViewer.scss";

/* ─── Types ───────────────────────────────────────────────────────────────── */

type JsonPrimitive = string | number | boolean | null | undefined;
type JsonValue     = JsonPrimitive | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue; }
type JsonArray = JsonValue[];

interface DocumentData extends JsonObject {
  sections: PageSection[];
}

interface PageSection extends JsonObject {
  page?:         number | string;
  Page?:         number | string;
  documentType?: string;
  DocumentType?: string;
}

interface TableParts {
  table: HTMLTableElement;
  tbody: HTMLTableSectionElement;
}

type SubsectionEntry  = [string, JsonValue, number, string];
type PrimitiveChild   = [string, string];
type ContainerChild   = [string, JsonValue];
type TypeHint         = 'object' | 'array' | 'page';

type ExtendedTR = HTMLTableRowElement & { _childTr?: HTMLTableRowElement };


/* ─── Keys treated as metadata (hidden from display) ─────────────────────── */
const META = new Set<string>([
  'line', 'Line',
  'bounding_box', 'Bounding Box',
  'confidence_score', 'Confidence Score',
  'top', 'left', 'width', 'height', 'Size', 'Page' , 'page'
]);

const PAGE_LABEL_KEYS = new Set<string>([
  'page', 'documentType', 'Page', 'DocumentType',
]);


/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function findKey(obj: JsonObject, name: string): string | undefined {
  return Object.keys(obj).find(k => k.toLowerCase() === name.toLowerCase());
}

function isPrimitive(v: JsonValue): v is JsonPrimitive {
  return v === null || v === undefined || typeof v !== 'object';
}

function rawDisplay(val: JsonValue): string {
  if (val === undefined) return '';
  if (val === null)      return String(null);
  return String(val as JsonPrimitive);
}

function extractLeafValue(obj: JsonObject): string {
  const vk = findKey(obj, 'value');
  const ck = findKey(obj, 'checked');
  if (vk !== undefined) return rawDisplay(obj[vk]);
  if (ck !== undefined) return rawDisplay(obj[ck]);
  return '';
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}


/* ─── Dynamic page-heading builder ───────────────────────────────────────── */

function buildPageHeading(section: PageSection): string {
  const parts: string[] = [];
  const pageNum = section.page ?? section.Page;
  if (pageNum !== undefined) parts.push('Page ' + pageNum);

  const descriptors: string[] = [
    'documentType', 'DocumentType', 'document_type',
    'title', 'Title', 'name', 'Name',
    'section', 'Section', 'formName', 'form_name',
  ];

  descriptors.forEach(k => {
    const v = (section as JsonObject)[k];
    if (v && !parts.includes(String(v))) parts.push(String(v));
  });

  return parts.join('  —  ') || 'Section';
}


/* ─── DOM helpers (imperative, same as original) ─────────────────────────── */

function makeTable(columns: string[]): TableParts {
  const table  = document.createElement('table');
  const thead  = document.createElement('thead');
  const headTr = document.createElement('tr');

  columns.forEach(col => {
    const th       = document.createElement('th');
    th.textContent = col;
    headTr.appendChild(th);
  });

  thead.appendChild(headTr);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  return { table, tbody };
}

function makeRow(cellValues: string[]): HTMLTableRowElement {
  const tr = document.createElement('tr');
  cellValues.forEach(v => {
    const td       = document.createElement('td');
    td.textContent = v;
    tr.appendChild(td);
  });
  return tr;
}

function collectArrayColumns(arr: JsonArray): string[] {
  const seen = new Set<string>();
  arr.forEach(item => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.keys(item as JsonObject).forEach(k => {
        if (!META.has(k)) seen.add(k);
      });
    }
  });
  return [...seen];
}


/* ─── Collapsible section builder ────────────────────────────────────────── */

function createSection(
  title:    string,
  depth:    number   = 0,
  typeHint: TypeHint = 'object',
  keyPath:  string   = title,
): HTMLDivElement {
  const div       = document.createElement('div');
  div.className   = 'section depth-' + depth;

  const header      = document.createElement('div');
  header.className  = 'header';
  header.innerHTML  =
    '<span class="arrow">▶</span><span>' + esc(title) + '</span>';

  const content     = document.createElement('div');
  content.className = 'content';

  header.addEventListener('click', () => {
    const open = content.classList.toggle('open');
    header.classList.toggle('open', open);
  });

  div.appendChild(header);
  div.appendChild(content);
  return div;
}


/* ─── Core: populateContainer (n-level recursive) ────────────────────────── */

function populateContainer(
  container: HTMLElement,
  obj:       JsonValue,
  depth:     number = 0,
  parentKey: string = 'Fields',
): void {
  if (obj === null || obj === undefined) return;

  /* ── Plain array ── */
  if (Array.isArray(obj)) {
    if (!obj.length) return;

    const allObjects = (obj as JsonArray).every(
      item => item && typeof item === 'object' && !Array.isArray(item),
    );

    if (allObjects) {
      const cols = collectArrayColumns(obj as JsonArray);
      if (cols.length > 0) {
        const flatItems = (obj as JsonObject[]).filter(item =>
          cols.every(c => isPrimitive(item[c])),
        );
        if (flatItems.length === obj.length) {
          const { table, tbody } = makeTable(cols);
          flatItems.forEach(item => {
            tbody.appendChild(makeRow(cols.map(c => rawDisplay(item[c]))));
          });
          container.appendChild(table);
          return;
        }
      }
    }

    (obj as JsonArray).forEach((item, i) => {
      const o = item as JsonObject | null;
      const itemTitle =
        (o && (o.name || o.Name || o.title || o.Title ||
               o.id   || o.Id   || o.key   || o.Key)) || parentKey;
      const sub = createSection(String(itemTitle), depth, 'array', parentKey + '[' + i + ']');
      container.appendChild(sub);
      populateContainer(
        sub.querySelector('.content') as HTMLElement,
        item, depth + 1, parentKey + '[' + i + ']',
      );
    });
    return;
  }

  /* ── Primitive ── */
  if (typeof obj !== 'object') {
    const p       = document.createElement('p');
    p.className   = 'info-msg';
    p.textContent = rawDisplay(obj as JsonPrimitive);
    container.appendChild(p);
    return;
  }

  /* ── Object ── */
  const { table, tbody } = makeTable([parentKey, 'Value']);
  let   tableHasRows     = false;
  const subsections: SubsectionEntry[] = [];

  Object.entries(obj as JsonObject).forEach(([key, val]) => {
    if (META.has(key)) return;

    if (isPrimitive(val)) {
      tbody.appendChild(makeRow([key, rawDisplay(val)]));
      tableHasRows = true;
      return;
    }

    if (Array.isArray(val)) {
      if ((val as JsonArray).length > 0)
        subsections.push([key, val, depth + 1, parentKey + '.' + key]);
      return;
    }

    const valObj = val as JsonObject;
    const valKey = findKey(valObj, 'value');
    const chkKey = findKey(valObj, 'checked');

    if (valKey !== undefined || chkKey !== undefined) {
      const primitiveChildren: PrimitiveChild[] = [];
      const containerChildren: ContainerChild[] = [];

      Object.entries(valObj).forEach(([k2, v2]) => {
        if (META.has(k2)) return;
        if (k2.toLowerCase() === 'value' || k2.toLowerCase() === 'checked') return;
        if (v2 === null || v2 === undefined) return;

        if (isPrimitive(v2)) {
          primitiveChildren.push([k2, rawDisplay(v2)]);
        } else if (Array.isArray(v2)) {
          if ((v2 as JsonArray).length > 0) containerChildren.push([k2, v2]);
        } else {
          const nested    = v2 as JsonObject;
          const vk2       = findKey(nested, 'value');
          const ck2       = findKey(nested, 'checked');
          const deeperKeys = Object.keys(nested).filter(k =>
            !META.has(k) &&
            k.toLowerCase() !== 'value' &&
            k.toLowerCase() !== 'checked',
          );
          if ((vk2 !== undefined || ck2 !== undefined) && deeperKeys.length === 0) {
            primitiveChildren.push([k2, extractLeafValue(nested)]);
          } else {
            containerChildren.push([k2, v2]);
          }
        }
      });

      const hasExpand = primitiveChildren.length > 0;
      const parentTr  = document.createElement('tr') as ExtendedTR;
      const tdField   = document.createElement('td');
      const tdVal     = document.createElement('td');
      tdVal.textContent = extractLeafValue(valObj);

      if (hasExpand) {
        const arrow       = document.createElement('span');
        arrow.className   = 'row-toggle';
        arrow.textContent = '▶';
        tdField.style.cursor = 'pointer';
        tdField.appendChild(arrow);

        const childTr         = document.createElement('tr');
        childTr.className     = 'child-block';
        childTr.style.display = 'none';
        const childTd         = document.createElement('td');
        childTd.colSpan       = 2;

        const childCols  = primitiveChildren.map(([cf]) => cf);
        const childTable = document.createElement('table');
        childTable.style.cssText = 'width:100%;border-collapse:collapse;';

        const childThead  = document.createElement('thead');
        const childHeadTr = document.createElement('tr');
        childCols.forEach(cf => {
          const th = document.createElement('th');
          th.style.cssText =
            'border:1px solid #c9d8ec;padding:5px 8px;text-align:left;' +
            'background:#e8f0f8;font-size:11px;text-transform:uppercase;letter-spacing:.3px;';
          th.textContent = cf;
          childHeadTr.appendChild(th);
        });
        childThead.appendChild(childHeadTr);
        childTable.appendChild(childThead);

        const childTbody = document.createElement('tbody');
        const dataRow    = document.createElement('tr');
        primitiveChildren.forEach(([, cv]) => {
          const td         = document.createElement('td');
          td.style.cssText = 'border:1px solid #c9d8ec;padding:5px 8px;';
          td.textContent   = cv;
          dataRow.appendChild(td);
        });
        childTbody.appendChild(dataRow);
        childTable.appendChild(childTbody);
        childTd.appendChild(childTable);
        childTr.appendChild(childTd);

        const toggleChild = (): void => {
          const open = childTr.style.display !== 'table-row';
          childTr.style.display = open ? 'table-row' : 'none';
          arrow.classList.toggle('open', open);
          arrow.textContent = open ? '▼' : '▶';
        };

        arrow.addEventListener('click', (e: MouseEvent) => { e.stopPropagation(); toggleChild(); });
        parentTr.addEventListener('click', toggleChild);
        parentTr.style.cursor = 'pointer';
        parentTr._childTr = childTr;
      }

      tdField.appendChild(document.createTextNode(key));
      parentTr.appendChild(tdField);
      parentTr.appendChild(tdVal);
      tbody.appendChild(parentTr);
      if (parentTr._childTr) tbody.appendChild(parentTr._childTr);
      tableHasRows = true;

      containerChildren.forEach(([ck, cv]) => {
        subsections.push([key + ' › ' + ck, cv, depth + 1, parentKey + '.' + key + '.' + ck]);
      });

    } else {
      subsections.push([key, val, depth + 1, parentKey + '.' + key]);
    }
  });

  if (tableHasRows) container.appendChild(table);

  subsections.forEach(([label, val, d, path]) => {
    const typeHint: TypeHint = Array.isArray(val) ? 'array' : 'object';
    const sub = createSection(label, d, typeHint, path);
    container.appendChild(sub);
    populateContainer(sub.querySelector('.content') as HTMLElement, val, d + 1, label);
  });
}


/* ─── renderDocument ─────────────────────────────────────────────────────── */

function renderDocument(
  data:       DocumentData,
  titleEl:    HTMLElement,
  subtitleEl: HTMLElement,
  viewer:     HTMLElement,
): void {
  const titleKey = (
    ['documentType', 'DocumentType', 'document_type', 'title', 'Title', 'name', 'Name']
  ).find(k => data[k]);
  if (titleKey) titleEl.textContent = String(data[titleKey]);

  const subKeys = (
    ['formNumber', 'form_number', 'version', 'Version', 'issuer', 'Issuer', 'category', 'Category']
  )
    .filter(k => data[k])
    .map(k => k + ': ' + data[k]);
  if (subKeys.length) subtitleEl.textContent = subKeys.join('   |   ');

  data.sections.forEach((section: PageSection, idx: number) => {
    const heading  = buildPageHeading(section);
    const pageEl   = createSection(heading, 0, 'page', 'sections[' + idx + ']');
    viewer.appendChild(pageEl);

    const isFirstPage = idx === 0;
    if (isFirstPage) {
      (pageEl.querySelector('.content') as HTMLElement).classList.add('open');
      (pageEl.querySelector('.header')  as HTMLElement).classList.add('open');
    }

    const pageContent = pageEl.querySelector('.content') as HTMLElement;

    Object.entries(section).forEach(([key, val]) => {
      if (PAGE_LABEL_KEYS.has(key)) return;

      if (isPrimitive(val)) {
        const { table, tbody } = makeTable([key, 'Value']);
        tbody.appendChild(makeRow([key, rawDisplay(val)]));
        pageContent.appendChild(table);
        return;
      }

      const typeHint: TypeHint = Array.isArray(val) ? 'array' : 'object';
      const sub = createSection(key, 1, typeHint, 'sections[' + idx + '].' + key);
      pageContent.appendChild(sub);
      populateContainer(sub.querySelector('.content') as HTMLElement, val, 2, key);

      if (isFirstPage) {
        const expandedSubs = pageContent.querySelectorAll(':scope > .section');
        if (expandedSubs.length <= 2) {
          (sub.querySelector('.content') as HTMLElement).classList.add('open');
          (sub.querySelector('.header')  as HTMLElement).classList.add('open');
        }
      }
    });
  });
}


/* ═══════════════════════════════════════════════════════════════════════════
   REACT COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

interface DocumentViewerProps {
  data?: DocumentData;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ data: propData }) => {
  const titleRef    = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const viewerRef   = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const render = (data: DocumentData) => {
      if (
        titleRef.current    &&
        subtitleRef.current &&
        viewerRef.current
      ) {
        // Clear any previously rendered content (guards against React StrictMode double-invoke)
        viewerRef.current.innerHTML      = '';
        titleRef.current.textContent     = 'Loading\u2026';
        subtitleRef.current.textContent  = '';
        renderDocument(data, titleRef.current, subtitleRef.current, viewerRef.current);
      }
    };

    if (propData) {
      render(propData);
    }
  }, [propData]);

  return (
    <div className="dv-wrapper">
      <div id="topbar">
        <div id="docTitle" ref={titleRef}>Loading…</div>
        <div className="subtitle" id="docSubtitle" ref={subtitleRef} />
      </div>

      {error
        ? <p className="error-msg">{error}</p>
        : <div id="viewer" ref={viewerRef} />
      }
    </div>
  );
};

export default DocumentViewer;