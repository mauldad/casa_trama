import type { APIRoute } from 'astro';
import { getSiteUrl } from '@/lib/payment/transbank';
import { getPaymentProvider } from '@/lib/payment';

interface CreatePaymentBody {
  amount: number;
  customerEmail: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  orderToken?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as CreatePaymentBody;
    const amount = Math.round(body.amount);

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Monto inválido.' }), { status: 400 });
    }
    if (!body.customerEmail) {
      return new Response(JSON.stringify({ error: 'Correo requerido.' }), { status: 400 });
    }

    const orderId = Date.now();
    const orderToken = body.orderToken || crypto.randomUUID();
    const idempotencyKey = `order/${orderId}/v1`;
    const siteUrl = getSiteUrl();
    const returnUrl = `${siteUrl}/api/payments/webpay/return?order=${orderToken}`;

    const provider = getPaymentProvider();
    const session = await provider.createPayment({
      orderId,
      amount,
      currency: 'CLP',
      customerEmail: body.customerEmail,
      returnUrl,
      idempotencyKey,
      orderToken,
    });

    return new Response(
      JSON.stringify({
        provider: provider.getPublicConfiguration().provider,
        reference: session.reference,
        redirectUrl: session.redirectUrl,
        formToken: session.formToken,
        orderToken,
        status: session.status,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[payments/create]', error);
    return new Response(JSON.stringify({ error: 'No fue posible iniciar el pago.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
