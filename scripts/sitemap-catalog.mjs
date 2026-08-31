/**
 * URLs de catálogo para @astrojs/sitemap (build-time).
 * Duplica el mapeo mínimo de fibras/slugs públicos para no depender de TS paths.
 */

const FIBER_FROM_CATEGORY = {
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

const PUBLIC_SLUG_BY_INTERNAL = {
  'bufanda-esencia-baby-alpaca': 'bufanda-baby-alpaca',
};

const FIBER_HUBS = ['alpaca', 'algodon', 'mezclas'];

function fiberFromProduct(item) {
  const candidates = [
    ...(item.categories || []).map((c) => c.slug),
    ...(item.categories || []).map((c) => String(c.name || '').toLowerCase()),
    ...(item.categories || []).map((c) =>
      String(c.name || '')
        .toLowerCase()
        .replace(/\s+/g, '-'),
    ),
  ];
  for (const candidate of candidates) {
    if (FIBER_FROM_CATEGORY[candidate]) return FIBER_FROM_CATEGORY[candidate];
  }
  return 'alpaca';
}

function publicSlug(item) {
  return PUBLIC_SLUG_BY_INTERNAL[item.slug] || item.slug;
}

function siteBase() {
  return (process.env.SITE_URL || 'https://casatrama.cl').replace(/\/$/, '');
}

async function fetchWooProducts() {
  const api = process.env.WOO_STORE_API_URL?.replace(/\/$/, '');
  if (!api) return [];
  try {
    const res = await fetch(`${api}/products?per_page=100`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Woo ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('[sitemap] No se pudo leer Woo; hubs de fibra sin productos:', error.message);
    return [];
  }
}

export async function getCatalogSitemapPages() {
  const site = siteBase();
  const pages = FIBER_HUBS.map((fiber) => `${site}/${fiber}/`);
  const products = await fetchWooProducts();
  for (const item of products) {
    if (!item?.slug) continue;
    pages.push(`${site}/${fiberFromProduct(item)}/${publicSlug(item)}/`);
  }
  return [...new Set(pages)];
}
