// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeOgpCard from './src/plugins/rehype-ogp-card.js';
import rehypeTwitter from './src/plugins/rehype-twitter.js';
import rehypeYoutube from './src/plugins/rehype-youtube.js';

export default defineConfig({
	site: 'https://4sou9.github.io',
	base: '/blog',
	integrations: [sitemap()],
	markdown: {
		shikiConfig: { theme: 'github-dark' },
		rehypePlugins: [rehypeYoutube, rehypeTwitter, rehypeOgpCard],
	},
});
