// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

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
import rehypeBtn from './src/plugins/rehype-btn.js';
import rehypeFigure from './src/plugins/rehype-figure.js';
import rehypeOgpCard from './src/plugins/rehype-ogp-card.js';
import rehypeSteam from './src/plugins/rehype-steam.js';
import rehypeTwitter from './src/plugins/rehype-twitter.js';
import rehypeYoutube from './src/plugins/rehype-youtube.js';
import { remarkExcerpt } from './src/plugins/remark-excerpt.js';

export default defineConfig({
	site: 'https://4sou9.github.io',
	base: '/blog',
	integrations: [sitemap(), watchPlugins()],
	markdown: {
		shikiConfig: { theme: 'github-dark' },
		remarkPlugins: [remarkExcerpt, rehypeBtn],
		rehypePlugins: [rehypeYoutube, rehypeTwitter, rehypeSteam, rehypeOgpCard, rehypeFigure],
	},
});
