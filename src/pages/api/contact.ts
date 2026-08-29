import type { APIRoute } from 'astro';
import { Resend } from 'resend';

interface ContactBody {
  name?: string;
  email?: string;
  phone?: string;
  topic?: string;
  message?: string;
  company?: string;
}

const topicLabels: Record<string, string> = {
  pieza: 'Elegir una pieza',
  fibra: 'Fibras y materiales',
  pedido: 'Pedido o despacho',
  cuidado: 'Cuidado de textiles',
  otro: 'Otro',
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as ContactBody;

    // Honeypot: bots filled "company"
    if (body.company?.trim()) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const topic = String(body.topic || '').trim();
    const message = String(body.message || '').trim();

    if (!name || name.length > 120) {
      return new Response(JSON.stringify({ error: 'Nombre inválido.' }), { status: 400 });
    }
    if (!email || !isEmail(email) || email.length > 160) {
      return new Response(JSON.stringify({ error: 'Correo inválido.' }), { status: 400 });
    }
    if (!topic || !topicLabels[topic]) {
      return new Response(JSON.stringify({ error: 'Tema inválido.' }), { status: 400 });
    }
    if (!message || message.length < 8 || message.length > 4000) {
      return new Response(JSON.stringify({ error: 'Mensaje inválido.' }), { status: 400 });
    }
    if (phone.length > 40) {
      return new Response(JSON.stringify({ error: 'Teléfono inválido.' }), { status: 400 });
    }

    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'El envío no está configurado todavía.' }), {
        status: 503,
      });
    }

    const to = import.meta.env.CONTACT_TO_EMAIL || 'hola@casatrama.cl';
    const from = import.meta.env.RESEND_FROM_EMAIL || 'Casa Trama <onboarding@resend.dev>';
    const topicLabel = topicLabels[topic];
    const idempotencyKey = `contact/${email}/${topic}/${Math.floor(Date.now() / 60_000)}`;

    const text = [
      `Nombre: ${name}`,
      `Correo: ${email}`,
      phone ? `Teléfono: ${phone}` : null,
      `Tema: ${topicLabel}`,
      '',
      message,
    ]
      .filter(Boolean)
      .join('\n');

    const html = `
      <div style="font-family: Georgia, serif; color: #171713; line-height: 1.6;">
        <p style="font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #725033;">Contacto Casa Trama</p>
        <h1 style="font-weight: 400; font-size: 28px; margin: 8px 0 24px;">Nuevo mensaje</h1>
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
        ${phone ? `<p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>` : ''}
        <p><strong>Tema:</strong> ${escapeHtml(topicLabel)}</p>
        <hr style="border: 0; border-top: 1px solid #e0d8cc; margin: 24px 0;" />
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `.trim();

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      {
        from,
        to: [to],
        replyTo: email,
        subject: `Contacto · ${topicLabel} · ${name}`,
        text,
        html,
      },
      { idempotencyKey },
    );

    if (error) {
      console.error('[contact]', error.message);
      return new Response(JSON.stringify({ error: 'No pudimos enviar el mensaje.' }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[contact]', error);
    return new Response(JSON.stringify({ error: 'No pudimos enviar el mensaje.' }), { status: 500 });
  }
};
