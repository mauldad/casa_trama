/**
 * Secretos en Netlify Functions deben preferir process.env en runtime.
 * Si se inlinean con import.meta.env, el escáner de secretos de Netlify los
 * reemplaza por asteriscos en el bundle → 401 en Transbank / APIs externas.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let cachedDevEnv: Record<string, string> | undefined;

function readDevEnv(name: string): string | undefined {
  if (!import.meta.env.DEV) return undefined;

  if (!cachedDevEnv) {
    cachedDevEnv = {};
    const envPath = resolve(process.cwd(), '.env');
    if (!existsSync(envPath)) return undefined;

    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      cachedDevEnv[key] = value;
    }
  }

  const value = cachedDevEnv[name]?.trim();
  return value && !value.includes('****') ? value : undefined;
}

export function runtimeSecret(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess && !fromProcess.includes('****')) return fromProcess;

  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name]?.trim();
  if (fromMeta && !fromMeta.includes('****')) return fromMeta;

  return readDevEnv(name);
}

export function runtimeEnv(name: string, fallback = ''): string {
  return runtimeSecret(name) || fallback;
}
