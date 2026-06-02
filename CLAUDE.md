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
- `rehype-ogp-card.js` — bare URL → OGP card (build time)

Pattern: Markdown上で単独行の裸URL → `<p><a href=url>url</a></p>` を検知して変換。

**BASE_URL**: `import.meta.env.BASE_URL` = `/blog`（trailing slash なし）。常に `${base}/path` と書く。
