import { runtimeEnv, runtimeSecret } from '@/lib/runtime-env';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileAction = 'login' | 'signup' | 'password-forgot' | 'password-reset';

function expectedHostnames(): Set<string> {
  return new Set(
    (runtimeEnv('TURNSTILE_HOSTNAMES') || '')
      .split(',')
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function verifyTurnstile(
  token: string | undefined,
  action: TurnstileAction,
  remoteIp: string,
): Promise<boolean> {
  const secret = runtimeSecret('TURNSTILE_SECRET');
  const hostnames = expectedHostnames();

  if (!secret || hostnames.size === 0) {
    console.warn('[turnstile] TURNSTILE_SECRET o TURNSTILE_HOSTNAMES no configurados');
    return false;
  }

  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return false;
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: remoteIp,
      }),
    });
    if (!response.ok) return false;

    const result = (await response.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
      'error-codes'?: string[];
    };

    const hostname = result.hostname?.toLowerCase();
    const actionOk = !result.action || result.action === action;
    const ok = Boolean(
      result.success &&
        actionOk &&
        hostname &&
        hostnames.has(hostname),
    );

    if (!ok) {
      console.warn('[turnstile] siteverify rechazado', {
        success: result.success,
        action: result.action,
        expectedAction: action,
        hostname: result.hostname,
        allowedHostnames: [...hostnames],
        errors: result['error-codes'],
      });
    }

    return ok;
  } catch (error) {
    console.warn('[turnstile] siteverify falló:', error);
    return false;
  }
}
