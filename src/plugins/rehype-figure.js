import { visit } from 'unist-util-visit';

export default function rehypeFigure() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'img' || !parent) return;
      const title = node.properties?.title;
      if (!title) return;
      delete node.properties.title;
      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: {},
        children: [
          node,
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [{ type: 'text', value: title }],
          },
        ],
      };
    });
  };
}
