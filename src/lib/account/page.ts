import { getSessionFromRequest } from '@/lib/account/session';

export async function requireAccountPage(request: Request, redirectTo = '/cuenta/entrar/') {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return { session: null as null, redirect: redirectTo };
  }
  return { session, redirect: null as null };
}

export function formatOrderDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

export function formatClp(value: string | number) {
  const amount = typeof value === 'number' ? value : Number(value);
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}
