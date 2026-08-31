import type { Product } from '@/types/commerce';
import { toProductDescriptionHtml } from '@/lib/format';
import { buildProductSenses } from '@/lib/product-profile';

const withSenses = (product: Product): Product => ({
  ...product,
  descriptionHtml: product.descriptionHtml || toProductDescriptionHtml(product.description),
  senses: buildProductSenses(product.attributes),
});

export const products: Product[] = [
  withSenses({
    id: 101,
    sku: 'CT-EO-001',
    slug: 'estola-luz-de-ocre',
    name: 'Estola Luz de Ocre',
    eyebrow: 'Edición Casa Trama',
    description:
      'Una estola liviana de caída amplia, pensada para envolver sin pesar. Su tono ocre toma la luz con un brillo mate y deja visible la trama fina de la fibra.',
    shortDescription: 'Baby alpaca liviana, tacto suave y caída envolvente.',
    price: 89900,
    currency: 'CLP',
    stockStatus: 'instock',
    stockQuantity: 7,
    featured: true,
    tone: 'camel',
    categories: ['Estolas', 'Baby alpaca'],
    categorySlugs: ['estolas', 'baby-alpaca'],
    images: [
      { src: '/images/casa-trama-hero.webp', alt: 'Estola Luz de Ocre de Casa Trama sobre piedra clara' },
      { src: '/images/bufanda-camel.webp', alt: 'Detalle de la trama fina en baby alpaca camel' },
    ],
    attributes: [
      { name: 'Composición', value: '100% baby alpaca' },
      { name: 'Tacto', value: 'Suave, fino y liviano' },
      { name: 'Sensación', value: 'Calor seco que no pesa' },
      { name: 'Calidez', value: 'Alta · 4/5' },
      { name: 'Peso', value: 'Liviano · 2/5' },
      { name: 'Caída', value: 'Envolvente y fluida' },
      { name: 'Color', value: 'Ocre camel' },
      { name: 'Origen', value: 'Selección andina' },
      { name: 'Terminación', value: 'Flecos delicados' },
      { name: 'Ideal para', value: 'Mañanas frías, atardeceres al aire libre, capas sobre camisa o vestido' },
      {
        name: 'Promesa',
        value: 'Abriga sin imponer. La pieza que eliges cuando quieres presencia suave, no volumen.',
      },
    ],
    care: ['Lavar a mano con agua fría', 'No retorcer', 'Secar extendida a la sombra'],
    promise: 'Abriga sin imponer. La pieza que eliges cuando quieres presencia suave, no volumen.',
    idealFor: 'Mañanas frías, atardeceres al aire libre, capas sobre camisa o vestido',
    finish: 'Flecos delicados',
  }),
  withSenses({
    id: 102,
    sku: 'CT-BA-001',
    slug: 'bufanda-baby-alpaca',
    name: 'Bufanda Esencia Baby Alpaca',
    eyebrow: 'Fibra esencial',
    description:
      'Una pieza esencial para días fríos. La fibra de baby alpaca conserva el calor con poco peso y ofrece una superficie fina, uniforme y agradable al contacto.',
    shortDescription: 'Calidez ligera en baby alpaca color camel.',
    price: 74900,
    currency: 'CLP',
    stockStatus: 'instock',
    stockQuantity: 12,
    featured: true,
    tone: 'camel',
    categories: ['Bufandas', 'Baby alpaca'],
    categorySlugs: ['bufandas', 'baby-alpaca'],
    images: [
      { src: '/images/bufanda-camel.webp', alt: 'Bufanda Esencia Baby Alpaca color camel cuidadosamente plegada' },
    ],
    attributes: [
      { name: 'Composición', value: '100% baby alpaca' },
      { name: 'Tacto', value: 'Suave y abrigado' },
      { name: 'Sensación', value: 'Abrigar sin peso: como una segunda piel serena' },
      { name: 'Calidez', value: 'Alta · 5/5' },
      { name: 'Peso', value: 'Muy liviano · 1/5' },
      { name: 'Caída', value: 'Natural, se acomoda al cuello' },
      { name: 'Densidad', value: 'Trama fina y uniforme' },
      { name: 'Color', value: 'Camel' },
      { name: 'Origen', value: 'Selección andina' },
      { name: 'Ideal para', value: 'Invierno diario, viaje, ciudad y paisaje' },
      {
        name: 'Promesa',
        value: 'La bufanda que se siente noble al primer contacto y se vuelve hábito: calor limpio, sin prurito ni exceso.',
      },
    ],
    care: ['Lavar a mano con agua fría', 'Usar jabón neutro', 'Guardar doblada'],
    promise:
      'La bufanda que se siente noble al primer contacto y se vuelve hábito: calor limpio, sin prurito ni exceso.',
    idealFor: 'Invierno diario, viaje, ciudad y paisaje',
  }),
  withSenses({
    id: 103,
    sku: 'CT-MX-001',
    slug: 'bufanda-trama-natural',
    name: 'Bufanda Trama Natural',
    eyebrow: 'Mezcla noble',
    description:
      'Una mezcla equilibrada de algodón, alpaca y lana que combina estructura con suavidad. El azul niebla dialoga con tonos piedra, crudos y maderas claras.',
    shortDescription: 'Textura serena y versátil en tono azul niebla.',
    price: 44900,
    currency: 'CLP',
    stockStatus: 'instock',
    stockQuantity: 18,
    featured: true,
    tone: 'mist',
    categories: ['Bufandas', 'Mezclas'],
    categorySlugs: ['bufandas', 'mezclas'],
    images: [
      { src: '/images/bufanda-azul-niebla.webp', alt: 'Bufanda Trama Natural azul niebla sobre silla de madera' },
    ],
    attributes: [
      { name: 'Composición', value: 'Algodón, alpaca y lana' },
      { name: 'Tacto', value: 'Suave con cuerpo' },
      { name: 'Sensación', value: 'Frescura contenida y textura serena' },
      { name: 'Calidez', value: 'Media · 3/5' },
      { name: 'Peso', value: 'Ligero con estructura · 3/5' },
      { name: 'Caída', value: 'Definida, mantiene forma' },
      { name: 'Color', value: 'Azul niebla' },
      { name: 'Ideal para', value: 'Media estación e invierno suave' },
      {
        name: 'Promesa',
        value: 'Versátil sin parecer genérica: la mezcla que acompaña el día completo.',
      },
    ],
    care: ['Lavar a mano', 'No usar blanqueador', 'Secar en superficie plana'],
    promise: 'Versátil sin parecer genérica: la mezcla que acompaña el día completo.',
    idealFor: 'Media estación e invierno suave',
  }),
];

export const getMockProduct = (slug: string) => products.find((product) => product.slug === slug);
