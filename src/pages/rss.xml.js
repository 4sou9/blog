import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

function extractExcerpt(body = '', max = 120) {
  const text = body
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('```') && !l.startsWith('!') && !l.startsWith('http') && !l.startsWith('---'))
    .map(l => l.startsWith('#')
      ? l.replace(/^#+\s*/, '')
      : l.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`~]/g, ''))
    .filter(l => l.length > 1)
    .join(' ');
  return text.slice(0, max).trim() || undefined;
}

export async function GET(context) {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.unlisted)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

  return rss({
    title: 'ねこのメモ',
    description: '備忘録です',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description ?? extractExcerpt(post.body),
      link: new URL(`${base}${post.id}/`, context.site).href,
    })),
  });
}
