// ファビコン一式と一覧用の OGP 画像を public/ の SVG から書き出す（node scripts/build-favicons.mjs）。
// アイコンはトップ（10_SITE の public/favicon.svg）と同じもの。変えるときはトップの SVG をここにも写してから実行する
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const icon = readFileSync('public/favicon.svg', 'utf8');
const BG = '#36373e';

const png = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
function write(out, data) {
  writeFileSync(out, data);
  console.log(`${out}  ${(data.length / 1024).toFixed(1)}KB`);
}

// 四隅まで背景色で埋め、ねこのまわりに余白を取る（pad は 64 の枠の外に足す幅）。
// iPhone やホーム画面は OS がアイコンの形を切り抜くので、角丸のままだと角に隙間ができる
const filled = (pad) =>
  icon
    .replace(/<path/, `<rect x="${-pad}" y="${-pad}" width="${64 + pad * 2}" height="${64 + pad * 2}" fill="${BG}"/><path`)
    .replace('viewBox="0 0 64 64"', `viewBox="${-pad} ${-pad} ${64 + pad * 2} ${64 + pad * 2}"`);

write('public/favicon.png', png(icon, 48)); // トップ・掲示板と同じ形式（png, 48x48）
write('public/apple-touch-icon.png', png(filled(8), 180)); // トップ・掲示板と同じ作り方
// manifest の maskable は、中央の円（直径 80%）の外が切られることがあるので、ねこをさらに小さくする
for (const s of [192, 512]) write(`public/web-app-manifest-${s}x${s}.png`, png(filled(14), s));

// 一覧などの OGP 画像（記事ごとの画像は src/pages/og/ でビルド時に作る）
const og = new Resvg(readFileSync('public/og-image.svg', 'utf8'), {
  font: { loadSystemFonts: true, defaultFontFamily: 'Yu Gothic' },
}).render().asPng();
write('public/og-image.png', og);
