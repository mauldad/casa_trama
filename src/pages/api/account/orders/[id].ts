import type { APIRoute } from 'astro';
import { json, requireSession, requireSessionAndCsrf } from '@/lib/account/http';
import { getCustomerOrder, orderStatusLabel } from '@/lib/account/woo-customer';

export const GET: APIRoute = async ({ request, params }) => {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const orderId = Number(params.id);
  if (!orderId) return json({ error: 'Pedido no encontrado.' }, 404);

  try {
    const order = await getCustomerOrder(orderId);
    if (order.customer_id !== session.customerId) {
      return json({ error: 'Pedido no encontrado.' }, 404);
    }

    return json({
      csrf: session.csrf,
      order: {
        id: order.id,
        number: order.number,
        status: order.status,
        statusLabel: orderStatusLabel(order.status),
        date: order.date_created,
        total: order.total,
        currency: order.currency,
        paymentMethod: order.payment_method_title || 'Webpay',
        billing: order.billing,
        shipping: order.shipping,
        items: (order.line_items || []).map((item) => ({
          id: item.id,
          productId: item.product_id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: Math.round(Number(item.total) / Math.max(1, item.quantity)) || 0,
          total: item.total,
          image: item.image?.src || '',
        })),
      },
    });
  } catch (error) {
    console.error('[account/orders/:id GET]', error);
    return json({ error: 'No pudimos cargar el pedido.' }, 500);
  }
};

/** Recompra: líneas listas para el carro local. */
export const POST: APIRoute = async ({ request, params }) => {
  const session = await requireSessionAndCsrf(request);
  if (session instanceof Response) return session;

  const orderId = Number(params.id);
  if (!orderId) return json({ error: 'Pedido no encontrado.' }, 404);

  try {
    const order = await getCustomerOrder(orderId);
    if (order.customer_id !== session.customerId) {
      return json({ error: 'Pedido no encontrado.' }, 404);
    }

    const items = (order.line_items || [])
      .filter((item) => item.product_id > 0)
      .map((item) => ({
        productId: item.product_id,
        sku: item.sku || '',
        name: item.name,
        price: Math.round(Number(item.total) / Math.max(1, item.quantity)) || 0,
        quantity: item.quantity,
        image: item.image?.src || '',
      }));

    return json({ ok: true, items, csrf: session.csrf });
  } catch (error) {
    console.error('[account/orders/:id POST]', error);
    return json({ error: 'No pudimos preparar la recompra.' }, 500);
  }
};
