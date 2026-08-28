import type { APIRoute } from 'astro';
import { getProducts } from '@/lib/commerce';

export const GET: APIRoute = async () => {
  const products = await getProducts();
  return Response.json({ products }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
};
