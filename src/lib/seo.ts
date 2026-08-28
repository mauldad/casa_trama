import type { Product } from '@/types/commerce';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Casa Trama',
  url: 'https://casatrama.cl',
  description: 'Textiles de fibras nobles, elegidos por su textura, caída y permanencia.',
};

export const productSchema = (product: Product, canonical: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  sku: product.sku,
  description: product.shortDescription,
  image: product.images.map((image) => new URL(image.src, canonical).href),
  brand: { '@type': 'Brand', name: 'Casa Trama' },
  offers: {
    '@type': 'Offer',
    url: canonical,
    priceCurrency: product.currency,
    price: product.price,
    availability:
      product.stockStatus === 'instock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
  },
});
