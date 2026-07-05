import type {RstCell, RstRow, RstTableModel} from './rstTableParser';

interface MdxAttr {
  type: 'mdxJsxAttribute';
  name: string;
  value: string;
}
export interface MdxElement {
  type: 'mdxJsxFlowElement';
  name: string;
  attributes: MdxAttr[];
  children: any[];
}

function el(name: string, children: any[], attributes: MdxAttr[] = []): MdxElement {
  return {type: 'mdxJsxFlowElement', name, attributes, children};
}

function cellNode(cell: RstCell): MdxElement {
  const attributes: MdxAttr[] = [];
  if (cell.rowSpan > 1) {
    attributes.push({type: 'mdxJsxAttribute', name: 'rowSpan', value: String(cell.rowSpan)});
  }
  if (cell.colSpan > 1) {
    attributes.push({type: 'mdxJsxAttribute', name: 'colSpan', value: String(cell.colSpan)});
  }
  const children = cell.text ? [{type: 'text', value: cell.text}] : [];
  return el(cell.header ? 'th' : 'td', children, attributes);
}

function rowNode(row: RstRow): MdxElement {
  return el('tr', row.map(cellNode));
}

export function buildTableAst(model: RstTableModel): MdxElement {
  const sections: MdxElement[] = [];
  if (model.headerRows.length > 0) {
    sections.push(el('thead', model.headerRows.map(rowNode)));
  }
  if (model.bodyRows.length > 0) {
    sections.push(el('tbody', model.bodyRows.map(rowNode)));
  }
  return el('table', sections);
}
