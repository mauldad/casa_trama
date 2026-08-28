import type {
  NormalizedPaymentStatus,
  PaymentOrder,
  PaymentProvider,
  PaymentSession,
  PaymentStatus,
  PublicPaymentConfig,
  RefundResult,
  WebhookPayload,
} from '@/types/payment';

const sessions = new Map<string, PaymentStatus>();

export const mockPaymentProvider: PaymentProvider = {
  async createPayment(order: PaymentOrder): Promise<PaymentSession> {
    const reference = `mock_${order.idempotencyKey}`;
    const status: PaymentStatus = {
      reference,
      status: 'pending',
      amount: order.amount,
      currency: order.currency,
    };
    sessions.set(reference, status);
    return {
      reference,
      redirectUrl: `${order.returnUrl}?reference=${reference}`,
      status: 'pending',
    };
  },

  async getPaymentStatus(reference: string): Promise<PaymentStatus> {
    const session = sessions.get(reference);
    if (!session) {
      throw new Error(`Sesión de pago no encontrada: ${reference}`);
    }
    return session;
  },

  async verifyWebhook(_headers: Headers, body: string): Promise<WebhookPayload> {
    const payload = JSON.parse(body) as {
      reference: string;
      orderId: number;
      status: NormalizedPaymentStatus;
      amount: number;
    };
    const current = sessions.get(payload.reference);
    if (current) {
      sessions.set(payload.reference, { ...current, status: payload.status });
    }
    return payload;
  },

  async refund(reference: string, amount: number): Promise<RefundResult> {
    const session = sessions.get(reference);
    if (!session) {
      throw new Error(`Sesión de pago no encontrada: ${reference}`);
    }
    const status: NormalizedPaymentStatus =
      amount >= session.amount ? 'refunded_total' : 'refunded_partial';
    sessions.set(reference, { ...session, status });
    return { reference, status, amount };
  },

  mapProviderStatus(status: string): NormalizedPaymentStatus {
    const map: Record<string, NormalizedPaymentStatus> = {
      pending: 'pending',
      processing: 'processing',
      approved: 'approved',
      rejected: 'rejected',
      cancelled: 'cancelled',
    };
    return map[status] ?? 'pending';
  },

  getPublicConfiguration(): PublicPaymentConfig {
    return { provider: 'mock', supportsRedirect: true, label: 'Mock' };
  },
};
