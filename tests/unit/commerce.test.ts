import { describe, expect, it } from 'vitest';
import { normalizeStoreProduct } from '@/lib/commerce';
import type { StoreApiProduct } from '@/types/commerce';

const sampleProduct: StoreApiProduct = {
  id: 42,
  name: 'Bufanda Azul Niebla',
  slug: 'bufanda-azul-niebla',
  sku: 'CT-BAN-001',
  short_description: '<p>Mezcla de alpaca y lana.</p>',
  description: '<p>Textura suave para clima frío.</p>',
  is_in_stock: true,
  low_stock_remaining: 3,
  prices: {
    currency_code: 'CLP',
    currency_minor_unit: 0,
    price: '45900',
    regular_price: '52000',
  },
  images: [{ src: '/images/bufanda.webp', alt: 'Bufanda', thumbnail: '/images/bufanda.webp' }],
  categories: [{ id: 1, name: 'Bufandas', slug: 'bufandas' }],
  attributes: [
    {
      id: 1,
      name: 'Composición',
      terms: [{ id: 1, name: '70% alpaca', slug: '70-alpaca' }],
    },
  ],
};

describe('normalizeStoreProduct', () => {
  it('normaliza precios CLP sin unidad menor', () => {
    const product = normalizeStoreProduct(sampleProduct);
    expect(product.price).toBe(45900);
    expect(product.regularPrice).toBe(52000);
    expect(product.currency).toBe('CLP');
  });

  it('mapea stock, categorías y atributos', () => {
    const product = normalizeStoreProduct(sampleProduct);
    expect(product.stockStatus).toBe('instock');
    expect(product.stockQuantity).toBe(3);
    expect(product.eyebrow).toBe('Bufandas');
    expect(product.attributes[0]?.value).toBe('70% alpaca');
  });

  it('limpia HTML de descripciones', () => {
    const product = normalizeStoreProduct(sampleProduct);
    expect(product.shortDescription).toBe('Mezcla de alpaca y lana.');
    expect(product.description).toBe('Textura suave para clima frío.');
  });

  it('marca agotado cuando no hay stock', () => {
    const product = normalizeStoreProduct({ ...sampleProduct, is_in_stock: false });
    expect(product.stockStatus).toBe('outofstock');
  });

  it('mapea cuidado, featured y tone desde atributos/etiquetas', () => {
    const product = normalizeStoreProduct({
      ...sampleProduct,
      tags: [{ id: 1, name: 'Destacado', slug: 'destacado' }],
      attributes: [
        ...sampleProduct.attributes,
        {
          id: 2,
          name: 'Color',
          terms: [{ id: 2, name: 'Azul niebla', slug: 'azul-niebla' }],
        },
        {
          id: 3,
          name: 'Cuidado',
          terms: [
            { id: 3, name: 'Lavar a mano', slug: 'lavar-a-mano' },
            { id: 4, name: 'Secar plana', slug: 'secar-plana' },
          ],
        },
      ],
    });
    expect(product.featured).toBe(true);
    expect(product.tone).toBe('mist');
    expect(product.care).toEqual(['Lavar a mano', 'Secar plana']);
    expect(product.attributes.some((item) => item.name === 'Cuidado')).toBe(false);
  });
});
