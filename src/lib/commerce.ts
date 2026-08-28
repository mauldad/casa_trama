import { products as mockProducts } from '@/data/products';
import { stripHtml } from '@/lib/format';
import type { Product, StoreApiProduct } from '@/types/commerce';

const storeApiUrl = import.meta.env.WOO_STORE_API_URL?.replace(/\/$/, '');

const normalizePrice = (value: string, minorUnit: number) =>
  Math.round(Number(value) / 10 ** minorUnit);

export const normalizeStoreProduct = (item: StoreApiProduct): Product => ({
  id: item.id,
  sku: item.sku || `WC-${item.id}`,
  slug: item.slug,
  name: item.name,
  eyebrow: item.categories[0]?.name || 'Casa Trama',
  description: stripHtml(item.description),
  shortDescription: stripHtml(item.short_description),
  price: normalizePrice(item.prices.price, item.prices.currency_minor_unit),
  regularPrice: normalizePrice(item.prices.regular_price, item.prices.currency_minor_unit),
  currency: 'CLP',
  stockStatus: item.is_in_stock ? 'instock' : 'outofstock',
  stockQuantity: item.low_stock_remaining ?? undefined,
  featured: false,
  tone: 'natural',
  categories: item.categories.map((category) => category.name),
  images: item.images.map((image) => ({ src: image.src, alt: image.alt || item.name })),
  attributes: item.attributes.map((attribute) => ({
    name: attribute.name,
    value: attribute.terms.map((term) => term.name).join(', '),
  })),
  care: [],
});

export async function getProducts(): Promise<Product[]> {
  if (!storeApiUrl) return mockProducts;

  try {
    const response = await fetch(`${storeApiUrl}/products?per_page=24`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Woo Store API respondió ${response.status}`);
    const payload = (await response.json()) as StoreApiProduct[];
    return payload.map(normalizeStoreProduct);
  } catch (error) {
    console.warn('[Casa Trama] Usando catálogo de muestra:', error);
    return mockProducts;
  }
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const allProducts = await getProducts();
  return allProducts.find((product) => product.slug === slug);
}
