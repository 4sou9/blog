import { visit } from 'unist-util-visit';

const STEAM_RE = /^https?:\/\/store\.steampowered\.com\/app\/(\d+)/;

export default function rehypeSteam() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent) return;
      if (node.children.length !== 1) return;
      const child = node.children[0];
      if (child.type !== 'element' || child.tagName !== 'a') return;
      const href = child.properties?.href ?? '';
      const match = href.match(STEAM_RE);
      if (!match) return;

      const appId = match[1];
      const iframe = {
        type: 'element',
        tagName: 'iframe',
        properties: {
          src: `https://store.steampowered.com/widget/${appId}/`,
          title: href,
          width: '100%',
          height: '190',
          style: 'border:none;margin:1rem 0;display:block;',
          loading: 'lazy',
        },
        children: [],
      };
      parent.children[index] = iframe;
    });
  };
}
