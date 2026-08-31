import type { PaymentSessionRecord } from '@/types/payment-session';
import { hasWooRestCredentials, wooRestFetch } from '@/lib/woo/client';

export interface WooOrder {
  id: number;
  number: string;
  status: string;
  total: string;
}

type WooMeta = { key: string; value: string | number | boolean };

function money(value: number) {
  return String(Math.max(0, Math.round(value)));
}

function buildLineItems(session: PaymentSessionRecord) {
  return session.items.map((item) => {
    const lineTotal = money(item.price * item.quantity);
    if (item.productId > 0) {
      return {
        product_id: item.productId,
        quantity: item.quantity,
        subtotal: lineTotal,
        total: lineTotal,
      };
    }
    return {
      name: item.name,
      quantity: item.quantity,
      subtotal: lineTotal,
      total: lineTotal,
      sku: item.sku || undefined,
    };
  });
}

function buildCustomerAddress(session: PaymentSessionRecord) {
  const { customer } = session;
  return {
    first_name: customer.firstName || 'Cliente',
    last_name: customer.lastName || 'Casa Trama',
    email: customer.email || session.customerEmail,
    phone: customer.phone || '',
    address_1: customer.address || 'Por coordinar',
    address_2: customer.apartment || '',
    city: customer.commune || '',
    state: customer.region || '',
    postcode: '',
    country: 'CL',
  };
}

function buildMeta(session: PaymentSessionRecord, authorizationCode?: string): WooMeta[] {
  const meta: WooMeta[] = [
    { key: '_casa_trama_order_token', value: session.orderToken },
    { key: '_casa_trama_buy_order', value: session.buyOrder },
    { key: '_casa_trama_idempotency', value: session.idempotencyKey },
  ];
  if (authorizationCode) {
    meta.push({ key: '_transbank_authorization', value: authorizationCode });
  }
  if (session.consent) {
    meta.push({
      key: '_casa_trama_consent_terms',
      value: session.consent.acceptTerms ? 'yes' : 'no',
    });
    meta.push({
      key: '_casa_trama_consent_newsletter',
      value: session.consent.newsletter ? 'yes' : 'no',
    });
    meta.push({ key: '_casa_trama_consent_at', value: session.consent.capturedAt });
  }
  return meta;
}

/** Busca un pedido ya creado para este token (idempotencia en reintentos). */
export async function findWooOrderByToken(orderToken: string): Promise<WooOrder | undefined> {
  if (!hasWooRestCredentials() || !orderToken) return undefined;

  const orders = await wooRestFetch<WooOrder[]>(
    `/orders?per_page=5&meta_key=_casa_trama_order_token&meta_value=${encodeURIComponent(orderToken)}`,
  );
  return orders[0];
}

/**
 * Crea (o reutiliza) un pedido pagado en WooCommerce tras Webpay aprobado.
 * No lanza si faltan credenciales: solo registra warning.
 */
export async function syncPaidOrderToWoo(
  session: PaymentSessionRecord,
  options: { authorizationCode?: string } = {},
): Promise<{ order?: WooOrder; skipped?: string }> {
  if (!hasWooRestCredentials()) {
    console.warn('[woo/orders] WC_CONSUMER_KEY/SECRET no configuradas; pedido no sincronizado.');
    return { skipped: 'missing-credentials' };
  }

  if (session.wooOrderId) {
    return {
      order: {
        id: session.wooOrderId,
        number: String(session.wooOrderNumber || session.wooOrderId),
        status: 'processing',
        total: money(session.amount),
      },
    };
  }

  const existing = await findWooOrderByToken(session.orderToken);
  if (existing) return { order: existing };

  const address = buildCustomerAddress(session);
  const auth = options.authorizationCode || session.authorizationCode || '';
  const shippingNote =
    session.customer.shippingMethod === 'agreed' || !session.customer.shippingMethod
      ? 'Despacho por coordinar con el cliente.'
      : `Método: ${session.customer.shippingMethod}`;

  const order = await wooRestFetch<WooOrder>('/orders', {
    method: 'POST',
    body: {
      status: 'processing',
      set_paid: true,
      currency: 'CLP',
      payment_method: 'webpay',
      payment_method_title: 'Webpay Plus',
      transaction_id: auth || session.buyOrder,
      customer_id: session.customerId || 0,
      customer_note: shippingNote,
      billing: address,
      shipping: {
        first_name: address.first_name,
        last_name: address.last_name,
        address_1: address.address_1,
        address_2: address.address_2,
        city: address.city,
        state: address.state,
        postcode: address.postcode,
        country: address.country,
        phone: address.phone,
      },
      line_items: buildLineItems(session),
      meta_data: buildMeta(session, auth || undefined),
    },
  });

  return { order };
}
