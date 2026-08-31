import { runtimeEnv, runtimeSecret } from '@/lib/runtime-env';

export interface WpAuthUser {
  ok: boolean;
  userId: number;
  customerId: number;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

function wpBase() {
  return (runtimeEnv('PUBLIC_WP_URL') || runtimeEnv('WP_URL') || '').replace(/\/$/, '');
}

function authSecret() {
  return runtimeSecret('CT_AUTH_SECRET');
}

async function callAuth<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const base = wpBase();
  const secret = authSecret();
  if (!base || !secret) {
    throw new Error('CT_AUTH_SECRET o PUBLIC_WP_URL no configurados');
  }

  const response = await fetch(`${base}/wp-json/casa-trama/v1${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CT-Auth-Secret': secret,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
    data?: { status?: number };
  } & T;

  if (!response.ok) {
    const err = new Error(data.message || 'No pudimos completar la solicitud.') as Error & {
      status?: number;
      code?: string;
    };
    err.status = response.status;
    err.code = data.code;
    throw err;
  }

  return data as T;
}

export async function wpLogin(email: string, password: string) {
  return callAuth<WpAuthUser>('/auth/login', { email, password });
}

export async function wpRegister(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  return callAuth<WpAuthUser>('/auth/register', input);
}

export async function wpChangePassword(input: {
  email: string;
  currentPassword: string;
  newPassword: string;
}) {
  return callAuth<{ ok: boolean }>('/auth/password', input);
}

export async function wpLookupCustomer(email: string): Promise<WpAuthUser | null> {
  try {
    return await callAuth<WpAuthUser>('/auth/customer-by-email', { email });
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 404) return null;
    throw error;
  }
}

export async function wpSetPassword(customerId: number, password: string) {
  return callAuth<{ ok: boolean }>('/auth/set-password', { customerId, password });
}
