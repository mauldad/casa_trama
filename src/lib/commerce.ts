import { products as mockProducts } from '@/data/products';
import { stripHtml, toProductDescriptionHtml } from '@/lib/format';
import { getPublicProductSlug, resolveLookupSlugs } from '@/lib/product-path';
import { buildProductSenses, getAttrValue } from '@/lib/product-profile';
import type { Product, ProductTone, StoreApiCategory, StoreApiProduct } from '@/types/commerce';

const storeApiUrl = import.meta.env.WOO_STORE_API_URL?.replace(/\/$/, '');

const normalizePrice = (value: string, minorUnit: number) =>
  Math.round(Number(value) / 10 ** minorUnit);

const attributeTerms = (item: StoreApiProduct, names: string[]) => {
  const wanted = names.map((name) => name.toLowerCase());
  const attribute = item.attributes.find((entry) => wanted.includes(entry.name.toLowerCase()));
  return attribute?.terms.map((term) => term.name) || [];
};

const attributeValue = (item: StoreApiProduct, names: string[]) => attributeTerms(item, names).join(', ');

const careFromProduct = (item: StoreApiProduct): string[] => {
  const terms = attributeTerms(item, ['Cuidado', 'Care', 'Cuidados']);
  if (terms.length) return terms.map((part) => part.trim()).filter(Boolean);
  return [];
};

const toneFromProduct = (item: StoreApiProduct): ProductTone => {
  const haystack = [
    attributeValue(item, ['Color', 'Tono']),
    item.name,
    ...item.categories.map((category) => category.name),
  ]
    .join(' ')
    .toLowerCase();

  if (/niebla|azul|mist|gris/.test(haystack)) return 'mist';
  if (/musgo|verde|moss|bosque/.test(haystack)) return 'moss';
  if (/camel|ocre|beige|arena|natural/.test(haystack)) return 'camel';
  return 'natural';
};

const isFeaturedProduct = (item: StoreApiProduct) =>
  Boolean(item.is_featured) ||
  (item.tags || []).some((tag) => ['destacado', 'featured', 'seleccion'].includes(tag.slug));

export const normalizeStoreProduct = (item: StoreApiProduct): Product => {
  const attributes = item.attributes
    .filter((attribute) => !['cuidado', 'care', 'cuidados'].includes(attribute.name.toLowerCase()))
    .map((attribute) => ({
      name: attribute.name,
      value: attribute.terms.map((term) => term.name).join(', '),
    }));

  const eyebrow =
    attributeValue(item, ['Línea', 'Linea', 'Eyebrow']) ||
    item.categories[0]?.name ||
    'Casa Trama';

  const senses = buildProductSenses(attributes);

  return {
    id: item.id,
    sku: item.sku || `WC-${item.id}`,
    slug: item.slug,
    name: item.name,
    eyebrow,
    description: stripHtml(item.description),
    descriptionHtml: toProductDescriptionHtml(item.description),
    shortDescription: stripHtml(item.short_description),
    price: normalizePrice(item.prices.price, item.prices.currency_minor_unit),
    regularPrice: normalizePrice(item.prices.regular_price, item.prices.currency_minor_unit),
    currency: 'CLP',
    stockStatus: item.is_in_stock ? 'instock' : 'outofstock',
    stockQuantity: item.low_stock_remaining ?? undefined,
    featured: isFeaturedProduct(item),
    tone: toneFromProduct(item),
    categories: item.categories.map((category) => category.name),
    categorySlugs: item.categories.map((category) => category.slug),
    images: item.images.map((image) => ({ src: image.src, alt: image.alt || item.name })),
    attributes,
    care: careFromProduct(item),
    senses,
    promise: getAttrValue(attributes, ['Promesa', 'Por qué elegirla', 'Por que elegirla', 'Motivo']),
    idealFor: getAttrValue(attributes, ['Ideal para', 'Momento', 'Uso', 'Ocasión', 'Ocasion']),
    finish: getAttrValue(attributes, ['Terminación', 'Terminacion', 'Acabado']),
  };
};

