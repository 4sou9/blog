import { getCollection, render, type CollectionEntry } from 'astro:content';

/**
 * 一覧に出す記事。unlisted を除き、新しい順に並べる。
 * 記事の露出先を増やすときは自前でフィルタせずこれを使う（除外もれを防ぐため）。
 * 例外は3箇所。astro.config.mjs の sitemap はコレクションより先に評価されるため
 * frontmatter を文字列スキャンしており（src/lib/unlisted.mjs）、[...slug].astro の
 * data-pagefind-body と noindex は記事ページ自身の生成なので個別に unlisted を見ている。
 * OG画像だけは意図的に全記事分を作る（URL を直接共有したときのカードが壊れるため）。
 */
export async function listedPosts(): Promise<CollectionEntry<'blog'>[]> {
  return (await getCollection('blog'))
    .filter((p) => !p.data.unlisted)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * 記事の説明文。frontmatter の description があればそれ、なければ本文からの抜粋。
 * 抜粋の生成は remark-excerpt.js の1本だけ（render 経由で frontmatter に載る）。
 * meta description・RSS・/ogp プレビューはすべてここを通す。表示先ごとに別の実装を
 * 持つと、同じ記事なのに面ごとに違う文章が出るため。
 */
export async function postExcerpt(post: CollectionEntry<'blog'>): Promise<string | undefined> {
  if (post.data.description) return post.data.description;
  const { remarkPluginFrontmatter } = await render(post);
  return remarkPluginFrontmatter.excerpt as string | undefined;
}

/** 記事の日付表記（2026年09月11日）。 */
export function formatDate(d: Date): string {
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
}
