import type { APIRoute } from 'astro';
import { getProducts } from '@/lib/commerce';
import { getProductPath } from '@/lib/product-path';

export const GET: APIRoute = async () => {
  const products = await getProducts();
  return Response.json(
    {
      products: products.map((product) => ({
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        eyebrow: product.eyebrow,
        shortDescription: product.shortDescription,
        price: product.price,
        currency: product.currency,
        stockStatus: product.stockStatus,
        categories: product.categories,
        path: getProductPath(product),
        image: product.images[0]
          ? { src: product.images[0].src, alt: product.images[0].alt }
          : null,
      })),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    },
  );
};
