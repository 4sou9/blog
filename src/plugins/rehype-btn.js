import { visit } from 'unist-util-visit';

export default function remarkBtn() {
  return (tree) => {
    visit(tree, 'link', (node) => {
      if (node.title !== 'btn') return;
      node.title = null;
      node.data = {
        ...node.data,
        hProperties: { ...node.data?.hProperties, className: ['btn-link'] },
      };
    });
  };
}
