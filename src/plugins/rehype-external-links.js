import { visit } from 'unist-util-visit';

// 記事本文の外部リンク（http/https）を新しいタブで開く。
// rel="noopener noreferrer" も付けて、開いた先から window.opener を触られないようにする。
export default function rehypeExternalLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;
      node.properties.target = '_blank';
      node.properties.rel = 'noopener noreferrer';
    });
  };
}
