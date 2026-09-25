# CLAUDE.md

Astro static blog ("ねこのメモ")。main push で Cloudflare（https://neko4.dev/blog）に自動デプロイ。旧 URL（4sou9.github.io/blog）の GitHub Pages には転送ページだけを置く。lint/test なし。

```bash
npm run dev      # 検索は動かない（site-internals 参照）
npm run build    # astro build + pagefind
npm run preview
```

**BASE_URL** = `/blog`（trailing slash なし）。常に `${base}/path`。

Cloudflare では Workers の静的配信（`wrangler.jsonc`）で公開している。トップ（10_SITE）・掲示板（/bbs）と同じドメインの /blog を受け持つ。`npm run preview:cf`（8789）で確認、`npm run deploy:cf` で公開。`scripts/stage-cloudflare.mjs` が dist/ を .cloudflare/blog/ に写す。転送ページは `scripts/github-redirects.mjs` が作る

Skills: **blog-writing**（記事の書き方）/ **japanese-tech-writing**（文章規範）/ **site-internals**（実装・デバッグ）
