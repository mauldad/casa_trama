import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '@/lib/account/session';
import { upsertLoopsContact } from '@/lib/loops';
import { getSiteUrl } from '@/lib/payment/transbank';
import { getPaymentProvider } from '@/lib/payment';
import type { PaymentCustomer, PaymentLineItem } from '@/types/payment-session';

interface CreatePaymentBody {
  amount: number;
  customerEmail: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  apartment?: string;
  commune?: string;
  region?: string;
  shippingMethod?: string;
  acceptTerms?: boolean | string | number;
  newsletter?: boolean | string | number;
  consentCapturedAt?: string;
  orderToken?: string;
  items?: Array<{
    productId?: number;
    sku?: string;
    slug?: string;
    name?: string;
    price?: number;
    quantity?: number;
    image?: string;
  }>;
}

const isAccepted = (value: boolean | string | number | undefined) =>
  value === true || value === 1 || value === '1' || value === 'true';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as CreatePaymentBody;
    const amount = Math.round(body.amount);
    const customerEmail = String(body.customerEmail || '')
      .trim()
      .toLowerCase();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Monto inválido.' }), { status: 400 });
    }
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'Correo requerido.' }), { status: 400 });
    }
    if (!isAccepted(body.acceptTerms)) {
      return new Response(
        JSON.stringify({
          error: 'Debes aceptar los términos y la política de privacidad para continuar.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const customer: PaymentCustomer = {
      email: customerEmail,
      firstName: String(body.firstName || '').trim(),
      lastName: String(body.lastName || '').trim(),
      phone: String(body.phone || '').trim() || undefined,
      address: String(body.address || '').trim() || undefined,
      apartment: String(body.apartment || '').trim() || undefined,
      commune: String(body.commune || '').trim() || undefined,
      region: String(body.region || '').trim() || undefined,
      shippingMethod: String(body.shippingMethod || 'agreed').trim(),
    };

    const items: PaymentLineItem[] = (body.items || [])
      .map((item) => ({
        productId: Number(item.productId) || 0,
        sku: item.sku,
        slug: item.slug,
        name: String(item.name || 'Pieza').trim(),
        price: Math.round(Number(item.price) || 0),
        quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
        image: item.image,
      }))
      .filter((item) => item.price > 0);

    const orderId = Date.now();
    const orderToken = body.orderToken || crypto.randomUUID();
    const idempotencyKey = `order/${orderId}/v1`;
    const siteUrl = getSiteUrl();
    const returnUrl = `${siteUrl}/api/payments/webpay/return?order=${orderToken}&oid=${orderId}`;
    const wantsNewsletter = isAccepted(body.newsletter);
    const consentCapturedAt =
      String(body.consentCapturedAt || '').trim() || new Date().toISOString();

    const account = await getSessionFromRequest(request).catch(() => undefined);

    const provider = getPaymentProvider();
    const session = await provider.createPayment({
      orderId,
      amount,
      currency: 'CLP',
      customerEmail,
      returnUrl,
      idempotencyKey,
      orderToken,
      customer,
      items,
      customerId: account?.customerId,
      consent: {
        acceptTerms: true,
        newsletter: wantsNewsletter,
        capturedAt: consentCapturedAt,
      },
    });

    if (wantsNewsletter) {
      void upsertLoopsContact({
        email: customerEmail,
        firstName: customer.firstName || undefined,
        source: 'Cartas Casa Trama · Checkout',
        userGroup: 'cartas',
      }).catch((error) => console.error('[payments/create] loops', error));
    }

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
