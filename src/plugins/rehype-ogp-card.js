import { visit } from 'unist-util-visit';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

// 単独行の裸URL（<p><a>href と同一テキスト</a></p>）を OGP カードに変換する。
// YouTube/Twitter は専用の rehype プラグインが埋め込むためここではスキップ。
//
// 取得結果は ogp-cache.json に貯めてリポジトリにコミットする。同じコミットなら
// 誰がいつビルドしても同じ HTML が出るようにするため。キャッシュに無い URL だけ
// 取りにいくので、CI はネットワークが無くても既存記事を落とさずビルドできる。
// カードを取り直したいときは該当エントリ（またはファイルごと）を消して再ビルドする。
//
// カードの画像も同じ考え方で public/ogp-card/ に置いてコミットする。相手の原寸（GitHub だと
// 1920px・200KB 超）をそのまま読ませるとページの大半がこの 1 枚になるため、カードの表示幅に
// 合わせて縮めた WebP を自分のドメインから配る。取れなかったときは相手の URL を直接使う。
const SKIP_RE = /youtube\.com|youtu\.be|twitter\.com|x\.com/;
const CACHE_PATH = join(process.cwd(), 'ogp-cache.json');
const IMAGE_DIR = 'ogp-card';
// カードは最大 520px（global.css の .ogp-card）。少し余裕を持たせ、OGP 標準の 1200:630 で切る
const IMAGE_WIDTH = 600;
const IMAGE_HEIGHT = 315;

function loadCache() {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

const cache = loadCache();

// 差分を読めるようにキーを並べ替えて書く（コミットするファイルなので）
function saveCache() {
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(CACHE_PATH, JSON.stringify(sorted, null, 2) + '\n');
}

// 生 HTML から抜いた属性値はエンティティのまま。表示用テキストなので戻す
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };
function decode(value) {
  return value.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (whole, name) => {
    const key = name.toLowerCase();
    if (key in ENTITIES) return ENTITIES[key];
    if (key.startsWith('#x')) return String.fromCodePoint(parseInt(key.slice(2), 16));
    if (key.startsWith('#')) return String.fromCodePoint(Number(key.slice(1)));
    return whole;
  });
}

// 取り込みに失敗したときは img の src にそのまま入れるので、http/https 以外（javascript: 等）を弾く。
// 以前は style="background-image:url(...)" に埋めていたため url() を抜け出せる文字も置き換えており、
// ogp-cache.json にはその形で入っている
function safeImageUrl(value) {
  if (!value) return '';
  try {
    const { protocol } = new URL(value);
    if (protocol !== 'http:' && protocol !== 'https:') return '';
  } catch {
    return '';
  }
  // encodeURIComponent は ' と ( ) を素通しするので、url() を閉じられる文字は自前で置く
  const ESCAPED = { '"': '%22', "'": '%27', '(': '%28', ')': '%29', '\\': '%5C', ';': '%3B' };
  return value.replace(/["'()\\\s;]/g, (c) => ESCAPED[c] ?? encodeURIComponent(c));
}

async function fetchOgp(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    if (html.includes('cf-mitigated') || html.includes('jschl-answer') || html.includes('Just a moment')) {
      console.warn(`[ogp-card] Cloudflare のチャレンジに阻まれたため裸のリンクのままにします: ${url}`);
      return null;
    }
    const get = (...patterns) => {
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].trim();
      }
      return '';
    };
    return {
      title: decode(get(
        /property="og:title"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+property="og:title"/,
        /<title[^>]*>([^<]+)<\/title>/,
      )),
      description: decode(get(
        /property="og:description"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+property="og:description"/,
        /name="description"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+name="description"/,
      )),
      image: safeImageUrl(get(
        /property="og:image"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+property="og:image"/,
      )),
      siteName: decode(get(
        /property="og:site_name"\s+content="([^"]*)"/,
        /content="([^"]*)"\s+property="og:site_name"/,
      )),
    };
  } catch (err) {
    console.warn(`[ogp-card] 取得に失敗したため裸のリンクのままにします: ${url} (${err})`);
    return null;
  }
}

// 画像 URL ごとにファイル名を決め、無ければ取ってきて縮める。返すのは public/ からの相対パス
async function localizeImage(imageUrl) {
  const name = `${createHash('sha1').update(imageUrl).digest('hex').slice(0, 12)}.webp`;
  const file = join(process.cwd(), 'public', IMAGE_DIR, name);
  if (existsSync(file)) return `${IMAGE_DIR}/${name}`;
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const webp = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
    mkdirSync(join(process.cwd(), 'public', IMAGE_DIR), { recursive: true });
    writeFileSync(file, webp);
    return `${IMAGE_DIR}/${name}`;
  } catch (err) {
    console.warn(`[ogp-card] 画像を取り込めなかったため元の URL を使います: ${imageUrl} (${err})`);
    return null;
  }
}

// キャッシュ優先。取得できた分だけ貯め、失敗はキャッシュしない（次回また試す）
async function resolveOgp(url) {
  if (url in cache) return cache[url];
  const ogp = await fetchOgp(url);
  if (!ogp) return null;
  cache[url] = ogp;
  return ogp;
}

// X・Facebook・Discord と同じく、画像を上に置き、その下にドメイン・タイトル・説明を並べる
// 画面外のカードが多いので画像は lazy。width/height で読み込み前から場所を確保する
function makeCard(href, ogp, imageSrc) {
  let hostname = href;
  try { hostname = new URL(href).hostname; } catch {}

  return {
    type: 'element',
    tagName: 'a',
    properties: { href, className: ['ogp-card'], target: '_blank', rel: 'noopener noreferrer' },
    children: [
      ...(imageSrc ? [{
        type: 'element',
        tagName: 'img',
        properties: {
          className: ['ogp-image'],
          src: imageSrc,
          alt: '',
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          loading: 'lazy',
          decoding: 'async',
        },
        children: [],
      }] : []),
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['ogp-content'] },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['ogp-url'] },
            children: [{ type: 'text', value: hostname }],
          },
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['ogp-title'] },
            children: [{ type: 'text', value: ogp.title || href }],
          },
          ...(ogp.description ? [{
            type: 'element',
            tagName: 'div',
            properties: { className: ['ogp-desc'] },
            children: [{ type: 'text', value: ogp.description }],
          }] : []),
        ],
      },
    ],
  };
}

export default function rehypeOgpCard({ base = '' } = {}) {
  return async (tree) => {
    const tasks = [];

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent) return;
      if (node.children.length !== 1) return;
      const child = node.children[0];
      if (child.type !== 'element' || child.tagName !== 'a') return;
      const href = child.properties?.href ?? '';
      if (SKIP_RE.test(href)) return;
      const linkText = child.children?.[0]?.value ?? '';
      if (linkText !== href) return;

      tasks.push({ index, parent, href });
    });

    if (!tasks.length) return;

    const before = Object.keys(cache).length;
    await Promise.all(tasks.map(async ({ index, parent, href }) => {
      const ogp = await resolveOgp(href);
      if (!ogp) return;
      const local = ogp.image ? await localizeImage(ogp.image) : null;
      parent.children[index] = makeCard(href, ogp, local ? `${base}/${local}` : ogp.image);
    }));
    if (Object.keys(cache).length !== before) saveCache();
  };
}
