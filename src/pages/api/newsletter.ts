import type { APIRoute } from 'astro';
import { getLoopsApiKey, upsertLoopsContact } from '@/lib/loops';

interface NewsletterBody {
  email?: string;
  company?: string;
  source?: string;
  firstName?: string;
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as NewsletterBody;

    // Honeypot
    if (body.company?.trim()) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const firstName = String(body.firstName || '').trim();
    const source = String(body.source || 'Cartas Casa Trama').trim().slice(0, 80);

    if (!email || !isEmail(email) || email.length > 160) {
      return new Response(JSON.stringify({ error: 'Correo inválido.' }), { status: 400 });
    }

    if (!getLoopsApiKey()) {
      return new Response(JSON.stringify({ error: 'Suscripción no configurada.' }), { status: 503 });
    }

    const result = await upsertLoopsContact({
      email,
      source,
      firstName: firstName || undefined,
      userGroup: 'cartas',
    });

    if (!result.ok) {
      console.error('[newsletter]', result.error);
      return new Response(JSON.stringify({ error: 'No pudimos suscribirte ahora.' }), { status: 502 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        id: result.id,
        created: result.created,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('[newsletter]', error);
    return new Response(JSON.stringify({ error: 'No pudimos suscribirte ahora.' }), { status: 500 });
  }
};
