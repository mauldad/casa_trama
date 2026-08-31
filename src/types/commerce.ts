export type ProductTone = 'camel' | 'mist' | 'moss' | 'natural';

export interface ProductImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductSense {
  key: string;
  label: string;
  value: string;
  /** Nivel visual 1–5 cuando el texto de Woo lo permite */
  level?: number;
  icon: 'touch' | 'leaf' | 'time' | 'guide' | 'alpaca' | 'shield';
}

export interface Product {
  id: number;
  sku: string;
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  /** HTML seguro para la ficha (párrafos, títulos, listas). */
  descriptionHtml?: string;
  shortDescription: string;
  price: number;
  regularPrice?: number;
  currency: 'CLP';
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  stockQuantity?: number;
  featured: boolean;
  tone: ProductTone;
  categories: string[];
  categorySlugs?: string[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  care: string[];
  /** Perfil sensorial (desde atributos Woo o mock) */
  senses?: ProductSense[];
  promise?: string;
  idealFor?: string;
  finish?: string;
}

export interface CartLine {
  key: string;
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  image: ProductImage;
}

export interface StoreApiCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
}

export interface StoreApiProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  is_in_stock: boolean;
  is_featured?: boolean;
  low_stock_remaining: number | null;
  prices: {
    currency_code: string;
    currency_minor_unit: number;
    price: string;
    regular_price: string;
  };
  images: Array<{
    src: string;
    alt: string;
    thumbnail: string;
  }>;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
  attributes: Array<{
    id: number;
    name: string;
    terms: Array<{ id: number; name: string; slug: string }>;
  }>;
}
