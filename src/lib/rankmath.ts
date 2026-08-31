import { runtimeEnv } from '@/lib/runtime-env';

const WP = () =>
  (runtimeEnv('PUBLIC_WP_URL') || runtimeEnv('WP_URL') || 'https://blog.casatrama.cl').replace(
    /\/$/,
    '',
  );

const SITE = () => (runtimeEnv('SITE_URL') || 'https://casatrama.cl').replace(/\/$/, '');

export interface RankMathSeo {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  /** JSON-LD nodes útiles (Product, Article, etc.) ya reescritos al dominio público */
  schemas: Record<string, unknown>[];
  source: 'rankmath-api' | 'rankmath-html' | 'none';
}

function attr(tag: string, name: string): string | undefined {
  const double = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'));
  if (double?.[1]) return decodeHtml(double[1]);
  const single = tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, 'i'));
  if (single?.[1]) return decodeHtml(single[1]);
  return undefined;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function metaBy(head: string, key: string, prop: 'name' | 'property' = 'name') {
  const re = new RegExp(`<meta[^>]+${prop}=["']${key}["'][^>]*>`, 'i');
  const tag = head.match(re)?.[0];
  return tag ? attr(tag, 'content') : undefined;
}

function parseJsonLd(head: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(head))) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw));
    } catch {
      /* ignore malformed */
    }
  }
  return out;
}

function flattenSchemas(raw: unknown[]): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (Array.isArray(record['@graph'])) {
      for (const node of record['@graph']) {
        if (node && typeof node === 'object') nodes.push(node as Record<string, unknown>);
      }
    } else {
      nodes.push(record);
    }
  }
  return nodes;
}

function rewriteUrl(value: string, storefrontCanonical: string, wpProductPath?: string) {
  const wp = WP();
  const site = SITE();
  let next = value;
  if (wpProductPath) {
    next = next.replaceAll(`${wp}${wpProductPath}`, storefrontCanonical.replace(/\/$/, '') + '/');
    next = next.replaceAll(
      `${wp}${wpProductPath}`.replace(/\/$/, ''),
      storefrontCanonical.replace(/\/$/, ''),
    );
  }
  next = next.replaceAll(`${wp}/`, `${site}/`);
  next = next.replaceAll(wp, site);
  return next;
}

function rewriteDeep(
  value: unknown,
  storefrontCanonical: string,
  wpProductPath?: string,
): unknown {
  if (typeof value === 'string') {
    if (value.includes(WP()) || value.startsWith('http')) {
      return rewriteUrl(value, storefrontCanonical, wpProductPath);
    }
    return value.replace(/blog\.casatrama\.cl/gi, 'Casa Trama');
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteDeep(item, storefrontCanonical, wpProductPath));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = rewriteDeep(nested, storefrontCanonical, wpProductPath);
    }
    return out;
  }
  return value;
}

function usefulSchemaTypes(type: unknown) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((item) =>
    ['Product', 'Offer', 'Article', 'BlogPosting', 'NewsArticle', 'FAQPage', 'HowTo', 'BreadcrumbList'].includes(
      String(item),
    ),
  );
}

function sanitizeRobotsForStorefront(robots?: string): string | undefined {
  if (!robots) return undefined;
  // En headless el CMS suele ir noindex; el storefront público debe indexarse.
  const cleaned = robots
    .split(',')
    .map((part) => part.trim())
    .filter((part) => {
      const key = part.toLowerCase();
      return key && key !== 'noindex' && key !== 'nofollow';
    });
  return cleaned.length ? cleaned.join(', ') : undefined;
}

export function parseRankMathHead(
  headHtml: string,
  options: { storefrontCanonical: string; wpPath?: string },
): RankMathSeo {
  const title = headHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description =
    metaBy(headHtml, 'description') || metaBy(headHtml, 'og:description', 'property');
  const robots = sanitizeRobotsForStorefront(metaBy(headHtml, 'robots'));
  const ogTitle = metaBy(headHtml, 'og:title', 'property');
  const ogDescription = metaBy(headHtml, 'og:description', 'property');
  const ogImage = metaBy(headHtml, 'og:image', 'property');
  const ogType = metaBy(headHtml, 'og:type', 'property');
  const twitterCard = metaBy(headHtml, 'twitter:card');

  const schemas = flattenSchemas(parseJsonLd(headHtml))
    .filter((node) => usefulSchemaTypes(node['@type']))
    .map(
      (node) =>
        rewriteDeep(node, options.storefrontCanonical, options.wpPath) as Record<string, unknown>,
    );

  const cleanTitle = title
    ?.replace(/\s*[-|]\s*blog\.casatrama\.cl\s*$/i, '')
    .replace(/\s*[-|]\s*Casa Trama\s*$/i, '')
    .trim();

  return {
    title: cleanTitle || undefined,
    description: description || undefined,
    canonical: options.storefrontCanonical,
    robots,
    ogTitle: ogTitle
      ?.replace(/\s*[-|]\s*blog\.casatrama\.cl\s*$/i, '')
      .replace(/\s*[-|]\s*Casa Trama\s*$/i, '')
      .trim(),
    ogDescription,
    ogImage,
    ogType,
    twitterCard,
    schemas,
    source: 'none',
  };
}

async function fetchGetHead(wpUrl: string): Promise<string | null> {
  const endpoint = `${WP()}/wp-json/rankmath/v1/getHead?url=${encodeURIComponent(wpUrl)}`;
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { success?: boolean; head?: string };
    if (data.success && data.head) return data.head;
  } catch (error) {
    console.warn('[rankmath] getHead falló:', error);
  }
  return null;
}

/** Fallback mientras Headless CMS Support no está activo en Rank Math. */
async function fetchHeadFromHtml(wpUrl: string): Promise<string | null> {
  try {
    const response = await fetch(wpUrl, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'CasaTrama-Storefront/1.0 (+https://casatrama.cl)',
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1];
    return head || null;
  } catch (error) {
    console.warn('[rankmath] HTML head falló:', error);
    return null;
  }
}

export function wpProductPermalink(wooSlug: string) {
  return `${WP()}/producto/${wooSlug}/`;
}

export function wpPostPermalink(slugOrLink: string) {
  if (/^https?:\/\//i.test(slugOrLink)) return slugOrLink;
  return `${WP()}/${slugOrLink.replace(/^\/+|\/+$/g, '')}/`;
}

/**
 * Lee SEO de Rank Math para una URL de WordPress y lo adapta al canonical del storefront.
 */
export async function getRankMathSeo(options: {
  wpUrl: string;
  storefrontCanonical: string;
  wpPath?: string;
}): Promise<RankMathSeo> {
  const empty: RankMathSeo = {
    canonical: options.storefrontCanonical,
    schemas: [],
    source: 'none',
  };

  const fromApi = await fetchGetHead(options.wpUrl);
  if (fromApi) {
    return { ...parseRankMathHead(fromApi, options), source: 'rankmath-api' };
  }

  const fromHtml = await fetchHeadFromHtml(options.wpUrl);
  if (fromHtml) {
    return { ...parseRankMathHead(fromHtml, options), source: 'rankmath-html' };
  }

  return empty;
}
