import type { NormalizedPaymentStatus } from '@/types/payment';

export interface PaymentLineItem {
  productId: number;
  sku?: string;
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface PaymentCustomer {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  apartment?: string;
  commune?: string;
  region?: string;
  shippingMethod?: string;
}

export interface PaymentSessionRecord {
  orderId: number;
  orderToken: string;
  amount: number;
  buyOrder: string;
  idempotencyKey: string;
  customerEmail: string;
  customer: PaymentCustomer;
  items: PaymentLineItem[];
  status: NormalizedPaymentStatus;
  authorizationCode?: string;
  createdAt: string;
  emailsSentAt?: string;
  /** Cliente Woo autenticado (Mi trama) */
  customerId?: number;
  /** ID / número del pedido creado en WooCommerce */
  wooOrderId?: number;
  wooOrderNumber?: string;
  /** Evidencia de aceptación expresa (Ley 21.719) */
  consent?: {
    acceptTerms: boolean;
    newsletter: boolean;
    capturedAt: string;
  };
}
