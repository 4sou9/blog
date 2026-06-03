// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
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
	integrations: [sitemap()],
	markdown: {
		shikiConfig: { theme: 'github-dark' },
		remarkPlugins: [remarkExcerpt, rehypeBtn],
		rehypePlugins: [rehypeYoutube, rehypeTwitter, rehypeSteam, rehypeOgpCard, rehypeFigure],
	},
});
