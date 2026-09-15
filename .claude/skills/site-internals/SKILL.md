---
name: site-internals
description: サイト実装の詳細（プラグイン、unlisted の除外箇所、OG画像、検索、キャッシュ削除、デプロイ）。コードの変更・デバッグ時に使用。
---

# サイト実装

**プラグイン**（`src/plugins/`）:
- `rehype-youtube.js` / `rehype-twitter.js` — 埋め込み
- `rehype-ogp-card.js` — bare URL → OGPカード。取得結果は `ogp-cache.json`（コミットする）に貯め、未知の URL だけ fetch する。失敗時は警告を出して裸リンクのまま。取り直すには該当エントリを消して再ビルド
- `rehype-figure.js` — 画像 → `<figure>` + キャプション
- `rehype-external-links.js` — 外部リンクに `target="_blank"` + `rel`
- `remark-btn.js` — `"btn"` タイトル → ボタン
- `remark-directives.js` — `:::` → Custom Components。未知のディレクティブ名／バッジ種別はビルド時に警告する
- `remark-excerpt.js` — 抜粋を frontmatter に載せる。消費側は `src/lib/posts.ts` の `postExcerpt()` 1つで、meta description・RSS・/ogp がそこを通る

**unlisted の除外**: 記事一覧は `src/lib/posts.ts` の `listedPosts()` に集約（`index.astro`、`rss.xml.js`、`ogp.astro` が使用）。露出先を増やすときは自前でフィルタせずこれを使う。集約できない例外が2箇所ある: sitemap 用の `src/lib/unlisted.mjs`（config はコレクションより先に評価されるため frontmatter を文字列スキャンする）と、`[...slug].astro` の `data-pagefind-body` / `noindex`。スキャンの取りこぼしは `astro.config.mjs` の `checkUnlisted()` がビルド後に検算して落とすので、黙って公開されることはない。OG画像だけは意図的に全記事分を作る（URL 直共有時のカードが壊れるため）。

**日付表記**: `src/lib/posts.ts` の `formatDate()`。

**配色**: `src/styles/global.css` の `:root` が唯一の定義。OG画像は CSS を適用できないため、`og/[...slug].png.ts` がこのファイルから値を読み出している。

**OG画像**: build 時生成（`og/[...slug].png.ts`、satori + resvg）。一覧確認は `/blog/ogp`。トップと 404 は静的 `public/og-image.png`（SVG は OGP クローラが描画しないため PNG。元データは `public/og-image.svg`）。

**検索**: Pagefind のインデックスは build 後生成。dev では 404 になるだけでエラーが出ない。確認は `build && preview`。UI 初期化は `Base.astro` で pointerdown 時に遅延実行。

**キャッシュ**: dev と本番で挙動が違うときは `.astro`・`node_modules/.vite`・`node_modules/.astro` を削除して再起動。プラグイン変更後の build は `node_modules/.astro/data-store.json` が古い出力を返すことがある（コンテンツ変更まで無効化されない）ので、これも消す。

**デプロイ**: main push → `.github/workflows/deploy.yml` → GitHub Pages。手動不要。
