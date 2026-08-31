import { buildPasswordResetHtml } from '@/lib/email/templates';
import { getEmailFrom, getOrdersInbox, getResendClient } from '@/lib/email/resend';
import { passwordResetUrl } from '@/lib/account/password-reset';

export async function sendPasswordResetEmail(input: {
  email: string;
  firstName?: string;
  token: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[password-reset] RESEND_API_KEY no configurada');
    return { ok: false as const, reason: 'missing_resend' as const };
  }

  const resetUrl = passwordResetUrl(input.token);
  const name = input.firstName?.trim() || 'hola';
  const tokenId = input.token.split('.')[0] || input.token;
  const text = [
    'Restablece tu acceso · Casa Trama',
    '',
    `Hola ${name}, recibimos una solicitud para restablecer la contraseña de tu acceso en Casa Trama.`,
    'Si fuiste tú, abre este enlace. Caduca en una hora.',
    resetUrl,
    '',
    'Si no pediste este cambio, ignora este correo. Tu contraseña actual sigue igual.',
  ].join('\n');

  const { data, error } = await resend.emails.send(
    {
      from: getEmailFrom(),
      to: [input.email],
      replyTo: getOrdersInbox(),
      subject: 'Restablece tu acceso · Casa Trama',
      html: buildPasswordResetHtml({ name, resetUrl }),
      text,
    },
    { idempotencyKey: `password-reset/${tokenId}` },
  );

  if (error) {
    console.error('[password-reset] Resend error:', error.message);
    return { ok: false as const, reason: 'send_failed' as const };
  }

  return { ok: true as const, id: data?.id };
}
