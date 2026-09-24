# CLAUDE.md

Astro static blog ("ねこのメモ")。main push で GitHub Pages に自動デプロイ。lint/test なし。

```bash
npm run dev      # 検索は動かない（site-internals 参照）
npm run build    # astro build + pagefind
npm run preview
```

**BASE_URL** = `/blog`（trailing slash なし）。常に `${base}/path`。

独自ドメインへの移行準備として、Cloudflare（Workers の静的配信、`wrangler.jsonc`）でも公開できる。トップ（10_SITE）・掲示板（/bbs）と同じドメインの /blog を受け持つ。`npm run preview:cf`（8789）で確認、`npm run deploy:cf` で公開。`scripts/stage-cloudflare.mjs` が dist/ を .cloudflare/blog/ に写す（dist/ は GitHub Pages 用にそのまま）

Skills: **blog-writing**（記事の書き方）/ **japanese-tech-writing**（文章規範）/ **site-internals**（実装・デバッグ）
