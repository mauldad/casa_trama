import { wooRestFetch } from '@/lib/woo/client';

export interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing: WooAddress;
  shipping: WooAddress;
}

export interface WooAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface WooCustomerOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  customer_id: number;
  payment_method_title?: string;
  billing: WooAddress;
  shipping: WooAddress;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
    sku?: string;
    image?: { src?: string };
  }>;
  meta_data?: Array<{ key: string; value: unknown }>;
}

export async function getWooCustomer(customerId: number) {
  return wooRestFetch<WooCustomer>(`/customers/${customerId}`);
}

export async function updateWooCustomer(
  customerId: number,
  body: Partial<{
    first_name: string;
    last_name: string;
    billing: Partial<WooAddress>;
    shipping: Partial<WooAddress>;
  }>,
) {
  return wooRestFetch<WooCustomer>(`/customers/${customerId}`, {
    method: 'PUT',
    body,
  });
}

export async function listCustomerOrders(customerId: number, page = 1, perPage = 20) {
  return wooRestFetch<WooCustomerOrder[]>(
    `/orders?customer=${customerId}&page=${page}&per_page=${perPage}&orderby=date&order=desc`,
  );
}

export async function getCustomerOrder(orderId: number) {
  return wooRestFetch<WooCustomerOrder>(`/orders/${orderId}`);
}

export function orderStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Por pagar',
    processing: 'En preparación',
    'on-hold': 'En espera',
    completed: 'Entregado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    failed: 'Fallido',
  };
  return map[status] || status;
}
