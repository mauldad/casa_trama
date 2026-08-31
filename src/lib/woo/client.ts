import { runtimeSecret } from '@/lib/runtime-env';

export function getWooRestBaseUrl(): string | undefined {
  const wp = runtimeSecret('PUBLIC_WP_URL') || runtimeSecret('WP_URL');
  if (wp) return `${wp.replace(/\/$/, '')}/wp-json/wc/v3`;

  const store = runtimeSecret('WOO_STORE_API_URL');
  if (store) return store.replace(/\/wp-json\/wc\/store\/v1\/?$/, '/wp-json/wc/v3');

  return undefined;
}

export function hasWooRestCredentials(): boolean {
  return Boolean(runtimeSecret('WC_CONSUMER_KEY') && runtimeSecret('WC_CONSUMER_SECRET'));
}

export async function wooRestFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const base = getWooRestBaseUrl();
  const key = runtimeSecret('WC_CONSUMER_KEY');
  const secret = runtimeSecret('WC_CONSUMER_SECRET');

  if (!base || !key || !secret) {
    throw new Error('WooCommerce REST no configurado (PUBLIC_WP_URL + WC_CONSUMER_KEY/SECRET).');
  }

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const response = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : `Woo REST ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}
