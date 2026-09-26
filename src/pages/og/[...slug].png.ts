import type { APIRoute, GetStaticPaths } from 'astro';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCollection } from 'astro:content';
import { loadDefaultJapaneseParser } from 'budoux';

const ja = loadDefaultJapaneseParser();

const fontData = readFileSync(
  join(process.cwd(), 'node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff')
);

// satori には CSS を渡せないので、global.css の :root から値だけ借りる。
// 色の定義を2か所に書かないための措置（サイトの色を変えれば OG画像も追う）
const globalCss = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf-8');
const color = (name: string, fallback: string) =>
  globalCss.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim() ?? fallback;

const BG = color('bg', '#36373e');
const FG = color('fg', '#f2f3f5');

// unlisted も含めた全記事分を生成する。unlisted は URL を直接共有する使い方なので、
// OG画像が無いと共有時のカードだけが壊れる（一覧に出ないこととは無関係）
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id },
    props: { title: post.data.title },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title } = props as { title: string };
  // 短いタイトルほど大きく。横幅いっぱい使い、長くても3行ほどに収める
  const len = [...title].length;
  const fontSize = len <= 10 ? 96 : len <= 20 ? 80 : 64;
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          background: BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 100px',
          fontFamily: 'Noto Sans JP',
        },
        children: {
          type: 'div',
          props: {
            style: {
              color: FG,
              fontSize,
              lineHeight: 1.4,
              fontWeight: 700,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              textAlign: 'center',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            },
            // 文節ごとの塊にして、行の折り返しを文節の切れ目だけにする（1文節が1行より長いときだけ中で折れる）
            // BudouX は「時間まとめ（2026年9月）」「個人的 Windows11 セットアップ」を1文節にするので、
            // 開きかっこの前と半角スペースの後でも切れるようにする
            children: ja.parse(title).flatMap(p => p.split(/(?=[（(「『【])|(?<= )/)).map(phrase => ({
              type: 'div',
              props: { style: { whiteSpace: 'pre-wrap' }, children: phrase },
            })),
          },
        },
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Noto Sans JP', data: fontData, weight: 700, style: 'normal' }],
    }
  );

  const png = new Resvg(svg).render().asPng();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
