# CLAUDE.md

Astro static blog ("ねこのメモ")。main push で GitHub Pages に自動デプロイ。lint/test なし。

```bash
npm run dev      # 検索は動かない（site-internals 参照）
npm run build    # astro build + pagefind
npm run preview
```

**BASE_URL** = `/blog`（trailing slash なし）。常に `${base}/path`。

Skills: **blog-writing**（記事の書き方）/ **japanese-tech-writing**（文章規範）/ **site-internals**（実装・デバッグ）
