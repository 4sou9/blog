// ファビコン一式を public/favicon.svg から書き出す（node scripts/build-favicons.mjs）。
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

// ICO は PNG をそのまま入れる形式（16・32・48px）
function ico(sizes) {
  const images = sizes.map((s) => png(icon, s));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // アイコン
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(s, e);
    header.writeUInt8(s, e + 1);
    header.writeUInt16LE(1, e + 4); // 色平面
    header.writeUInt16LE(32, e + 6); // ビット深度
    header.writeUInt32LE(images[i].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += images[i].length;
  });
  return Buffer.concat([header, ...images]);
}

write('public/favicon.ico', ico([16, 32, 48]));
write('public/apple-touch-icon.png', png(filled(8), 180)); // トップ・掲示板と同じ作り方
// manifest の maskable は、中央の円（直径 80%）の外が切られることがあるので、ねこをさらに小さくする
for (const s of [192, 512]) write(`public/web-app-manifest-${s}x${s}.png`, png(filled(14), s));
