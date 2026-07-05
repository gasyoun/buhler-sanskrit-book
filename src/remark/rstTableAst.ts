import type { RstCell, RstRow, RstTableModel } from './rstTableParser';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { mdxjs } from 'micromark-extension-mdxjs';
import { mdxFromMarkdown } from 'mdast-util-mdx';

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

function el(
  name: string,
  children: any[],
  attributes: MdxAttr[] = [],
): MdxElement {
  return { type: 'mdxJsxFlowElement', name, attributes, children };
}

// Position data is irrelevant to rendering and only clutters the AST; drop it so
// generated cells are indistinguishable from hand-authored ones.
function stripPositions(nodes: any[]): void {
  for (const n of nodes) {
    delete n.position;
    if (Array.isArray(n.attributes)) {
      for (const a of n.attributes) {
        delete a.position;
        if (a.value && typeof a.value === 'object') delete a.value.position;
      }
    }
    if (Array.isArray(n.children)) stripPositions(n.children);
  }
}

// Parse a cell's text as MDX phrasing content (markdown emphasis, inline JSX like
// <Latin/>, plain text) so it renders identically to the same text authored
// directly inside a hand-written <td>. Downstream shorthand plugins then run over
// the resulting text/strong nodes exactly as they do for authored cells.
function parseCellChildren(text: string): any[] {
  if (!text) return [];
  const tree: any = fromMarkdown(text, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  });
  const children: any[] = [];
  for (const block of tree.children) {
    if (block.type === 'paragraph' && Array.isArray(block.children)) {
      children.push(...block.children);
    } else {
      children.push(block);
    }
  }
  stripPositions(children);
  return children;
}

function cellNode(cell: RstCell): MdxElement {
  const attributes: MdxAttr[] = [];
  if (cell.rowSpan > 1) {
    attributes.push({
      type: 'mdxJsxAttribute',
      name: 'rowSpan',
      value: String(cell.rowSpan),
    });
  }
  if (cell.colSpan > 1) {
    attributes.push({
      type: 'mdxJsxAttribute',
      name: 'colSpan',
      value: String(cell.colSpan),
    });
  }
  return el(
    cell.header ? 'th' : 'td',
    parseCellChildren(cell.text),
    attributes,
  );
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
