import type { PaymentSessionRecord } from '@/types/payment-session';

const memory = new Map<string, PaymentSessionRecord>();
const STORE_NAME = 'payment-sessions';

type BlobStore = {
  setJSON: (
    key: string,
    data: unknown,
    options?: { metadata?: Record<string, string> },
  ) => Promise<unknown>;
  get: (key: string, options: { type: 'json' }) => Promise<unknown>;
};

async function getSessionStore(): Promise<BlobStore | null> {
  const onNetlify = Boolean(
    process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_DEV,
  );
  if (!onNetlify && !import.meta.env.PROD) return null;

  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore({ name: STORE_NAME, consistency: 'strong' }) as BlobStore;
  } catch (error) {
    console.warn('[payment-sessions] Netlify Blobs no disponible:', error);
    return null;
  }
}

export async function savePaymentSession(token: string, record: PaymentSessionRecord) {
  memory.set(token, record);
  memory.set(`order:${record.orderToken}`, record);

  const store = await getSessionStore();
  if (!store) return;

  await Promise.all([
    store.setJSON(token, record, { metadata: { orderToken: record.orderToken } }),
    store.setJSON(`order:${record.orderToken}`, { ...record, token }, {
      metadata: { orderToken: record.orderToken },
    }),
  ]);
}

export async function getPaymentSession(token: string): Promise<PaymentSessionRecord | undefined> {
  const cached = memory.get(token);
  if (cached) return cached;

  const store = await getSessionStore();
  if (!store) return undefined;

  const record = await store.get(token, { type: 'json' });
  if (!record || typeof record !== 'object') return undefined;
  const parsed = record as PaymentSessionRecord;
  memory.set(token, parsed);
  return parsed;
}

export async function getPaymentSessionByOrderToken(
  orderToken: string,
): Promise<PaymentSessionRecord | undefined> {
  const cached = memory.get(`order:${orderToken}`);
  if (cached) return cached;

  const store = await getSessionStore();
  if (!store) return undefined;

  const record = await store.get(`order:${orderToken}`, { type: 'json' });
  if (!record || typeof record !== 'object') return undefined;
  const parsed = record as PaymentSessionRecord & { token?: string };
  memory.set(`order:${orderToken}`, parsed);
  if (parsed.token) memory.set(parsed.token, parsed);
  return parsed;
}

export async function updatePaymentSessionStatus(
  token: string,
  status: PaymentSessionRecord['status'],
  authorizationCode?: string,
) {
  const current = await getPaymentSession(token);
  if (!current) return;
  const next = { ...current, status, authorizationCode };
  memory.set(token, next);
  memory.set(`order:${next.orderToken}`, next);

  const store = await getSessionStore();
  if (!store) return;
  await Promise.all([
    store.setJSON(token, next, { metadata: { orderToken: next.orderToken } }),
    store.setJSON(`order:${next.orderToken}`, { ...next, token }, {
      metadata: { orderToken: next.orderToken },
    }),
  ]);
}
