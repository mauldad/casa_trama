import type { APIRoute } from 'astro';
import { json, requireSession } from '@/lib/account/http';
import { listCustomerOrders, orderStatusLabel } from '@/lib/account/woo-customer';

export const GET: APIRoute = async ({ request, url }) => {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  try {
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const orders = await listCustomerOrders(session.customerId, page, 20);
    return json({
      csrf: session.csrf,
      orders: orders.map((order) => ({
        id: order.id,
        number: order.number,
        status: order.status,
        statusLabel: orderStatusLabel(order.status),
        date: order.date_created,
        total: order.total,
        currency: order.currency,
        itemCount: order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        preview: order.line_items?.[0]?.name || 'Pedido Casa Trama',
        image: order.line_items?.[0]?.image?.src || '',
      })),
    });
  } catch (error) {
    console.error('[account/orders]', error);
    return json({ error: 'No pudimos cargar tus pedidos.' }, 500);
  }
};
