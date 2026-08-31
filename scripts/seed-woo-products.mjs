#!/usr/bin/env node
/**
 * Seed Casa Trama mock products into WooCommerce via REST API v3.
 *
 * Usage:
 *   WC_CONSUMER_KEY=ck_xxx WC_CONSUMER_SECRET=cs_xxx node scripts/seed-woo-products.mjs
 *
 * Optional:
 *   WP_URL=https://blog.casatrama.cl
 *   IMAGE_BASE=https://casa-trama.netlify.app
 *
 * Atributos que la ficha de producto lee desde Woo (editables en el admin):
 *   Sensación, Tacto, Calidez, Peso, Caída, Densidad  → indicadores “Cómo se siente”
 *   Promesa                                            → bloque “Por qué elegirla”
 *   Ideal para                                         → contexto de uso
 *   Terminación / Acabado, Composición, Color, Origen  → materia y detalle
 *   Cuidado                                            → cuidados
 * Tip: en Calidez/Peso puedes usar “Alta · 4/5” para el medidor visual.
 */

const WP_URL = (process.env.WP_URL || 'https://blog.casatrama.cl').replace(/\/$/, '');
const IMAGE_BASE = (process.env.IMAGE_BASE || 'https://casa-trama.netlify.app').replace(/\/$/, '');
const KEY = process.env.WC_CONSUMER_KEY;
const SECRET = process.env.WC_CONSUMER_SECRET;

if (!KEY || !SECRET) {
  console.error(`
Faltan credenciales WooCommerce REST API.

En WP Admin → WooCommerce → Ajustes → Avanzado → REST API:
  1. Añadir clave
  2. Permisos: Lectura/Escritura
  3. Copiar Consumer Key y Consumer Secret

Luego:
  WC_CONSUMER_KEY=ck_... WC_CONSUMER_SECRET=cs_... node scripts/seed-woo-products.mjs
`);
  process.exit(1);
}

const auth = Buffer.from(`${KEY}:${SECRET}`).toString('base64');

