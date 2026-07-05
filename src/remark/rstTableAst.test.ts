import {describe, it, expect} from 'vitest';
import {buildTableAst} from './rstTableAst';
import {RstTableModel} from './rstTableParser';

const model: RstTableModel = {
  headerRows: [[{text: '', rowSpan: 1, colSpan: 1, header: true},
                {text: 'H', rowSpan: 1, colSpan: 1, header: true}]],
  bodyRows: [[{text: 'A', rowSpan: 2, colSpan: 1, header: false},
              {text: 'B', rowSpan: 1, colSpan: 3, header: false}]],
};

describe('buildTableAst', () => {
  it('builds a table/thead/tbody structure', () => {
    const table = buildTableAst(model);
    expect(table.type).toBe('mdxJsxFlowElement');
    expect(table.name).toBe('table');
    expect(table.children.map((c: any) => c.name)).toEqual(['thead', 'tbody']);
  });

  it('uses th for header cells and td for body cells', () => {
    const table = buildTableAst(model);
    const thead = table.children.find((c: any) => c.name === 'thead');
    const tbody = table.children.find((c: any) => c.name === 'tbody');
    const headerCells = thead.children[0].children;
    const bodyCells = tbody.children[0].children;
    expect(headerCells.map((c: any) => c.name)).toEqual(['th', 'th']);
    expect(bodyCells.map((c: any) => c.name)).toEqual(['td', 'td']);
  });

  it('emits span attributes only when > 1', () => {
    const table = buildTableAst(model);
    const tbody = table.children.find((c: any) => c.name === 'tbody');
    const [a, b] = tbody.children[0].children;
    // A: rowSpan 2 -> one rowSpan attribute, no colSpan
    expect(a.attributes).toEqual([
      {type: 'mdxJsxAttribute', name: 'rowSpan', value: '2'},
    ]);
    // B: colSpan 3 -> one colSpan attribute, no rowSpan
    expect(b.attributes).toEqual([
      {type: 'mdxJsxAttribute', name: 'colSpan', value: '3'},
    ]);
  });

  it('renders cell text as a text child and empty text as no children', () => {
    const table = buildTableAst(model);
    const thead = table.children.find((c: any) => c.name === 'thead');
    const [empty, h] = thead.children[0].children;
    expect(empty.children).toEqual([]);
    expect(h.children).toEqual([{type: 'text', value: 'H'}]);
  });

  it('omits thead when there are no header rows', () => {
    const bodyOnly: RstTableModel = {headerRows: [], bodyRows: model.bodyRows};
    const table = buildTableAst(bodyOnly);
    expect(table.children.map((c: any) => c.name)).toEqual(['tbody']);
  });
});
