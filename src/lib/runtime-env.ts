/**
 * Secretos en Netlify Functions deben preferir process.env en runtime.
 * Si se inlinean con import.meta.env, el escáner de secretos de Netlify los
 * reemplaza por asteriscos en el bundle → 401 en Transbank / APIs externas.
 */
export function runtimeSecret(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess && !fromProcess.includes('****')) return fromProcess;

  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name]?.trim();
  if (fromMeta && !fromMeta.includes('****')) return fromMeta;

  return undefined;
}

export function runtimeEnv(name: string, fallback = ''): string {
  return runtimeSecret(name) || fallback;
}
