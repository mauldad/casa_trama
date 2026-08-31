import type { APIRoute } from 'astro';
import { getProducts } from '@/lib/commerce';
import { buildMerchantTsv } from '@/lib/merchant';

export const prerender = false;

export const GET: APIRoute = async () => {
  const products = await getProducts();
  const body = buildMerchantTsv(products);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
