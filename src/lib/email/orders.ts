import type { PaymentSessionRecord } from '@/types/payment-session';
import { formatClp, getEmailFrom, getOrdersInbox, getResendClient } from '@/lib/email/resend';
import {
  buildCustomerConfirmationHtml,
  buildPaymentFailedHtml,
  buildStoreOrderHtml,
} from '@/lib/email/templates';
import { getSiteUrl } from '@/lib/payment/transbank';
import { savePaymentSession } from '@/lib/payment/session-store';

export async function sendPurchaseEmails(
  session: PaymentSessionRecord,
  options: { authorizationCode?: string; paymentToken: string },
) {
  if (session.emailsSentAt) {
    return { skipped: true as const };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY no configurada; no se enviaron correos de compra.');
    return { skipped: true as const, reason: 'missing-api-key' as const };
  }

  const from = getEmailFrom();
  const storeTo = getOrdersInbox();
  const siteUrl = getSiteUrl();
  const orderUrl = `${siteUrl}/pedido/${session.orderToken}/?status=approved`;
  const auth = options.authorizationCode ? ` · Auth ${options.authorizationCode}` : '';
  const name = session.customer.firstName || 'hola';

  const customerHtml = buildCustomerConfirmationHtml(session, {
    siteUrl,
    orderUrl,
    authorizationCode: options.authorizationCode,
  });

  const customerText = [
    `Tu pedido está confirmado`,
    ``,
    `${name}, recibimos tu pago con Webpay.`,
    `Pedido ${session.buyOrder}${auth}`,
    `Total ${formatClp(session.amount)}`,
    `Estado: ${orderUrl}`,
    ``,
    `Gracias por elegir Casa Trama.`,
  ].join('\n');

  const storeHtml = buildStoreOrderHtml(session, {
    siteUrl,
    authorizationCode: options.authorizationCode,
  });

  const storeText = [
    `Nuevo pedido pagado`,
    `Pedido ${session.buyOrder}${auth}`,
    `Total ${formatClp(session.amount)}`,
    `Cliente ${session.customer.email}`,
    session.customer.phone ? `Tel ${session.customer.phone}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const customerResult = await resend.emails.send(
    {
      from,
      to: [session.customerEmail],
      replyTo: storeTo,
      subject: `Pedido confirmado · ${session.buyOrder}`,
      html: customerHtml,
      text: customerText,
    },
    { idempotencyKey: `order-confirmation/${session.orderToken}` },
  );

  if (customerResult.error) {
    console.error('[email] customer confirmation failed:', customerResult.error.message);
    return { ok: false as const, error: customerResult.error.message };
  }

  const storeResult = await resend.emails.send(
    {
      from,
      to: [storeTo],
      replyTo: session.customerEmail,
      subject: `Nuevo pedido · ${session.buyOrder} · ${formatClp(session.amount)}`,
      html: storeHtml,
      text: storeText,
    },
    { idempotencyKey: `order-notify-store/${session.orderToken}` },
  );

  if (storeResult.error) {
    console.error('[email] store notification failed:', storeResult.error.message);
  }

  await savePaymentSession(options.paymentToken, {
    ...session,
    status: 'approved',
    authorizationCode: options.authorizationCode || session.authorizationCode,
    emailsSentAt: new Date().toISOString(),
  });

  return {
    ok: true as const,
    customerId: customerResult.data?.id,
    storeId: storeResult.data?.id,
  };
}

export async function sendPaymentFailedEmail(session: PaymentSessionRecord, status: 'rejected' | 'cancelled') {
  const resend = getResendClient();
  if (!resend) return { skipped: true as const };

  const from = getEmailFrom();
  const storeTo = getOrdersInbox();
  const siteUrl = getSiteUrl();
  const checkoutUrl = `${siteUrl}/checkout/`;
  const title = status === 'cancelled' ? 'Pago cancelado' : 'Pago no completado';
  const message =
    status === 'cancelled'
      ? 'Saliste de Webpay sin completar el cobro. Tu carro sigue disponible si quieres intentarlo de nuevo.'
      : 'Webpay no pudo autorizar el cobro. Puedes volver al checkout e intentarlo nuevamente.';

  const html = buildPaymentFailedHtml({
    title,
    message,
    orderToken: session.orderToken,
    checkoutUrl,
  });

  const { error } = await resend.emails.send(
    {
      from,
      to: [session.customerEmail],
      replyTo: storeTo,
      subject: `${title} · Casa Trama`,
      html,
      text: `${title}\n\n${message}\nReferencia ${session.orderToken}\n${checkoutUrl}`,
    },
    { idempotencyKey: `order-${status}/${session.orderToken}` },
  );

  if (error) {
    console.error('[email] payment failed mail:', error.message);
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
