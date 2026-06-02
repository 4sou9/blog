# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview built output
```

No lint or test scripts exist.

## Architecture

Astro static blog ("ねこのメモ") deployed to GitHub Pages.

**Pages**
- `src/pages/index.astro` — post list, sorted by `pubDate` descending
- `src/pages/[...slug].astro` — individual post, slug = file ID from content collection

**Layout**
- `src/layouts/Base.astro` — single shared layout; handles `<head>`, OGP meta tags, and site header. Site title is hardcoded here.

**Content**
- `src/content/blog/` — 画像なし記事は `YYYY-MM-DD-slug.md`、画像あり記事はサブフォルダ `YYYY-MM-DD-slug/index.md` + 画像ファイル（両形式混在可）
- Frontmatter schema (`src/content.config.ts`): `title` (required), `pubDate` (required, coerced to Date), `description` (optional), `unlisted` (optional, 一覧非表示)

**Custom rehype plugins** (`src/plugins/`)
- `rehype-youtube.js` — bare YouTube URLs on their own line → `<iframe>` embed
- `rehype-twitter.js` — bare twitter.com/x.com status URLs on their own line → Twitter embed widget
- `rehype-ogp-card.js` — bare URLs on their own line (excluding YouTube/Twitter) → OGP link card fetched at build time

The embed plugins all use the same pattern: a `<p>` with a single `<a>` whose text equals the href (i.e., a bare URL in Markdown).

**Styling**
- `src/styles/global.css` — single CSS file, dark theme via CSS custom properties (`--bg`, `--fg`, `--muted`, `--faint`, `--link`)

**BASE_URL** is used throughout for GitHub Pages subdirectory compatibility.
`import.meta.env.BASE_URL` equals `/blog` (no trailing slash) in this project.
Always write `${base}/path` — never remove the `/` separator.
