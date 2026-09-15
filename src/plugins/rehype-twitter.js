import { visit } from 'unist-util-visit';

// 単独行のツイートURLを公式の埋め込みに変換する。
// widgets.js は読み込まないと描画できないが、YouTube を nocookie にしたのと同じ趣旨で
// data-dnt="true"（Do Not Track。閲覧者の情報を広告のパーソナライズに使わせない）を
// 付ける。テーマはサイトに合わせてダーク固定。
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
        properties: { className: ['twitter-tweet'], dataDnt: 'true', dataTheme: 'dark' },
        children: [
          { type: 'element', tagName: 'a', properties: { href }, children: [{ type: 'text', value: href }] },
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
