import type { APIRoute } from 'astro';
import { wpLookupCustomer } from '@/lib/account/auth-wp';
import { clientIp, json } from '@/lib/account/http';
import { createPasswordResetToken } from '@/lib/account/password-reset';
import { hitRateLimit } from '@/lib/account/session';
import { verifyTurnstile } from '@/lib/account/turnstile';
import { sendPasswordResetEmail } from '@/lib/email/password-reset';

const GENERIC_OK = {
  ok: true,
  message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.',
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      email?: string;
      turnstileToken?: string;
    };
    const ip = clientIp(request);
    const turnstileOk = await verifyTurnstile(
      String(body.turnstileToken || ''),
      'password-forgot',
      ip,
    );
    if (!turnstileOk) {
      return json({ error: 'No pudimos verificar la solicitud. Recarga e intenta de nuevo.' }, 403);
    }

    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    if (!email || !email.includes('@')) {
      return json({ error: 'Ingresa un correo válido.' }, 400);
    }

    const ipAllowed = await hitRateLimit(`pwd-forgot:${ip}`, 8);
    if (!ipAllowed) {
      return json({ error: 'Demasiados intentos. Espera unos minutos.' }, 429);
    }

    const emailAllowed = await hitRateLimit(`pwd-forgot:${email}`, 3);
    if (!emailAllowed) {
      return json(GENERIC_OK);
    }

    try {
      const customer = await wpLookupCustomer(email);
      if (customer) {
        const token = await createPasswordResetToken({
          customerId: customer.customerId,
          email: customer.email,
        });
        const sent = await sendPasswordResetEmail({
          email: customer.email,
          firstName: customer.firstName,
          token,
        });
        if (!sent.ok) {
          console.warn('[password/forgot] email no enviado', { email, reason: sent.reason });
        }
      }
    } catch (error) {
      console.warn('[password/forgot] lookup/send falló:', error);
    }

    return json(GENERIC_OK);
  } catch (error) {
    console.error('[password/forgot]', error);
    return json(GENERIC_OK);
  }
};
