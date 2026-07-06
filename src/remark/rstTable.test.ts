import { describe, it, expect } from 'vitest';
import remarkRstTable from './rstTable';

// Build a minimal mdast Root with one rst-table code node and one normal one.
function makeTree() {
  return {
    type: 'root',
    children: [
      { type: 'paragraph', children: [{ type: 'text', value: 'before' }] },
      {
        type: 'code',
        lang: 'rst-table',
        value: [
          '+---+---+',
          '| A | B |',
          '+===+===+',
          '| C | D |',
          '+---+---+',
        ].join('\n'),
      },
      { type: 'code', lang: 'js', value: 'const x = 1;' },
    ],
  };
}

describe('remarkRstTable', () => {
  it('replaces an rst-table code node with a table element', () => {
    const tree = makeTree();
    remarkRstTable()(tree as any);
    const replaced = tree.children[1] as any;
    expect(replaced.type).toBe('mdxJsxFlowElement');
    expect(replaced.name).toBe('table');
  });

  it('leaves non-rst-table code fences untouched', () => {
    const tree = makeTree();
    remarkRstTable()(tree as any);
    const jsNode = tree.children[2] as any;
    expect(jsNode.type).toBe('code');
    expect(jsNode.lang).toBe('js');
  });
});
