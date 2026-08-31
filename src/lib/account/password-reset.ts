import { runtimeEnv } from '@/lib/runtime-env';
import { signSessionId, verifySessionToken } from '@/lib/account/session';

const STORE_NAME = 'password-reset-tokens';
const RESET_TTL_MS = 60 * 60 * 1000;

export type PasswordResetRecord = {
  id: string;
  customerId: number;
  email: string;
  expiresAt: string;
};

type BlobStore = {
  setJSON: (key: string, data: unknown) => Promise<unknown>;
  get: (key: string, options: { type: 'json' }) => Promise<unknown>;
  delete?: (key: string) => Promise<unknown>;
};

const memory = new Map<string, PasswordResetRecord>();

async function getStore(): Promise<BlobStore | null> {
  const onNetlify = Boolean(
    process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_DEV,
  );
  if (!onNetlify && !import.meta.env?.PROD) return null;
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore({ name: STORE_NAME, consistency: 'strong' }) as BlobStore;
  } catch (error) {
    console.warn('[password-reset] Blobs no disponible:', error);
    return null;
  }
}

async function saveRecord(record: PasswordResetRecord) {
  memory.set(record.id, record);
  const store = await getStore();
  if (store) await store.setJSON(record.id, record);
}

async function deleteRecord(id: string) {
  memory.delete(id);
  const store = await getStore();
  if (store?.delete) await store.delete(id);
}

export async function createPasswordResetToken(input: {
  customerId: number;
  email: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const record: PasswordResetRecord = {
    id,
    customerId: input.customerId,
    email: input.email.toLowerCase(),
    expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
  };
  await saveRecord(record);
  return signSessionId(id);
}

export async function consumePasswordResetToken(
  token: string | undefined,
): Promise<PasswordResetRecord | undefined> {
  const id = await verifySessionToken(token);
  if (!id) return undefined;

  let record = memory.get(id);
  if (!record) {
    const store = await getStore();
    const raw = store ? await store.get(id, { type: 'json' }) : undefined;
    if (raw && typeof raw === 'object') record = raw as PasswordResetRecord;
  }

  if (!record || Date.parse(record.expiresAt) < Date.now()) {
    await deleteRecord(id);
    return undefined;
  }

  await deleteRecord(id);
  return record;
}

export function passwordResetUrl(token: string) {
  const siteUrl = runtimeEnv('SITE_URL', 'https://casatrama.cl').replace(/\/$/, '');
  return `${siteUrl}/cuenta/restablecer/?token=${encodeURIComponent(token)}`;
}
