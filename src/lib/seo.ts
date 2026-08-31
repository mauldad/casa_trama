import type { Product } from '@/types/commerce';
import { getAttrValue } from '@/lib/product-profile';

const SITE = 'https://casatrama.cl';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Casa Trama',
  url: SITE,
  logo: `${SITE}/favicon.svg`,
  description: 'Textiles de fibras nobles, elegidos por su textura, caída y permanencia.',
  areaServed: {
    '@type': 'Country',
    name: 'Chile',
  },
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Casa Trama',
  url: SITE,
  inLanguage: 'es-CL',
  publisher: { '@id': `${SITE}/#organization` },
};

export const productSchema = (product: Product, canonical: string) => {
  const material = getAttrValue(product.attributes, [
    'Composición',
    'Composicion',
    'Material',
    'Fibra',
  ]);
  const color = getAttrValue(product.attributes, ['Color', 'Tono']);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    mpn: product.sku,
    description: product.shortDescription || product.description,
    image: product.images.map((image) => new URL(image.src, canonical).href),
    brand: { '@type': 'Brand', name: 'Casa Trama' },
    ...(material ? { material } : {}),
    ...(color ? { color } : {}),
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: product.currency,
      price: String(product.price),
      priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
        .toISOString()
        .slice(0, 10),
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stockStatus === 'instock'
          ? 'https://schema.org/InStock'
          : product.stockStatus === 'onbackorder'
            ? 'https://schema.org/BackOrder'
            : 'https://schema.org/OutOfStock',
    },
  };
};
