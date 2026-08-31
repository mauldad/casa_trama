import { Resend } from 'resend';
import { runtimeEnv, runtimeSecret } from '@/lib/runtime-env';

export function getResendClient() {
  const apiKey = runtimeSecret('RESEND_API_KEY');
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getEmailFrom() {
  return runtimeEnv('RESEND_FROM_EMAIL', 'Casa Trama <onboarding@resend.dev>');
}

export function getOrdersInbox() {
  return (
    runtimeSecret('ORDERS_TO_EMAIL') ||
    runtimeSecret('CONTACT_TO_EMAIL') ||
    'hola@casatrama.cl'
  );
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatClp(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}
