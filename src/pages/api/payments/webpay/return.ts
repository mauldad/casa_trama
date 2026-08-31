import type { APIRoute } from 'astro';
import { getPaymentProvider } from '@/lib/payment';
import {
  getPaymentSession,
  getPaymentSessionByOrderToken,
  updatePaymentSessionStatus,
} from '@/lib/payment/session-store';
import { getSiteUrl } from '@/lib/payment/transbank';
import { sendPaymentFailedEmail, sendPurchaseEmails } from '@/lib/email/orders';

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
    const session =
      (await getPaymentSession(tbkToken)) || (await getPaymentSessionByOrderToken(orderToken));
    if (session) {
      await updatePaymentSessionStatus(tbkToken || tokenWs, 'cancelled');
      try {
        await sendPaymentFailedEmail(session, 'cancelled');
      } catch (error) {
        console.error('[payments/webpay/return] cancel email', error);
      }
    }
    return redirectToOrder(orderToken, 'cancelled');
  }

  if (!tokenWs) {
    return redirectToOrder(orderToken, 'unknown');
  }

  const session =
    (await getPaymentSession(tokenWs)) || (await getPaymentSessionByOrderToken(orderToken));

  try {
    const provider = getPaymentProvider();
    const orderId = session?.orderId || Number(url.searchParams.get('oid')) || Date.now();
    const result = await provider.verifyWebhook(
      request.headers,
      JSON.stringify({ token: tokenWs, orderId }),
    );

    if (session && result.status === 'approved') {
      try {
        await sendPurchaseEmails(
          { ...session, status: 'approved' },
          { authorizationCode: result.authorizationCode, paymentToken: tokenWs },
        );
      } catch (error) {
        console.error('[payments/webpay/return] purchase emails', error);
      }
    } else if (session && result.status === 'rejected') {
      try {
        await sendPaymentFailedEmail(session, 'rejected');
      } catch (error) {
        console.error('[payments/webpay/return] rejected email', error);
      }
    }

    return redirectToOrder(orderToken, result.status);
  } catch (error) {
    console.error('[payments/webpay/return]', error);
    await updatePaymentSessionStatus(tokenWs, 'rejected');
    if (session) {
      try {
        await sendPaymentFailedEmail(session, 'rejected');
      } catch (mailError) {
        console.error('[payments/webpay/return] rejected email', mailError);
      }
    }
    return redirectToOrder(orderToken, 'rejected');
  }
}
