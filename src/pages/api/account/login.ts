import type { APIRoute } from 'astro';
import { wpLogin } from '@/lib/account/auth-wp';
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
      turnstileToken?: string;
    };
    const ip = clientIp(request);
    const turnstileToken = String(body.turnstileToken || '');
    const turnstileOk = await verifyTurnstile(turnstileToken, 'login', ip);
    if (!turnstileOk) {
      return json({ error: 'No pudimos verificar la solicitud. Recarga e intenta de nuevo.' }, 403);
    }

    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return json({ error: 'Correo y contraseña son requeridos.' }, 400);
    }

    const allowed = await hitRateLimit(`login:${ip}:${email}`, 12);
    if (!allowed) {
      return json({ error: 'Demasiados intentos. Espera unos minutos.' }, 429);
    }

    const user = await wpLogin(email, password);
    const session = await createAccountSession({
      customerId: user.customerId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
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
    console.error('[account/login]', error);
    return json({ error: 'No pudimos entrar.' }, 401);
  }
};
