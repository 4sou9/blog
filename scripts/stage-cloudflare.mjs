// Cloudflare に置くための準備：ビルド結果（dist/）を .cloudflare/blog/ に写す。
// ブログはサイトの /blog の下にあり、Cloudflare は URL の /blog/〜 をフォルダの blog/〜 から探すため。
// dist/ そのものは GitHub Pages 用にそのまま残す
import { cpSync, rmSync, writeFileSync } from 'node:fs';

rmSync('.cloudflare', { recursive: true, force: true });
cpSync('dist', '.cloudflare/blog', { recursive: true });

// 何も指定しないと全ファイルが max-age=0 で配られ、毎回サーバーに確認しに行く。
// _astro/ の下はファイル名にハッシュが入り、中身が変われば名前も変わるので、1 年キャッシュさせてよい。
// _headers は配信するフォルダ（.cloudflare/）の直下に置く必要があり、ファイル自体は公開されない
writeFileSync(
  '.cloudflare/_headers',
  '/blog/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n',
);
