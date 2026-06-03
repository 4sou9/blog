# CLAUDE.md

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview built output
```

No lint or test scripts exist.

## Architecture

Astro static blog ("ねこのメモ") deployed to GitHub Pages.

**Content** (`src/content/blog/`)
- 画像なし: `YYYY-MM-DD-slug.md`、画像あり: `YYYY-MM-DD-slug/index.md` + 画像ファイル
- Frontmatter: `title` (required), `pubDate` (required, coerced to Date), `description` (optional), `unlisted` (optional, 一覧非表示)

**Rehype plugins** (`src/plugins/`)
- `rehype-youtube.js` — YouTube URL → `<iframe>` embed
- `rehype-twitter.js` — Twitter/X URL → embed widget
- `rehype-steam.js` — Steam store URL → Steam widget `<iframe>`（高さ190px）
- `rehype-ogp-card.js` — bare URL → OGP card (build time)。`steampowered.com` はスキップ済み

**埋め込みの書き方**: Markdown上で単独行の裸URL（リンクテキスト≠hrefだと変換されない）

```
# YouTube
https://www.youtube.com/watch?v=VIDEO_ID

# Twitter/X
https://twitter.com/user/status/STATUS_ID

# Steam ストアページ
https://store.steampowered.com/app/APP_ID/

# その他URL → OGPカード
https://example.com/
```

**キャッシュ削除**: dev環境と本番で動作が異なる場合は `.astro` と `node_modules/.vite` を削除して再起動。プラグイン変更はdev serverの再起動が必要（`watchPlugins`が自動再起動するが効かない場合も）。

**BASE_URL**: `import.meta.env.BASE_URL` = `/blog`（trailing slash なし）。常に `${base}/path` と書く。

**ボタンリンク**: リンクタイトルに `"btn"` を指定するとボタン風スタイルになる（`rehype-btn.js`）。
```
[テキスト](https://example.com "btn")
```
