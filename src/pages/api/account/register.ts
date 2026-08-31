import type { APIRoute } from 'astro';
import { wpRegister } from '@/lib/account/auth-wp';
import { clientIp, json, jsonWithCookies } from '@/lib/account/http';
import {
  createAccountSession,
  hitRateLimit,
  sessionSetCookieHeaders,
} from '@/lib/account/session';
import { verifyTurnstile } from '@/lib/account/turnstile';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      turnstileToken?: string;
    };
    const ip = clientIp(request);
    const turnstileToken = String(body.turnstileToken || '');
    const turnstileOk = await verifyTurnstile(turnstileToken, 'signup', ip);
    if (!turnstileOk) {
      return json({ error: 'No pudimos verificar la solicitud. Recarga e intenta de nuevo.' }, 403);
    }

    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();

    if (!email || !password) {
      return json({ error: 'Correo y contraseña son requeridos.' }, 400);
    }
    if (password.length < 8) {
      return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
    }

    const allowed = await hitRateLimit(`register:${ip}`, 8);
    if (!allowed) {
      return json({ error: 'Demasiados intentos. Espera unos minutos.' }, 429);
    }

    const user = await wpRegister({ email, password, firstName, lastName });
    const session = await createAccountSession({
      customerId: user.customerId,
      email: user.email,
      firstName: user.firstName || firstName,
      lastName: user.lastName || lastName,
    });
    const cookies = await sessionSetCookieHeaders(session);

    return jsonWithCookies(
      {
        ok: true,
        customer: {
          id: session.customerId,
          email: session.email,
          firstName: session.firstName,
          lastName: session.lastName,
        },
        csrf: session.csrf,
      },
      cookies,
    );
  } catch (error) {
    console.error('[account/register]', error);
    const status = (error as { status?: number }).status || 400;
    return json({ error: 'No pudimos crear la cuenta.' }, status === 409 ? 409 : 400);
  }
};