async function fetchStore<T>(path: string): Promise<T> {
  if (!storeApiUrl) throw new Error('WOO_STORE_API_URL no configurada');
  const response = await fetch(`${storeApiUrl}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Woo Store API respondió ${response.status}`);
  return (await response.json()) as T;
}

export async function getCategories(): Promise<StoreApiCategory[]> {
  if (!storeApiUrl) {
    const names = [...new Set(mockProducts.flatMap((product) => product.categories))];
    return names.map((name, index) => ({
      id: index + 1,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: '',
      parent: 0,
      count: mockProducts.filter((product) => product.categories.includes(name)).length,
    }));
  }

  try {
    const categories = await fetchStore<StoreApiCategory[]>('/products/categories?per_page=100');
    return categories
      .filter((category) => category.count > 0 && category.slug !== 'uncategorized')
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  } catch (error) {
    console.warn('[Casa Trama] Categorías mock:', error);
    return getCategoriesFallbackFromProducts(await getProducts());
  }
}

const getCategoriesFallbackFromProducts = (products: Product[]): StoreApiCategory[] => {
  const map = new Map<string, StoreApiCategory>();
  products.forEach((product) => {
    product.categories.forEach((name, index) => {
      const slug = product.categorySlugs?.[index] || name.toLowerCase().replace(/\s+/g, '-');
      const current = map.get(slug);
      if (current) current.count += 1;
      else map.set(slug, { id: map.size + 1, name, slug, description: '', parent: 0, count: 1 });
    });
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

export async function getProducts(options: { category?: string; featured?: boolean } = {}): Promise<Product[]> {
  if (!storeApiUrl) {
    return filterProducts(mockProducts, options);
  }

  try {
    const params = new URLSearchParams({ per_page: '100' });
    if (options.category) params.set('category', options.category);
    const payload = await fetchStore<StoreApiProduct[]>(`/products?${params}`);
    return filterProducts(payload.map(normalizeStoreProduct), options);
  } catch (error) {
    console.warn('[Casa Trama] Usando catálogo de muestra:', error);
    return filterProducts(mockProducts, options);
  }
}

const filterProducts = (products: Product[], options: { category?: string; featured?: boolean }) => {
  let list = products;
  if (options.category) {
    const needle = options.category.toLowerCase();
    list = list.filter(
      (product) =>
        product.categorySlugs?.includes(needle) ||
        product.categories.some((name) => name.toLowerCase() === needle || name.toLowerCase().replace(/\s+/g, '-') === needle),
    );
  }
  if (options.featured) {
    const featured = list.filter((product) => product.featured);
    return featured.length ? featured : list.slice(0, 3);
  }
  return list;
};

export async function getProduct(slug: string): Promise<Product | undefined> {
  const candidates = resolveLookupSlugs(slug);

  if (storeApiUrl) {
    for (const candidate of candidates) {
      try {
        const payload = await fetchStore<StoreApiProduct[]>(
          `/products?slug=${encodeURIComponent(candidate)}`,
        );
        if (payload[0]) return normalizeStoreProduct(payload[0]);
      } catch (error) {
        console.warn('[Casa Trama] Fallback producto individual:', error);
      }
    }
  }

  const allProducts = await getProducts();
  return allProducts.find(
    (product) =>
      candidates.includes(product.slug) ||
      product.slug === slug ||
      getPublicProductSlug(product) === slug,
  );
}

export async function getRelatedProducts(product: Product, limit = 2): Promise<Product[]> {
  const all = await getProducts();
  const related = all.filter(
    (item) =>
      item.id !== product.id &&
      item.categories.some((category) => product.categories.includes(category)),
  );
  if (related.length >= limit) return related.slice(0, limit);
  return all.filter((item) => item.id !== product.id).slice(0, limit);
}
