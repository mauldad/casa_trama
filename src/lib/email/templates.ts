import type { PaymentCustomer, PaymentLineItem, PaymentSessionRecord } from '@/types/payment-session';
import { escapeHtml, formatClp } from '@/lib/email/resend';

const INK = '#171713';
const PAPER = '#f7f2e8';
const PAPER_DEEP = '#ebe3d4';
const LINEN = '#e4d9c8';
const CLAY = '#8a6240';
const CLAY_DARK = '#725033';
const MUTED = '#6a6358';
const RULE = '#ddd2c0';
const WHITE = '#fffdf8';

function absoluteUrl(siteUrl: string, path?: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

function hairline() {
  return `<tr><td style="padding:0 40px;"><div style="height:1px;background:${RULE};line-height:1px;font-size:1px;">&nbsp;</div></td></tr>`;
}

function metaRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:6px 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${CLAY_DARK};width:38%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;font-size:14px;line-height:1.5;color:${INK};vertical-align:top;">${value}</td>
    </tr>`;
}

export function emailShell(options: {
  title: string;
  preview: string;
  eyebrow?: string;
  body: string;
  footerNote?: string;
}) {
  const eyebrow = options.eyebrow || 'Casa Trama';
  const footer =
    options.footerNote ||
    'Puerto Varas · Chile · Fibras nobles seleccionadas con calma';

  return `<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(options.title)}</title>
  <!--[if mso]><style>body,table,td{font-family:Georgia,serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${PAPER_DEEP};color:${INK};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${escapeHtml(options.preview)}
    ${'&nbsp;&zwnj;'.repeat(20)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER_DEEP};">
    <tr>
      <td align="center" style="padding:36px 16px 48px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:584px;">
          <tr>
            <td align="center" style="padding:0 0 22px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:${CLAY_DARK};">
              Casa Trama
            </td>
          </tr>
          <tr>
            <td style="background:${WHITE};border:1px solid ${LINEN};box-shadow:0 18px 50px rgba(23,23,19,.06);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:34px 40px 10px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:${CLAY};">
                    ${escapeHtml(eyebrow)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 40px 8px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.12;font-weight:400;letter-spacing:-.02em;color:${INK};">
                    ${escapeHtml(options.title)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 28px;">
                    <div style="width:48px;height:1px;background:${CLAY};opacity:.55;line-height:1px;font-size:1px;">&nbsp;</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 36px;font-family:'Helvetica Neue',Arial,sans-serif;">
                    ${options.body}
                  </td>
                </tr>
                ${hairline()}
                <tr>
                  <td style="padding:22px 40px 28px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.7;color:${MUTED};">
                    ${escapeHtml(footer)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 12px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:.08em;color:${MUTED};">
              Materia · Tacto · Permanencia
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function prose(text: string) {
  return `<p style="margin:0;font-size:15px;line-height:1.72;color:#3f3a33;">${text}</p>`;
}

export function orderBadge(buyOrder: string, extra?: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;background:${PAPER};border:1px solid ${RULE};">
      <tr>
        <td style="padding:16px 18px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${CLAY_DARK};">
          Pedido ${escapeHtml(buyOrder)}${extra ? escapeHtml(extra) : ''}
        </td>
      </tr>
    </table>`;
}

export function itemsTable(items: PaymentLineItem[], amount: number, siteUrl: string) {
  if (!items.length) {
    return `
      <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">
        Total del pedido: <span style="color:${INK};">${formatClp(amount)}</span>
      </p>`;
  }

  const rows = items
    .map((item) => {
      const img = absoluteUrl(siteUrl, item.image);
      const thumb = img
        ? `<img src="${escapeHtml(img)}" width="64" height="80" alt="" style="display:block;width:64px;height:80px;object-fit:cover;border:1px solid ${RULE};" />`
        : `<div style="width:64px;height:80px;background:${PAPER_DEEP};border:1px solid ${RULE};"></div>`;

      return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${RULE};width:76px;vertical-align:top;">${thumb}</td>
        <td style="padding:14px 0 14px 14px;border-bottom:1px solid ${RULE};vertical-align:middle;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.25;color:${INK};">${escapeHtml(item.name)}</div>
          <div style="margin-top:6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};">Cantidad ${item.quantity}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${RULE};vertical-align:middle;text-align:right;font-size:14px;color:${INK};white-space:nowrap;">
          ${formatClp(item.price * item.quantity)}
        </td>
      </tr>`;
    })
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
      ${rows}
      <tr>
        <td colspan="2" style="padding:20px 0 0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${CLAY_DARK};">Total</td>
        <td style="padding:20px 0 0;text-align:right;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1;color:${INK};">${formatClp(amount)}</td>
      </tr>
    </table>`;
}

export function customerDetails(customer: PaymentCustomer) {
  const name = `${customer.firstName} ${customer.lastName}`.trim() || 'Cliente';
  const address = [customer.address, customer.apartment, customer.commune, customer.region]
    .filter(Boolean)
    .join(', ');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <td style="padding:0 0 12px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${CLAY_DARK};">
          Datos del pedido
        </td>
      </tr>
      ${metaRow('Nombre', escapeHtml(name))}
      ${metaRow('Correo', escapeHtml(customer.email))}
      ${customer.phone ? metaRow('Teléfono', escapeHtml(customer.phone)) : ''}
      ${address ? metaRow('Dirección', escapeHtml(address)) : ''}
      ${metaRow('Envío', 'A convenir con el cliente')}
    </table>`;
}

export function ctaButton(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 0;">
      <tr>
        <td style="background:${INK};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 26px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${PAPER};text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function secondaryLink(href: string, label: string) {
  return `
    <p style="margin:18px 0 0;">
      <a href="${escapeHtml(href)}" style="font-size:13px;color:${CLAY_DARK};text-decoration:underline;text-underline-offset:3px;">
        ${escapeHtml(label)}
      </a>
    </p>`;
}

export function buildCustomerConfirmationHtml(
  session: PaymentSessionRecord,
  options: { siteUrl: string; orderUrl: string; authorizationCode?: string },
) {
  const name = session.customer.firstName || 'hola';
  const auth = options.authorizationCode ? ` · Auth ${options.authorizationCode}` : '';

  return emailShell({
    title: 'Tu pedido está confirmado',
    preview: `${name}, recibimos tu pago. Pedido ${session.buyOrder} · ${formatClp(session.amount)}`,
    eyebrow: 'Confirmación · Casa Trama',
    body: `
      ${prose(`${escapeHtml(name)}, recibimos tu pago con Webpay. Prepararemos tu pieza con calma y coordinaremos el envío contigo.`)}
      ${orderBadge(session.buyOrder, auth)}
      ${itemsTable(session.items, session.amount, options.siteUrl)}
      ${customerDetails(session.customer)}
      ${ctaButton(options.orderUrl, 'Ver estado del pedido')}
      ${secondaryLink(options.siteUrl, 'Volver a Casa Trama')}
    `,
    footerNote: 'Gracias por elegir materia que permanece. Si necesitas algo, responde este correo.',
  });
}

export function buildStoreOrderHtml(
  session: PaymentSessionRecord,
  options: { siteUrl: string; authorizationCode?: string },
) {
  const auth = options.authorizationCode ? ` · Auth ${options.authorizationCode}` : '';

  return emailShell({
    title: 'Nuevo pedido pagado',
    preview: `Pedido ${session.buyOrder} · ${formatClp(session.amount)} · ${session.customer.email}`,
    eyebrow: 'Aviso de tienda',
    body: `
      ${prose('Llegó un pedido pagado por Webpay. El envío se conviene directamente con la clienta.')}
      ${orderBadge(session.buyOrder, auth)}
      ${itemsTable(session.items, session.amount, options.siteUrl)}
      ${customerDetails(session.customer)}
    `,
    footerNote: 'Bandeja de pedidos Casa Trama · Responder este correo escribe a la clienta.',
  });
}

export function buildPaymentFailedHtml(options: {
  title: string;
  message: string;
  orderToken: string;
  checkoutUrl: string;
}) {
  return emailShell({
    title: options.title,
    preview: options.message,
    eyebrow: 'Pago · Casa Trama',
    body: `
      ${prose(escapeHtml(options.message))}
      ${orderBadge(options.orderToken)}
      ${ctaButton(options.checkoutUrl, 'Volver al checkout')}
    `,
    footerNote: 'Tu carro sigue disponible. Estamos para acompañarte si lo necesitas.',
  });
}
