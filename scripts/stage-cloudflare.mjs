// Cloudflare に置くための準備：ビルド結果（dist/）を .cloudflare/blog/ に写す。
// ブログはサイトの /blog の下にあり、Cloudflare は URL の /blog/〜 をフォルダの blog/〜 から探すため。
// dist/ そのものは GitHub Pages 用にそのまま残す
import { cpSync, rmSync } from 'node:fs';

rmSync('.cloudflare', { recursive: true, force: true });
cpSync('dist', '.cloudflare/blog', { recursive: true });
