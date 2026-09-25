import rss from '@astrojs/rss';
import { listedPosts, postExcerpt } from '../lib/posts';

export async function GET(context) {
  const posts = await listedPosts();

  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

  return rss({
    title: 'ねこのメモ',
    description: '備忘録です',
    site: new URL(import.meta.env.BASE_URL, context.site).href, // ブログのトップ（ドメインの直下はサイトのトップ）
    // 既定では末尾に / が付き、/blog/ は /blog への転送になる（サイトは trailingSlash: 'never'）
    trailingSlash: false,
    items: await Promise.all(posts.map(async (post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: await postExcerpt(post),
      link: new URL(`${base}${post.id}`, context.site).href,
    }))),
  });
}
