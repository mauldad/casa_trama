import { runtimeSecret } from '@/lib/runtime-env';

const LOOPS_API = 'https://app.loops.so/api/v1';

export function getLoopsApiKey() {
  return runtimeSecret('LOOPS_API_KEY') || '';
}

export async function upsertLoopsContact(options: {
  email: string;
  source?: string;
  firstName?: string;
  userGroup?: string;
}) {
  const apiKey = getLoopsApiKey();
  if (!apiKey) {
    return { ok: false as const, error: 'LOOPS_API_KEY no configurada' };
  }

  const mailingListId = runtimeSecret('LOOPS_MAILING_LIST_ID');
  const payload: Record<string, unknown> = {
    email: options.email,
    source: options.source || 'Cartas Casa Trama',
    subscribed: true,
    userGroup: options.userGroup || 'cartas',
  };

  if (options.firstName) payload.firstName = options.firstName;
  if (mailingListId) {
    payload.mailingLists = { [mailingListId]: true };
  }

  const create = await fetch(`${LOOPS_API}/contacts/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const createBody = (await create.json().catch(() => ({}))) as {
    success?: boolean;
    id?: string;
    message?: string;
  };

  if (create.ok && createBody.success) {
    return { ok: true as const, id: createBody.id, created: true as const };
  }

  // Ya existe → actualizar y asegurar suscripción
  if (create.status === 409) {
    const update = await fetch(`${LOOPS_API}/contacts/update`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const updateBody = (await update.json().catch(() => ({}))) as {
      success?: boolean;
      id?: string;
      message?: string;
    };

    if (update.ok && updateBody.success) {
      return { ok: true as const, id: updateBody.id, created: false as const };
    }

    return {
      ok: false as const,
      error: updateBody.message || `Loops update ${update.status}`,
    };
  }

  return {
    ok: false as const,
    error: createBody.message || `Loops create ${create.status}`,
  };
}
