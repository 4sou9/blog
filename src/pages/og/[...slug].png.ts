import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const fontData = readFileSync(
  join(process.cwd(), 'node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff')
);

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = (await getCollection('blog')).filter(p => !p.data.unlisted);
  return posts.map(post => ({
    params: { slug: post.id },
    props: { title: post.data.title },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title } = props as { title: string };
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          background: '#36373e',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '64px',
          fontFamily: 'Noto Sans JP',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                color: '#f4f5f7',
                fontSize: 72,
                lineHeight: 1.4,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: 500,
              },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                color: '#828b97',
                fontSize: 28,
                fontWeight: 700,
                textAlign: 'center',
              },
              children: 'ねこのメモ',
            },
          },
        ],
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
