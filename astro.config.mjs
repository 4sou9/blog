// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://4sou9.github.io',
	base: '/blog',
	integrations: [sitemap()],
});
