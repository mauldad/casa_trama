import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://casatrama.cl',
  output: 'server',
  adapter: netlify(),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/carro') &&
        !page.includes('/checkout') &&
        !page.includes('/pedido/') &&
        !page.includes('/api/'),
    }),
  ],
  image: {
    responsiveStyles: true,
    layout: 'constrained',
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
