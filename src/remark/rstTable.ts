import type {Node} from 'unist';
import {visit} from 'unist-util-visit';
import {parseRstGridTable} from './rstTableParser';
import {buildTableAst} from './rstTableAst';

export default function remarkRstTable() {
  return (tree: Node) => {
    visit(
      tree,
      'code',
      (node: any, index: number | undefined, parent: any) => {
        if (node.lang !== 'rst-table') return;
        if (!parent || typeof index !== 'number') return;
        const model = parseRstGridTable(node.value ?? '');
        parent.children[index] = buildTableAst(model);
      },
    );
  };
}
