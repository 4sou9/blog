---
name: site-internals
description: サイト実装の詳細（プラグイン、unlisted の除外箇所、OG画像、検索、キャッシュ削除、デプロイ）。コードの変更・デバッグ時に使用。
---

# サイト実装

**プラグイン**（`src/plugins/`）:
- `rehype-youtube.js` / `rehype-twitter.js` — 埋め込み
- `rehype-ogp-card.js` — bare URL → OGPカード。build 時に fetch（要ネットワーク）。失敗/Cloudflare は黙って裸リンクのまま
- `rehype-figure.js` — 画像 → `<figure>` + キャプション
- `rehype-external-links.js` — 外部リンクに `target="_blank"` + `rel`
- `remark-btn.js` — `"btn"` タイトル → ボタン
- `remark-directives.js` — `:::` → Custom Components
- `remark-excerpt.js` — 抜粋2系統: remark 版（meta description）と `textExcerpt`（RSS・/ogp）

**unlisted の除外は5箇所**（露出先を増やしたら追加）: `index.astro`、`rss.xml.js`、`og/[...slug].png.ts`、`astro.config.mjs` の `getUnlistedSlugs()`（config はコレクションより先に評価されるため `unlisted: true` を文字列一致でスキャン）、`[...slug].astro` の `data-pagefind-body`。

**OG画像**: build 時生成（`og/[...slug].png.ts`、satori + resvg）。一覧確認は `/blog/ogp`。トップは静的 `public/og-image.svg`。

**検索**: Pagefind のインデックスは build 後生成。dev では 404 になるだけでエラーが出ない。確認は `build && preview`。UI 初期化は `Base.astro` で pointerdown 時に遅延実行。

**キャッシュ**: dev と本番で挙動が違うときは `.astro`・`node_modules/.vite`・`node_modules/.astro` を削除して再起動。プラグイン変更後の build は `node_modules/.astro/data-store.json` が古い出力を返すことがある（コンテンツ変更まで無効化されない）ので、これも消す。

**デプロイ**: main push → `.github/workflows/deploy.yml` → GitHub Pages。手動不要。
