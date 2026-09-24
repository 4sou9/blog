// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { assertUnlistedExcluded, unlistedSlugs } from './src/lib/unlisted.mjs';
import remarkDirective from 'remark-directive';
import remarkBtn from './src/plugins/remark-btn.js';
import remarkDirectives from './src/plugins/remark-directives.js';
import rehypeExternalLinks from './src/plugins/rehype-external-links.js';
import rehypeFigure from './src/plugins/rehype-figure.js';
import rehypeOgpCard from './src/plugins/rehype-ogp-card.js';
import rehypeTwitter from './src/plugins/rehype-twitter.js';
import rehypeYoutube from './src/plugins/rehype-youtube.js';
import { remarkExcerpt } from './src/plugins/remark-excerpt.js';

// sitemap から unlisted 記事を除外するためのスラッグ一覧。
// この config はコンテンツコレクション（astro:content）より先に評価されるため
// getCollection が使えず、frontmatter を文字列スキャンしている。
// スキャンの取りこぼしは下の checkUnlisted() がビルド後に検出する。
const unlisted = unlistedSlugs();

// スキャンとコレクションのズレを検算する。sitemap の生成後に走らせたいので、
// integrations 配列では sitemap より後ろに置くこと。
function checkUnlisted() {
	return {
		name: 'check-unlisted',
		hooks: {
			'astro:build:done': ({ dir, pages }) => {
				assertUnlistedExcluded(fileURLToPath(dir), pages);
			},
		},
	};
}

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
export default defineConfig({
	site: 'https://neko4.dev',
	base: '/blog',
	trailingSlash: 'never',
	build: { format: 'file' },
	integrations: [
		sitemap({
			filter: (page) =>
				!unlisted.some((slug) => page.endsWith(`/blog/${slug}`)) &&
				!page.endsWith('/blog/ogp'),
		}),
		watchPlugins(),
		checkUnlisted(),
	],
	markdown: {
		shikiConfig: { theme: 'github-dark' },
		remarkPlugins: [remarkExcerpt, remarkBtn, remarkDirective, remarkDirectives],
		rehypePlugins: [rehypeYoutube, rehypeTwitter, rehypeOgpCard, rehypeFigure, rehypeExternalLinks],
	},
});
