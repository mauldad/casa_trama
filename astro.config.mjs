import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import { getCatalogSitemapPages } from './scripts/sitemap-catalog.mjs';

const catalogPages = await getCatalogSitemapPages();

export default defineConfig({
  site: process.env.SITE_URL || 'https://casatrama.cl',
  output: 'server',
  adapter: netlify(),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/carro') &&
        !page.includes('/carrito') &&
        !page.includes('/checkout') &&
        !page.includes('/pedido/') &&
        !page.includes('/api/') &&
        !page.includes('/feeds/'),
      customPages: catalogPages,
      serialize(item) {
        return {
          ...item,
          lastmod: item.lastmod ?? new Date(),
        };
      },
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
        '@netlify/blobs',
        '@fontsource/dm-sans',
        '@fontsource/cormorant-garamond',
      ],
    },
  },
});
