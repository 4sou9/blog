// 旧 URL（https://4sou9.github.io/blog/〜）用の転送ページを .github-redirects/ に作る。
// GitHub Pages ではサーバー側の転送ができないので、ページごとに同じパスの新しい URL へ移る HTML を置く。
// rss.xml・サイトマップ・Search Console の確認ファイルは、中身をそのまま残す（RSS リーダーと「アドレス変更」用）
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const NEW = 'https://neko4.dev/blog';
const OUT = '.github-redirects';

const page = (to) => `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>ねこのメモは移転しました</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${to}">
<meta http-equiv="refresh" content="0; url=${to}">
<script>location.replace(${JSON.stringify(to)} + location.search + location.hash)</script>
</head>
<body><p><a href="${to}">${to}</a> へ移転しました。</p></body>
</html>
`;

// 404 は、開かれたパスをそのまま新しいドメインに付けて移る
const notFound = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>ねこのメモは移転しました</title>
<meta name="robots" content="noindex">
<script>location.replace(${JSON.stringify(NEW)} + location.pathname.replace(/^\\/blog/, '') + location.search + location.hash)</script>
</head>
<body><p><a href="${NEW}">${NEW}</a> へ移転しました。</p></body>
</html>
`;

rmSync(OUT, { recursive: true, force: true });
for (const entry of readdirSync('dist', { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const rel = relative('dist', join(entry.parentPath, entry.name)).replaceAll('\\', '/');
  const out = join(OUT, rel);
  if (rel === '404.html') {
    writeFileSync(out, notFound);
  } else if (rel.endsWith('.html') && !rel.startsWith('google')) {
    const path = rel.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, page(path ? `${NEW}/${path}` : NEW));
  } else if (/^(rss\.xml|sitemap.*\.xml|google.*\.html)$/.test(rel)) {
    mkdirSync(dirname(out), { recursive: true });
    cpSync(join('dist', rel), out);
  }
}
