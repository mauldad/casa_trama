import type { APIRoute } from 'astro';
import { getEmailFrom, getResendClient, escapeHtml } from '@/lib/email/resend';
import { emailShell, prose } from '@/lib/email/templates';
import { runtimeEnv } from '@/lib/runtime-env';

interface ContactBody {
  name?: string;
  email?: string;
  phone?: string;
  topic?: string;
  message?: string;
  company?: string;
  privacyConsent?: boolean | string | number;
}

const topicLabels: Record<string, string> = {
  pieza: 'Elegir una pieza',
  fibra: 'Fibras y materiales',
  pedido: 'Pedido o despacho',
  cuidado: 'Cuidado de textiles',
  otro: 'Otro',
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isAccepted = (value: boolean | string | number | undefined) =>
  value === true || value === 1 || value === '1' || value === 'true';

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
    if (!isAccepted(body.privacyConsent)) {
      return new Response(
        JSON.stringify({ error: 'Debes aceptar la Política de Privacidad.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const resend = getResendClient();
    if (!resend) {
      return new Response(JSON.stringify({ error: 'Correo no configurado.' }), { status: 503 });
    }

    const to = runtimeEnv('CONTACT_TO_EMAIL', 'hola@casatrama.cl');
    const from = getEmailFrom();
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

    const html = emailShell({
      title: 'Nuevo mensaje',
      preview: `${name} · ${topicLabel}`,
      eyebrow: 'Contacto · Casa Trama',
      body: `
        ${prose(`Llegó un mensaje desde el sitio.`)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">
          <tr><td style="padding:6px 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#725033;width:38%;">Nombre</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#725033;">Correo</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(email)}</td></tr>
          ${phone ? `<tr><td style="padding:6px 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#725033;">Teléfono</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(phone)}</td></tr>` : ''}
          <tr><td style="padding:6px 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#725033;">Tema</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(topicLabel)}</td></tr>
        </table>
        <div style="margin:28px 0 0;padding:18px;background:#f7f2e8;border:1px solid #ddd2c0;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>
      `,
      footerNote: 'Responder este correo escribe directamente a quien contactó.',
    });

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
