import type { PaymentCustomer, PaymentLineItem } from '@/types/payment-session';

export type NormalizedPaymentStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded_partial'
  | 'refunded_total';

export interface PaymentOrder {
  orderId: number;
  amount: number;
  currency: 'CLP';
  customerEmail: string;
  returnUrl: string;
  idempotencyKey: string;
  orderToken?: string;
  customer?: PaymentCustomer;
  items?: PaymentLineItem[];
}

export interface PaymentSession {
  reference: string;
  redirectUrl?: string;
  formToken?: string;
  status: NormalizedPaymentStatus;
}

export interface PaymentStatus {
  reference: string;
  status: NormalizedPaymentStatus;
  amount: number;
  currency: 'CLP';
  authorizationCode?: string;
  buyOrder?: string;
}

export interface WebhookPayload {
  reference: string;
  orderId: number;
  status: NormalizedPaymentStatus;
  amount: number;
  authorizationCode?: string;
}

export interface RefundResult {
  reference: string;
  status: NormalizedPaymentStatus;
  amount: number;
}

export interface PublicPaymentConfig {
  provider: string;
  supportsRedirect: boolean;
  label: string;
}

export interface PaymentProvider {
  createPayment(order: PaymentOrder): Promise<PaymentSession>;
  getPaymentStatus(reference: string): Promise<PaymentStatus>;
  verifyWebhook(headers: Headers, body: string): Promise<WebhookPayload>;
  refund(reference: string, amount: number): Promise<RefundResult>;
  mapProviderStatus(status: string): NormalizedPaymentStatus;
  getPublicConfiguration(): PublicPaymentConfig;
}

export interface TransbankCommitResponse {
  vci?: string;
  amount?: number;
  status?: string;
  buy_order?: string;
  session_id?: string;
  card_detail?: { card_number?: string };
  accounting_date?: string;
  transaction_date?: string;
  authorization_code?: string;
  payment_type_code?: string;
  response_code?: number;
  installments_number?: number;
}
