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
    // Astro leaves these as bare imports; Netlify functions use nodeBundler:none
    // and only packs a few externals (e.g. transbank-sdk). Bundle them so SSR
    // does not 502 with ERR_MODULE_NOT_FOUND / Unknown file extension ".css".
    ssr: {
      noExternal: [
        'cookie',
        'clsx',
        'zod',
        '@fontsource/dm-sans',
        '@fontsource/cormorant-garamond',
      ],
    },
  },
});
