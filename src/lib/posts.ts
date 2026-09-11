import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * 一覧に出す記事。unlisted を除き、新しい順に並べる。
 * 記事の露出先を増やすときは自前でフィルタせずこれを使う（除外もれを防ぐため）。
 * 例外は2箇所。astro.config.mjs の sitemap はコレクションより先に評価されるため
 * frontmatter を文字列スキャンしており、[...slug].astro の data-pagefind-body は
 * 記事ページ自身の生成なので個別に unlisted を見ている。
 */
export async function listedPosts(): Promise<CollectionEntry<'blog'>[]> {
  return (await getCollection('blog'))
    .filter((p) => !p.data.unlisted)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 記事の日付表記（2026年09月11日）。 */
export function formatDate(d: Date): string {
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
}
