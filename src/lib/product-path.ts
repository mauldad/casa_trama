import type { Product } from '@/types/commerce';

/** Segmento de URL de fibra (público) ← slugs/nombres de categoría Woo */
const FIBER_FROM_CATEGORY: Record<string, string> = {
  alpaca: 'alpaca',
  'baby-alpaca': 'alpaca',
  'baby alpaca': 'alpaca',
  algodon: 'algodon',
  algodón: 'algodon',
  'algodon-pima': 'algodon',
  'algodón-pima': 'algodon',
  cotton: 'algodon',
  mezclas: 'mezclas',
  mezcla: 'mezclas',
};

/** Slug público preferido ← slug interno Woo / legacy */
const PUBLIC_SLUG_BY_INTERNAL: Record<string, string> = {
  'bufanda-esencia-baby-alpaca': 'bufanda-baby-alpaca',
};

/** Slug Woo a consultar ← slug público en la URL */
const INTERNAL_SLUG_BY_PUBLIC: Record<string, string> = {
  'bufanda-baby-alpaca': 'bufanda-esencia-baby-alpaca',
};

export const FIBER_PATHS = new Set(['alpaca', 'algodon', 'mezclas']);

const FIBER_LABELS: Record<string, string> = {
  alpaca: 'Alpaca',
  algodon: 'Algodón',
  mezclas: 'Mezclas',
};

export function fiberLabel(fiber: string) {
  return FIBER_LABELS[fiber] || fiber;
}

export function isFiberPath(value: string | undefined): value is string {
  return Boolean(value && FIBER_PATHS.has(value));
}

export function getFiberPath(product: Product): string {
  const candidates = [
    ...(product.categorySlugs || []),
    ...product.categories.map((name) => name.toLowerCase()),
    ...product.categories.map((name) => name.toLowerCase().replace(/\s+/g, '-')),
  ];

  for (const candidate of candidates) {
    const fiber = FIBER_FROM_CATEGORY[candidate];
    if (fiber) return fiber;
  }

  return 'alpaca';
}

export function getPublicProductSlug(product: Product): string {
  return PUBLIC_SLUG_BY_INTERNAL[product.slug] || product.slug;
}

export function getProductPath(product: Product): string {
  return `/${getFiberPath(product)}/${getPublicProductSlug(product)}/`;
}

/** Slugs a probar en Woo / catálogo local para un param de URL */
export function resolveLookupSlugs(publicSlug: string): string[] {
  const internal = INTERNAL_SLUG_BY_PUBLIC[publicSlug];
  return internal && internal !== publicSlug ? [publicSlug, internal] : [publicSlug];
}
