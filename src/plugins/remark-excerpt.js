// 抜粋の生成は2系統ある（description 未指定時のフォールバック）:
// - remarkExcerpt: remark プラグイン。mdast から抜粋を作り frontmatter.excerpt に
//   格納する。記事ページの <meta name="description"> が消費（[...slug].astro）。
// - textExcerpt: Markdown ソース文字列を正規表現で雑に整形する軽量版。
//   remark を通さない場所（ogp.astro のプレビュー一覧）が消費。
// 両者の出力は完全には一致しないが、用途がプレビューなので許容している。

function nodeText(node) {
  if (node.type === 'image') return '';
  if (node.value != null) return node.value;
  if (node.children) return node.children.map(nodeText).join('');
  return '';
}

export function textExcerpt(body = '', max = 120) {
  const text = body
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('```') && !l.startsWith('!') && !l.startsWith('http') && !l.startsWith('---'))
    .map(l => l.startsWith('#')
      ? l.replace(/^#+\s*/, '')
      : l.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`~]/g, ''))
    .filter(l => l.length > 1)
    .join(' ');
  return text.slice(0, max).trim() || undefined;
}

export function remarkExcerpt() {
  return (tree, file) => {
    const parts = [];
    for (const node of tree.children) {
      if (parts.join(' ').length >= 120) break;
      if (node.type === 'paragraph' || node.type === 'heading') {
        const text = nodeText(node).replace(/\s+/g, ' ').trim();
        if (text.length > 1) parts.push(text);
      } else if (node.type === 'list') {
        for (const item of node.children) {
          const text = nodeText(item).replace(/\s+/g, ' ').trim();
          if (text.length > 1) { parts.push(text); break; }
        }
      }
    }
    const excerpt = parts.join(' ').slice(0, 120).trim();
    if (excerpt.length > 4) {
      file.data.astro.frontmatter.excerpt = excerpt;
    }
  };
}
