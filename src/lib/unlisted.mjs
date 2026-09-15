import { readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

const CONTENT_DIR = join(process.cwd(), 'src/content/blog');

/**
 * unlisted 記事のスラッグ一覧を frontmatter の文字列スキャンで得る。
 *
 * 本来は astro:content のコレクションが唯一の情報源だが、astro.config.mjs は
 * コレクションより先に評価されるため sitemap の filter からは getCollection を
 * 呼べない。やむを得ずここだけ生のファイルを読んでいる。
 * スキャンとコレクションのズレは checkUnlisted()（astro.config.mjs の integration）
 * がビルド後に検出して落とすので、黙って公開されることはない。
 */
export function unlistedSlugs() {
  const slugs = [];
  for (const entry of readdirSync(CONTENT_DIR, { recursive: true, withFileTypes: true })) {
    if (!entry.name.endsWith('.md')) continue;
    const filePath = join(entry.parentPath ?? entry.path, entry.name);
    const content = readFileSync(filePath, 'utf-8');
    if (!content.startsWith('---')) continue;
    const fmEnd = content.indexOf('\n---', 3);
    const fm = fmEnd === -1 ? content : content.slice(3, fmEnd);
    // クォートの有無・前後の空白・行末コメントを許容する（`unlisted: "true"` 等）
    if (!/^\s*unlisted\s*:\s*(['"]?)true\1\s*(#.*)?$/m.test(fm)) continue;
    // Windows では区切りが \ になるので、スラッグに直す前に / へそろえる
    const rel = filePath.slice(CONTENT_DIR.length + 1).split(sep).join('/');
    slugs.push(rel.replace(/\/index\.md$/, '').replace(/\.md$/, ''));
  }
  return slugs;
}

/**
 * ビルド後の検算。スキャンが取りこぼした unlisted 記事は noindex メタが付いた
 * ページとして dist に出ているので、それが sitemap に載っていれば矛盾している。
 */
export function assertUnlistedExcluded(distDir, pages) {
  const sitemap = readSitemap(distDir);
  if (!sitemap) return;
  const leaked = [];
  for (const { pathname } of pages) {
    const slug = pathname.replace(/\/$/, '');
    const html = tryRead(join(distDir, `${slug || 'index'}.html`));
    if (!html || !/<meta name="robots" content="noindex">/.test(html)) continue;
    if (sitemap.some((url) => url.replace(/\/$/, '').endsWith(`/${slug}`))) leaked.push(slug);
  }
  if (leaked.length) {
    throw new Error(
      `unlisted の記事が sitemap に載っています: ${leaked.join(', ')}\n` +
        'src/lib/unlisted.mjs の unlistedSlugs() が frontmatter を拾えていません。'
    );
  }
}

function readSitemap(distDir) {
  const index = tryRead(join(distDir, 'sitemap-0.xml'));
  if (!index) return null;
  return [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function tryRead(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}
