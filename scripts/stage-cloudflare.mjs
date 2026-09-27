// Cloudflare に置くための準備：ビルド結果（dist/）を .cloudflare/blog/ に写す。
// ブログはサイトの /blog の下にあり、Cloudflare は URL の /blog/〜 をフォルダの blog/〜 から探すため。
// dist/ そのものは GitHub Pages 用にそのまま残す
import { cpSync, rmSync, writeFileSync } from 'node:fs';

rmSync('.cloudflare', { recursive: true, force: true });
cpSync('dist', '.cloudflare/blog', { recursive: true });

// 何も指定しないと全ファイルが max-age=0 で配られ、毎回サーバーに確認しに行く。
// _astro/ と pagefind の索引（fragment/・index/）はファイル名にハッシュが入り、中身が変われば名前も変わるので、1 年キャッシュさせてよい。
// og/ の画像は名前が変わらないまま作り直されることがあるので、1 日にとどめる。
// _headers は配信するフォルダ（.cloudflare/）の直下に置く必要があり、ファイル自体は公開されない
//
// セキュリティヘッダーはトップ（10_SITE の public/_headers）に合わせる。CSP で許しているものは次のとおり
//   'unsafe-inline'（script）：Astro がページに埋め込む小さなスクリプト
//   'wasm-unsafe-eval'：検索（Pagefind）が WebAssembly を使う
//   platform.twitter.com：X の埋め込み（rehype-twitter.js）／ youtube-nocookie.com：YouTube の埋め込み（rehype-youtube.js）
//   static.cloudflareinsights.com：Cloudflare Web Analytics が自動で差し込むビーコン
//   img-src の https:：記事に外部の画像を貼ったときも表示できるように
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://platform.twitter.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' https://cloudflareinsights.com",
  'frame-src https://platform.twitter.com https://www.youtube-nocookie.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');
const security = [
  `Content-Security-Policy: ${csp}`,
  'X-Frame-Options: DENY',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
];
writeFileSync(
  '.cloudflare/_headers',
  `/blog*\n${security.map((h) => `  ${h}\n`).join('')}` +
    ['/blog/_astro/*', '/blog/pagefind/fragment/*', '/blog/pagefind/index/*']
      .map((path) => `${path}\n  Cache-Control: public, max-age=31536000, immutable\n`)
      .join('') + '/blog/og/*\n  Cache-Control: public, max-age=86400\n',
);
