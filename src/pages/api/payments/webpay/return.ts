import type { APIRoute } from 'astro';
import { getPaymentProvider } from '@/lib/payment';
import {
  getPaymentSession,
  getPaymentSessionByOrderToken,
  updatePaymentSessionStatus,
} from '@/lib/payment/session-store';
import { getSiteUrl } from '@/lib/payment/transbank';

function redirectToOrder(orderToken: string, status: string) {
  const siteUrl = getSiteUrl();
  return Response.redirect(`${siteUrl}/pedido/${orderToken}?status=${status}`, 303);
}

async function readToken(request: Request, url: URL) {
  if (request.method === 'POST') {
    const form = await request.formData();
    return {
      tokenWs: String(form.get('token_ws') || url.searchParams.get('token_ws') || ''),
      tbkToken: String(form.get('TBK_TOKEN') || url.searchParams.get('TBK_TOKEN') || ''),
    };
  }

  return {
    tokenWs: url.searchParams.get('token_ws') || '',
    tbkToken: url.searchParams.get('TBK_TOKEN') || '',
  };
}

export const GET: APIRoute = async (context) => handleReturn(context);
export const POST: APIRoute = async (context) => handleReturn(context);

async function handleReturn({ request, url }: Parameters<APIRoute>[0]) {
  const orderToken = url.searchParams.get('order') || '';
  if (!orderToken) {
    return new Response('Pedido no encontrado.', { status: 400 });
  }

  const { tokenWs, tbkToken } = await readToken(request, url);

  if (tbkToken && !tokenWs) {
    const session = getPaymentSession(tbkToken) || getPaymentSessionByOrderToken(orderToken);
    if (session) updatePaymentSessionStatus(tbkToken, 'cancelled');
    return redirectToOrder(orderToken, 'cancelled');
  }

  if (!tokenWs) {
    return redirectToOrder(orderToken, 'unknown');
  }

  const session = getPaymentSession(tokenWs) || getPaymentSessionByOrderToken(orderToken);
  if (!session) {
    return redirectToOrder(orderToken, 'unknown');
  }

  try {
    const provider = getPaymentProvider();
    const result = await provider.verifyWebhook(
      request.headers,
      JSON.stringify({ token: tokenWs, orderId: session.orderId }),
    );

    return redirectToOrder(orderToken, result.status);
  } catch (error) {
    console.error('[payments/webpay/return]', error);
    updatePaymentSessionStatus(tokenWs, 'rejected');
    return redirectToOrder(orderToken, 'rejected');
  }
}
