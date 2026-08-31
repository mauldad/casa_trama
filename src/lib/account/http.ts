import type { APIContext } from 'astro';
import {
  assertCsrf,
  getSessionFromRequest,
  sessionClearCookieHeaders,
} from '@/lib/account/session';
import type { AccountSession } from '@/types/account';

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  });
}

export function jsonWithCookies(data: unknown, cookies: string[], status = 200) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(data), { status, headers });
}

export async function requireSession(request: Request): Promise<AccountSession | Response> {
  const session = await getSessionFromRequest(request);
  if (!session) return json({ error: 'Debes entrar a Mi trama.' }, 401);
  return session;
}

export async function requireSessionAndCsrf(request: Request): Promise<AccountSession | Response> {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  if (request.method !== 'GET' && request.method !== 'HEAD' && !assertCsrf(request, session)) {
    return json({ error: 'Sesión inválida. Recarga e intenta de nuevo.' }, 403);
  }
  return session;
}

export function clientIp(request: Request) {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export function logoutResponse(message = 'Sesión cerrada.') {
  return jsonWithCookies({ ok: true, message }, sessionClearCookieHeaders());
}

export type { APIContext };