const products = [
  {
    name: 'Estola Luz de Ocre',
    slug: 'estola-luz-de-ocre',
    type: 'simple',
    status: 'publish',
    featured: true,
    catalog_visibility: 'visible',
    description:
      'Una estola liviana de caída amplia, pensada para envolver sin pesar. Su tono ocre toma la luz con un brillo mate y deja visible la trama fina de la fibra.',
    short_description: 'Baby alpaca liviana, tacto suave y caída envolvente.',
    sku: 'CT-EO-001',
    regular_price: '89900',
    manage_stock: true,
    stock_quantity: 7,
    stock_status: 'instock',
    categories: [{ name: 'Estolas' }, { name: 'Baby alpaca' }],
    images: [
      {
        src: `${IMAGE_BASE}/images/casa-trama-hero.webp`,
        alt: 'Estola Luz de Ocre de Casa Trama sobre piedra clara',
      },
      {
        src: `${IMAGE_BASE}/images/bufanda-camel.webp`,
        alt: 'Detalle de la trama fina en baby alpaca camel',
      },
    ],
    attributes: [
      { name: 'Composición', visible: true, options: ['100% baby alpaca'] },
      { name: 'Tacto', visible: true, options: ['Suave, fino y liviano'] },
      { name: 'Sensación', visible: true, options: ['Calor seco que no pesa'] },
      { name: 'Calidez', visible: true, options: ['Alta · 4/5'] },
      { name: 'Peso', visible: true, options: ['Liviano · 2/5'] },
      { name: 'Caída', visible: true, options: ['Envolvente y fluida'] },
      { name: 'Color', visible: true, options: ['Ocre camel'] },
      { name: 'Origen', visible: true, options: ['Selección andina'] },
      { name: 'Terminación', visible: true, options: ['Flecos delicados'] },
      { name: 'Ideal para', visible: true, options: ['Mañanas frías, atardeceres al aire libre, capas sobre camisa o vestido'] },
      {
        name: 'Promesa',
        visible: true,
        options: ['Abriga sin imponer. La pieza que eliges cuando quieres presencia suave, no volumen.'],
      },
      { name: 'Cuidado', visible: true, options: ['Lavar a mano con agua fría', 'No retorcer', 'Secar extendida a la sombra'] },
    ],
    tags: [{ name: 'Destacado' }],
    meta_data: [
      { key: '_casa_trama_eyebrow', value: 'Edición Casa Trama' },
      { key: '_casa_trama_tone', value: 'camel' },
    ],
  },
  {
    name: 'Bufanda Esencia Baby Alpaca',
    slug: 'bufanda-baby-alpaca',
    type: 'simple',
    status: 'publish',
    featured: true,
    catalog_visibility: 'visible',
    description:
      'Una pieza esencial para días fríos. La fibra de baby alpaca conserva el calor con poco peso y ofrece una superficie fina, uniforme y agradable al contacto.',
    short_description: 'Calidez ligera en baby alpaca color camel.',
    sku: 'CT-BA-001',
    regular_price: '74900',
    manage_stock: true,
    stock_quantity: 12,
    stock_status: 'instock',
    categories: [{ name: 'Bufandas' }, { name: 'Baby alpaca' }],
    images: [
      {
        src: `${IMAGE_BASE}/images/bufanda-camel.webp`,
        alt: 'Bufanda Esencia Baby Alpaca color camel cuidadosamente plegada',
      },
    ],
    attributes: [
      { name: 'Composición', visible: true, options: ['100% baby alpaca'] },
      { name: 'Tacto', visible: true, options: ['Suave y abrigado'] },
      { name: 'Sensación', visible: true, options: ['Abrigar sin peso: como una segunda piel serena'] },
      { name: 'Calidez', visible: true, options: ['Alta · 5/5'] },
      { name: 'Peso', visible: true, options: ['Muy liviano · 1/5'] },
      { name: 'Caída', visible: true, options: ['Natural, se acomoda al cuello'] },
      { name: 'Densidad', visible: true, options: ['Trama fina y uniforme'] },
      { name: 'Color', visible: true, options: ['Camel'] },
      { name: 'Origen', visible: true, options: ['Selección andina'] },
      { name: 'Ideal para', visible: true, options: ['Invierno diario, viaje, ciudad y paisaje'] },
      {
        name: 'Promesa',
        visible: true,
        options: [
          'La bufanda que se siente noble al primer contacto y se vuelve hábito: calor limpio, sin prurito ni exceso.',
        ],
      },
      { name: 'Cuidado', visible: true, options: ['Lavar a mano con agua fría', 'Usar jabón neutro', 'Guardar doblada'] },
    ],
    tags: [{ name: 'Destacado' }],
    meta_data: [
      { key: '_casa_trama_eyebrow', value: 'Fibra esencial' },
      { key: '_casa_trama_tone', value: 'camel' },
    ],
  },
  {
    name: 'Bufanda Trama Natural',
    slug: 'bufanda-trama-natural',
    type: 'simple',
    status: 'publish',
    featured: true,
    catalog_visibility: 'visible',
    description:
      'Una mezcla equilibrada de algodón, alpaca y lana que combina estructura con suavidad. El azul niebla dialoga con tonos piedra, crudos y maderas claras.',
    short_description: 'Textura serena y versátil en tono azul niebla.',
    sku: 'CT-MX-001',
    regular_price: '44900',
    manage_stock: true,
    stock_quantity: 18,
    stock_status: 'instock',
    categories: [{ name: 'Bufandas' }, { name: 'Mezclas' }],
    images: [
      {
        src: `${IMAGE_BASE}/images/bufanda-azul-niebla.webp`,
        alt: 'Bufanda Trama Natural azul niebla sobre silla de madera',
      },
    ],
    attributes: [
      { name: 'Composición', visible: true, options: ['Algodón, alpaca y lana'] },
      { name: 'Tacto', visible: true, options: ['Suave con cuerpo'] },
      { name: 'Sensación', visible: true, options: ['Frescura contenida y textura serena'] },
      { name: 'Calidez', visible: true, options: ['Media · 3/5'] },
      { name: 'Peso', visible: true, options: ['Ligero con estructura · 3/5'] },
      { name: 'Caída', visible: true, options: ['Definida, mantiene forma'] },
      { name: 'Color', visible: true, options: ['Azul niebla'] },
      { name: 'Ideal para', visible: true, options: ['Media estación e invierno suave'] },
      {
        name: 'Promesa',
        visible: true,
        options: ['Versátil sin parecer genérica: la mezcla que acompaña el día completo.'],
      },
      { name: 'Cuidado', visible: true, options: ['Lavar a mano', 'No usar blanqueador', 'Secar en superficie plana'] },
    ],
    tags: [{ name: 'Destacado' }],
    meta_data: [
      { key: '_casa_trama_eyebrow', value: 'Mezcla noble' },
      { key: '_casa_trama_tone', value: 'mist' },
    ],
  },
];

async function wc(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${WP_URL}/wp-json/wc/v3${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!response.ok) {
    const message = json?.message || text.slice(0, 300);
    throw new Error(`${method} ${path} → ${response.status}: ${message}`);
  }
  return json;
}

async function ensureCategory(name) {
  const existing = await wc(`/products/categories?search=${encodeURIComponent(name)}&per_page=100`);
  const match = existing.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (match) return match.id;
  const created = await wc('/products/categories', {
    method: 'POST',
    body: { name },
  });
  return created.id;
}

async function upsertProduct(product) {
  const bySku = await wc(`/products?sku=${encodeURIComponent(product.sku)}`);
  const categoryIds = [];
  for (const category of product.categories) {
    categoryIds.push({ id: await ensureCategory(category.name) });
  }
  const payload = { ...product, categories: categoryIds };

  if (bySku[0]) {
    const updated = await wc(`/products/${bySku[0].id}`, { method: 'PUT', body: payload });
    return { action: 'updated', id: updated.id, slug: updated.slug, name: updated.name };
  }

  const created = await wc('/products', { method: 'POST', body: payload });
  return { action: 'created', id: created.id, slug: created.slug, name: created.name };
}

async function main() {
  console.log(`WooCommerce: ${WP_URL}`);
  console.log(`Imágenes desde: ${IMAGE_BASE}`);
  for (const product of products) {
    const result = await upsertProduct(product);
    console.log(`${result.action}: ${result.name} (#${result.id}) /${result.slug}/`);
  }
  const store = await fetch(`${WP_URL}/wp-json/wc/store/v1/products?per_page=24`);
  const list = await store.json();
  console.log(`\nStore API ahora tiene ${Array.isArray(list) ? list.length : 0} productos.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
