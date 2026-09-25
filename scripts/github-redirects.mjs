// 旧 URL（https://4sou9.github.io/blog/〜）用の転送ページを .github-redirects/ に作る。
// GitHub Pages ではサーバー側の転送ができないので、ページごとに同じパスの新しい URL へ移る HTML を置く。
// rss.xml・サイトマップ・Search Console の確認ファイルは、中身をそのまま残す（RSS リーダーと「アドレス変更」用）。
// サイトマップの URL は旧ドメインに書き換える（Google は別ドメインの URL を載せたサイトマップを無視する。
// 旧 URL を並べておくと、Google が旧ページを巡回し直して転送に気づきやすい）。
// 画像もそのまま残す（X や Discord に共有済みのカードのプレビュー画像が旧 URL を指しているため）。
// 転送ページに noindex は付けない。付けると Google が canonical をたどらず、新しい URL へ評価が引き継がれにくい
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const NEW = 'https://neko4.dev/blog';
const OLD = 'https://4sou9.github.io/blog';
const OUT = '.github-redirects';

const page = (to) => `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>ねこのメモは移転しました</title>
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
  } else if (/^sitemap.*\.xml$/.test(rel)) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, readFileSync(join('dist', rel), 'utf8').replaceAll(`<loc>${NEW}`, `<loc>${OLD}`));
  } else if (/^(rss\.xml|google.*\.html)$/.test(rel) || /\.(png|jpe?g|webp|gif|svg|ico|avif)$/.test(rel)) {
    mkdirSync(dirname(out), { recursive: true });
    cpSync(join('dist', rel), out);
  }
}
