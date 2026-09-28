import { visitParents } from 'unist-util-visit-parents';

// 記事中のローカル画像の読み込み方を決める。ここで付けた属性は Astro の画像処理（getImage）にそのまま渡る。
// - 最初の画像は LCP になりやすいので lazy をやめて先に取りにいく
// - 幅に応じた srcset を出して、スマホに原寸を送らない
// バナーの壁は原寸・pixelated で並べるので縮小版を作らない。
export default function rehypeImageLoading() {
  return (tree) => {
    let first = true;
    visitParents(tree, 'element', (node, ancestors) => {
      if (node.tagName !== 'img') return;
      const src = node.properties?.src;
      if (typeof src !== 'string' || /^(https?:)?\/\//.test(src)) return;
      // OGP カードの画像は rehype-ogp-card が縮めて lazy にしてある
      if ([].concat(node.properties.className ?? []).includes('ogp-image')) return;
      // Astro の既定の decoding="async" だと、更新ボタンで開き直したとき Chrome が画像抜きのページを
      // 1 コマ描いてから画像を描き足し、冒頭の画像が点滅して見える。最初の画像は展開を待ってから描かせる
      if (first) {
        node.properties.loading = 'eager';
        node.properties.fetchpriority = 'high';
        node.properties.decoding = 'sync';
        first = false;
      }
      const inBannerWall = ancestors.some((a) =>
        [].concat(a.properties?.className ?? []).includes('banner-wall'),
      );
      if (!inBannerWall) node.properties.layout = 'constrained';
    });
  };
}
