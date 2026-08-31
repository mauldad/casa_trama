import { getAttrValue } from '@/lib/product-profile';
import { getProductPath } from '@/lib/product-path';
import type { Product } from '@/types/commerce';

const SITE = (import.meta.env.SITE_URL || 'https://casatrama.cl').replace(/\/$/, '');

const availabilityMap = {
  instock: 'in_stock',
  outofstock: 'out_of_stock',
  onbackorder: 'backorder',
} as const;

function absoluteUrl(pathOrUrl: string) {
  try {
    return new URL(pathOrUrl, SITE).href;
  } catch {
    return pathOrUrl;
  }
}

function escapeTsv(value: string) {
  return value.replace(/\t/g, ' ').replace(/\r?\n/g, ' ').trim();
}

/** Categoría Google Product Taxonomy aproximada para accesorios textiles. */
export function googleProductCategory(product: Product) {
  const haystack = `${product.name} ${product.categories.join(' ')}`.toLowerCase();
  if (/estola|chal|shawl/.test(haystack)) {
    return 'Apparel & Accessories > Clothing Accessories > Scarves & Shawls';
  }
  if (/bufanda|scarf/.test(haystack)) {
    return 'Apparel & Accessories > Clothing Accessories > Scarves & Shawls';
  }
  return 'Apparel & Accessories > Clothing Accessories';
}

export function merchantRow(product: Product): Record<string, string> {
  const path = getProductPath(product);
  const link = `${SITE}${path}`;
  const image = product.images[0]?.src ? absoluteUrl(product.images[0].src) : '';
  const color = getAttrValue(product.attributes, ['Color', 'Tono']) || '';
  const material =
    getAttrValue(product.attributes, ['Composición', 'Composicion', 'Material', 'Fibra']) || '';
  const description =
    product.shortDescription || product.description || `${product.name} — Casa Trama`;

  return {
    id: product.sku || String(product.id),
    title: product.name.slice(0, 150),
    description: description.slice(0, 5000),
    link,
    image_link: image,
    availability: availabilityMap[product.stockStatus] || 'out_of_stock',
    price: `${product.price} CLP`,
    brand: 'Casa Trama',
    condition: 'new',
    mpn: product.sku || String(product.id),
    google_product_category: googleProductCategory(product),
    product_type: product.categories.join(' > ') || 'Textiles',
    color,
    material,
  };
}

const FEED_COLUMNS = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'availability',
  'price',
  'brand',
  'condition',
  'mpn',
  'google_product_category',
  'product_type',
  'color',
  'material',
] as const;

export function buildMerchantTsv(products: Product[]) {
  const header = FEED_COLUMNS.join('\t');
  const lines = products.map((product) => {
    const row = merchantRow(product);
    return FEED_COLUMNS.map((key) => escapeTsv(row[key] || '')).join('\t');
  });
  return `${[header, ...lines].join('\n')}\n`;
}
