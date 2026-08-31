import {
  buildBuyOrder,
  buildSessionId,
  createWebpayTransaction,
  mapTransbankStatus,
} from '@/lib/payment/transbank';
import { savePaymentSession, updatePaymentSessionStatus } from '@/lib/payment/session-store';
import type {
  NormalizedPaymentStatus,
  PaymentOrder,
  PaymentProvider,
  PaymentSession,
  PaymentStatus,
  PublicPaymentConfig,
  RefundResult,
  TransbankCommitResponse,
  WebhookPayload,
} from '@/types/payment';

function mapCommitToStatus(result: TransbankCommitResponse): NormalizedPaymentStatus {
  if (typeof result.response_code === 'number' && result.response_code !== 0) {
    return 'rejected';
  }
  return mapTransbankStatus(result.status);
}

export const webpayPaymentProvider: PaymentProvider = {
  async createPayment(order: PaymentOrder): Promise<PaymentSession> {
    const transaction = createWebpayTransaction();
    const buyOrder = buildBuyOrder(order.orderId);
    const sessionId = buildSessionId(order.idempotencyKey);
    const response = await transaction.create(buyOrder, sessionId, order.amount, order.returnUrl);

    await savePaymentSession(response.token, {
      orderId: order.orderId,
      orderToken: order.orderToken || String(order.orderId),
      amount: order.amount,
      buyOrder,
      idempotencyKey: order.idempotencyKey,
      customerEmail: order.customerEmail,
      customer: order.customer || {
        email: order.customerEmail,
        firstName: '',
        lastName: '',
      },
      items: order.items || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return {
      reference: response.token,
      redirectUrl: response.url,
      formToken: response.token,
      status: 'pending',
    };
  },

  async getPaymentStatus(reference: string): Promise<PaymentStatus> {
    const transaction = createWebpayTransaction();
    const result = (await transaction.status(reference)) as TransbankCommitResponse;
    return {
      reference,
      status: mapCommitToStatus(result),
      amount: result.amount ?? 0,
      currency: 'CLP',
      authorizationCode: result.authorization_code,
      buyOrder: result.buy_order,
    };
  },

  async verifyWebhook(_headers: Headers, body: string): Promise<WebhookPayload> {
    const payload = JSON.parse(body) as { token: string; orderId: number };
    const transaction = createWebpayTransaction();
    const result = (await transaction.commit(payload.token)) as TransbankCommitResponse;
    const status = mapCommitToStatus(result);
    await updatePaymentSessionStatus(payload.token, status, result.authorization_code);

    return {
      reference: payload.token,
      orderId: payload.orderId,
      status,
      amount: result.amount ?? 0,
      authorizationCode: result.authorization_code,
    };
  },

  async refund(reference: string, amount: number): Promise<RefundResult> {
    const transaction = createWebpayTransaction();
    await transaction.refund(reference, amount);
    const status: NormalizedPaymentStatus =
      amount >= (await this.getPaymentStatus(reference)).amount
        ? 'refunded_total'
        : 'refunded_partial';
    await updatePaymentSessionStatus(reference, status);
    return { reference, status, amount };
  },

  mapProviderStatus(status: string): NormalizedPaymentStatus {
    return mapTransbankStatus(status);
  },

  getPublicConfiguration(): PublicPaymentConfig {
    return {
      provider: 'webpay',
      supportsRedirect: true,
      label: 'Webpay Plus',
    };
  },
};
