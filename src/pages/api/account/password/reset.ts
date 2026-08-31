import type { APIRoute } from 'astro';
import { wpSetPassword } from '@/lib/account/auth-wp';
import { clientIp, json } from '@/lib/account/http';
import { consumePasswordResetToken } from '@/lib/account/password-reset';
import { hitRateLimit } from '@/lib/account/session';
import { verifyTurnstile } from '@/lib/account/turnstile';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
      turnstileToken?: string;
    };
    const ip = clientIp(request);
    const turnstileOk = await verifyTurnstile(
      String(body.turnstileToken || ''),
      'password-reset',
      ip,
    );
    if (!turnstileOk) {
      return json({ error: 'No pudimos verificar la solicitud. Recarga e intenta de nuevo.' }, 403);
    }

    const token = String(body.token || '').trim();
    const password = String(body.password || '');

    if (!token) {
      return json({ error: 'El enlace no es válido.' }, 400);
    }
    if (password.length < 8) {
      return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
    }

    const allowed = await hitRateLimit(`pwd-reset:${ip}`, 10);
    if (!allowed) {
      return json({ error: 'Demasiados intentos. Espera unos minutos.' }, 429);
    }

    const record = await consumePasswordResetToken(token);
    if (!record) {
      return json({ error: 'El enlace no es válido o expiró. Solicita uno nuevo.' }, 400);
    }

    await wpSetPassword(record.customerId, password);

    return json({
      ok: true,
      message: 'Contraseña actualizada. Ya puedes entrar con tu nueva clave.',
    });
  } catch (error) {
    console.error('[password/reset]', error);
    return json({ error: 'No pudimos restablecer la contraseña.' }, 500);
  }
};
