import type { NormalizedPaymentStatus } from '@/types/payment';

export interface PaymentSessionRecord {
  orderId: number;
  orderToken: string;
  amount: number;
  buyOrder: string;
  idempotencyKey: string;
  customerEmail: string;
  status: NormalizedPaymentStatus;
  authorizationCode?: string;
  createdAt: string;
}
