import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = (site?.href || import.meta.env.SITE_URL || 'https://casatrama.cl').replace(
    /\/$/,
    '',
  );
  const sitemap = `${origin}/sitemap-index.xml`;
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /carro/',
    'Disallow: /carrito/',
    'Disallow: /checkout/',
    'Disallow: /pedido/',
    'Disallow: /api/',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
