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
writeFileSync(
  '.cloudflare/_headers',
  ['/blog/_astro/*', '/blog/pagefind/fragment/*', '/blog/pagefind/index/*']
    .map((path) => `${path}\n  Cache-Control: public, max-age=31536000, immutable\n`)
    .join('') + '/blog/og/*\n  Cache-Control: public, max-age=86400\n',
);
