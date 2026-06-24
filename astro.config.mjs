// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function getUnlistedSlugs() {
  const dir = join(process.cwd(), 'src/content/blog');
  const slugs = [];
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.name.endsWith('.md')) continue;
    const filePath = join(entry.parentPath ?? entry.path, entry.name);
    const content = readFileSync(filePath, 'utf-8');
    const fmEnd = content.indexOf('---', 3);
    const fm = fmEnd === -1 ? content : content.slice(0, fmEnd);
    if (!fm.includes('unlisted: true')) continue;
    const rel = filePath.replace(dir + '\\', '').replace(dir + '/', '');
    const slug = rel.replace(/[\\/]index\.md$/, '').replace(/\.md$/, '');
    slugs.push(slug);
  }
  return slugs;
}

const unlistedSlugs = getUnlistedSlugs();

function watchPlugins() {
	return {
		name: 'watch-plugins',
		hooks: {
			'astro:server:setup': ({ server }) => {
				server.watcher.add('src/plugins/**/*.js');
				server.watcher.on('change', (file) => {
					if (file.replace(/\\/g, '/').includes('src/plugins')) {
						server.restart();
					}
				});
			},
		},
	};
}
import remarkDirective from 'remark-directive';
import remarkBtn from './src/plugins/remark-btn.js';
import remarkDirectives from './src/plugins/remark-directives.js';
import rehypeExternalLinks from './src/plugins/rehype-external-links.js';
import rehypeFigure from './src/plugins/rehype-figure.js';
import rehypeOgpCard from './src/plugins/rehype-ogp-card.js';
import rehypeTwitter from './src/plugins/rehype-twitter.js';
import rehypeYoutube from './src/plugins/rehype-youtube.js';
import { remarkExcerpt } from './src/plugins/remark-excerpt.js';

export default defineConfig({
	site: 'https://4sou9.github.io',
	base: '/blog',
	integrations: [
		sitemap({
			filter: (page) =>
				!unlistedSlugs.some((slug) => page.includes(`/blog/${slug}/`)) &&
				!page.includes('/blog/ogp/'),
		}),
		watchPlugins(),
	],
	markdown: {
		shikiConfig: { theme: 'github-dark' },
		remarkPlugins: [remarkExcerpt, remarkBtn, remarkDirective, remarkDirectives],
		rehypePlugins: [rehypeYoutube, rehypeTwitter, rehypeOgpCard, rehypeFigure, rehypeExternalLinks],
	},
});
