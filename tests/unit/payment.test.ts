import { describe, expect, it } from 'vitest';
import { mockPaymentProvider } from '@/lib/payment';

describe('mockPaymentProvider', () => {
  it('crea sesiones idempotentes por order', async () => {
    const order = {
      orderId: 100,
      amount: 45900,
      currency: 'CLP' as const,
      customerEmail: 'clienta@example.com',
      returnUrl: 'https://casatrama.cl/pedido/token',
      idempotencyKey: 'order/100/v1',
    };

    const session = await mockPaymentProvider.createPayment(order);
    expect(session.reference).toBe('mock_order/100/v1');
    expect(session.status).toBe('pending');

    const status = await mockPaymentProvider.getPaymentStatus(session.reference);
    expect(status.amount).toBe(45900);
  });

  it('procesa webhooks y actualiza estado', async () => {
    const order = {
      orderId: 101,
      amount: 52000,
      currency: 'CLP' as const,
      customerEmail: 'clienta@example.com',
      returnUrl: 'https://casatrama.cl/pedido/token',
      idempotencyKey: 'order/101/v1',
    };
    const session = await mockPaymentProvider.createPayment(order);
    const payload = await mockPaymentProvider.verifyWebhook(
      new Headers(),
      JSON.stringify({
        reference: session.reference,
        orderId: 101,
        status: 'approved',
        amount: 52000,
      }),
    );
    expect(payload.status).toBe('approved');
    const status = await mockPaymentProvider.getPaymentStatus(session.reference);
    expect(status.status).toBe('approved');
  });
});
