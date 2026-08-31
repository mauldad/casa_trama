import { runtimeEnv, runtimeSecret } from '@/lib/runtime-env';
import type { AccountSession } from '@/types/account';
import { ACCOUNT_COOKIE, CSRF_COOKIE, SESSION_TTL_MS } from '@/types/account';

const STORE_NAME = 'account-sessions';
const memory = new Map<string, AccountSession>();

type BlobStore = {
  setJSON: (key: string, data: unknown, options?: { metadata?: Record<string, string> }) => Promise<unknown>;
  get: (key: string, options: { type: 'json' }) => Promise<unknown>;
  delete?: (key: string) => Promise<unknown>;
};

function sessionSecret() {
  const secret = runtimeSecret('CT_SESSION_SECRET');
  if (!secret) throw new Error('CT_SESSION_SECRET no configurada');
  return secret;
}

async function getStore(): Promise<BlobStore | null> {
  const onNetlify = Boolean(
    process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_DEV,
  );
  if (!onNetlify && !import.meta.env.PROD) return null;
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore({ name: STORE_NAME, consistency: 'strong' }) as BlobStore;
  } catch (error) {
    console.warn('[account-sessions] Blobs no disponible:', error);
    return null;
  }
}

async function hmacSign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(sessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Buffer.from(sig).toString('base64url');
}

export async function signSessionId(id: string): Promise<string> {
  const sig = await hmacSign(id);
  return `${id}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<string | undefined> {
  if (!token || !token.includes('.')) return undefined;
  const [id, sig] = token.split('.');
  if (!id || !sig) return undefined;
  const expected = await hmacSign(id);
  if (!timingSafeEqual(sig, expected)) return undefined;
  return id;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const parts = header.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) return decodeURIComponent(rest.join('=') || '');
  }
  return undefined;
}

export function cookieHeader(
  name: string,
  value: string,
  options: { maxAge?: number; httpOnly?: boolean } = {},
) {
  const secure = runtimeEnv('SITE_URL', 'https://casatrama.cl').startsWith('https');
  const bits = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'SameSite=Lax',
    options.httpOnly === false ? '' : 'HttpOnly',
    secure ? 'Secure' : '',
    typeof options.maxAge === 'number' ? `Max-Age=${Math.max(0, options.maxAge)}` : '',
  ].filter(Boolean);
  return bits.join('; ');
}

export function clearCookieHeader(name: string, httpOnly = true) {
  return cookieHeader(name, '', { maxAge: 0, httpOnly });
}

export async function createAccountSession(input: {
  customerId: number;
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<AccountSession> {
  const now = Date.now();
  const session: AccountSession = {
    id: crypto.randomUUID(),
    customerId: input.customerId,
    email: input.email.toLowerCase(),
    firstName: input.firstName || '',
    lastName: input.lastName || '',
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    csrf: crypto.randomUUID(),
  };

  memory.set(session.id, session);
  const store = await getStore();
  if (store) {
    await store.setJSON(session.id, session, {
      metadata: { customerId: String(session.customerId) },
    });
  }
  return session;
}

export async function getAccountSession(id: string): Promise<AccountSession | undefined> {
  const cached = memory.get(id);
  if (cached) {
    if (Date.parse(cached.expiresAt) < Date.now()) {
      await revokeAccountSession(id);
      return undefined;
    }
    return cached;
  }

  const store = await getStore();
  if (!store) return undefined;
  const record = await store.get(id, { type: 'json' });
  if (!record || typeof record !== 'object') return undefined;
  const session = record as AccountSession;
  if (Date.parse(session.expiresAt) < Date.now()) {
    await revokeAccountSession(id);
    return undefined;
  }
  memory.set(id, session);
  return session;
}

export async function revokeAccountSession(id: string) {
  memory.delete(id);
  const store = await getStore();
  if (store?.delete) await store.delete(id);
}

export async function getSessionFromRequest(request: Request): Promise<AccountSession | undefined> {
  const token = parseCookie(request.headers.get('cookie'), ACCOUNT_COOKIE);
  const id = await verifySessionToken(token);
  if (!id) return undefined;
  return getAccountSession(id);
}

export function assertCsrf(request: Request, session: AccountSession): boolean {
  const header = request.headers.get('x-ct-csrf') || '';
  const cookie = parseCookie(request.headers.get('cookie'), CSRF_COOKIE) || '';
  return Boolean(header && cookie && header === session.csrf && cookie === session.csrf);
}

export async function sessionSetCookieHeaders(session: AccountSession): Promise<string[]> {
  const token = await signSessionId(session.id);
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return [
    cookieHeader(ACCOUNT_COOKIE, token, { maxAge, httpOnly: true }),
    cookieHeader(CSRF_COOKIE, session.csrf, { maxAge, httpOnly: false }),
  ];
}

export function sessionClearCookieHeaders(): string[] {
  return [clearCookieHeader(ACCOUNT_COOKIE, true), clearCookieHeader(CSRF_COOKIE, false)];
}

/** Rate limit simple en memoria + Blobs. */
export async function hitRateLimit(
  key: string,
  max = 12,
  windowMs = 10 * 60 * 1000,
): Promise<boolean> {
  const store = await getStore();
  const rlKey = `rl:${key}`;
  const now = Date.now();
  type RL = { count: number; start: number };
  let data: RL = { count: 0, start: now };

  if (store) {
    const existing = await store.get(rlKey, { type: 'json' });
    if (existing && typeof existing === 'object') data = existing as RL;
  } else {
    const existing = memory.get(rlKey as never) as unknown as RL | undefined;
    if (existing) data = existing;
  }

  if (now - data.start > windowMs) data = { count: 0, start: now };
  data.count += 1;

  if (store) await store.setJSON(rlKey, data);
  else memory.set(rlKey as never, data as never);

  return data.count <= max;
}
