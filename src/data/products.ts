import type { Product } from '@/types/commerce';

export const products: Product[] = [
  {
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
    images: [
      { src: '/images/casa-trama-hero.webp', alt: 'Estola Luz de Ocre de Casa Trama sobre piedra clara' },
      { src: '/images/bufanda-camel.webp', alt: 'Detalle de la trama fina en baby alpaca camel' },
    ],
    attributes: [
      { name: 'Composición', value: '100% baby alpaca' },
      { name: 'Tacto', value: 'Suave, fino y liviano' },
      { name: 'Color', value: 'Ocre camel' },
      { name: 'Terminación', value: 'Flecos delicados' },
    ],
    care: ['Lavar a mano con agua fría', 'No retorcer', 'Secar extendida a la sombra'],
  },
  {
    id: 102,
    sku: 'CT-BA-001',
    slug: 'bufanda-esencia-baby-alpaca',
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
    images: [
      { src: '/images/bufanda-camel.webp', alt: 'Bufanda Esencia Baby Alpaca color camel cuidadosamente plegada' },
    ],
    attributes: [
      { name: 'Composición', value: '100% baby alpaca' },
      { name: 'Tacto', value: 'Suave y abrigado' },
      { name: 'Color', value: 'Camel' },
      { name: 'Origen', value: 'Selección andina' },
    ],
    care: ['Lavar a mano con agua fría', 'Usar jabón neutro', 'Guardar doblada'],
  },
  {
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
    images: [
      { src: '/images/bufanda-azul-niebla.webp', alt: 'Bufanda Trama Natural azul niebla sobre silla de madera' },
    ],
    attributes: [
      { name: 'Composición', value: 'Algodón, alpaca y lana' },
      { name: 'Tacto', value: 'Suave con cuerpo' },
      { name: 'Color', value: 'Azul niebla' },
      { name: 'Uso', value: 'Media estación e invierno' },
    ],
    care: ['Lavar a mano', 'No usar blanqueador', 'Secar en superficie plana'],
  },
];

export const getMockProduct = (slug: string) => products.find((product) => product.slug === slug);
