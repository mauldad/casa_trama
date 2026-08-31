import type { APIRoute } from 'astro';
import { logoutResponse } from '@/lib/account/http';
import { getSessionFromRequest, revokeAccountSession } from '@/lib/account/session';

export const POST: APIRoute = async ({ request }) => {
  const session = await getSessionFromRequest(request);
  if (session) await revokeAccountSession(session.id);
  return logoutResponse();
};
