import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { textExcerpt } from '../plugins/remark-excerpt.js';

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
      description: post.data.description ?? textExcerpt(post.body),
      link: new URL(`${base}${post.id}`, context.site).href,
    })),
  });
}
