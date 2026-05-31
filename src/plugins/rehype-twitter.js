import { visit } from 'unist-util-visit';

const TWITTER_RE = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/;

export default function rehypeTwitter() {
  return (tree) => {
    let hasEmbed = false;

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent) return;
      if (node.children.length !== 1) return;
      const child = node.children[0];
      if (child.type !== 'element' || child.tagName !== 'a') return;
      const href = child.properties?.href ?? '';
      if (!TWITTER_RE.test(href)) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'blockquote',
        properties: { className: ['twitter-tweet'] },
        children: [
          { type: 'element', tagName: 'a', properties: { href }, children: [] },
        ],
      };
      hasEmbed = true;
    });

    if (hasEmbed) {
      tree.children.push({
        type: 'element',
        tagName: 'script',
        properties: { async: true, src: 'https://platform.twitter.com/widgets.js' },
        children: [],
      });
    }
  };
}
