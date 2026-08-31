export const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);

const decodeEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

export const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const stripHtml = (html: string) =>
  decodeEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());

const ALLOWED_TAGS = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br']);

/**
 * Limpia HTML de Woo para la ficha: conserva estructura legible (títulos, párrafos, listas)
 * y elimina spans/estilos/scripts.
 */
export function sanitizeProductHtml(html: string): string {
  const value = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(?:span|div|font|section|article)(?:\s[^>]*)?>/gi, '')
    .replace(/<\/?b(?:\s[^>]*)?>/gi, (tag) => (tag.startsWith('</') ? '</strong>' : '<strong>'))
    .replace(/<\/?i(?:\s[^>]*)?>/gi, (tag) => (tag.startsWith('</') ? '</em>' : '<em>'))
    .replace(/\s+style="[^"]*"/gi, '')
    .replace(/\s+class="[^"]*"/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/<([^>\s]+)[^>]*>/g, (full, rawName: string) => {
      const name = rawName.toLowerCase().replace(/^\//, '');
      const closing = full.startsWith('</');
      if (!ALLOWED_TAGS.has(name)) return '';
      if (closing) return `</${name}>`;
      if (name === 'br') return '<br />';
      if (name === 'a') {
        const href = full.match(/\shref=("([^"]*)"|'([^']*)')/i);
        const url = (href?.[2] || href?.[3] || '').trim();
        if (!url || /^(javascript|data):/i.test(url)) return '<a>';
        const safe = escapeHtml(url);
        const external = /^https?:\/\//i.test(url);
        return external
          ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">`
          : `<a href="${safe}">`;
      }
      return `<${name}>`;
    })
    .replace(/<(?!\/?(?:p|h2|h3|h4|ul|ol|li|strong|em|a|br)\b)[^>]+>/gi, '')
    .replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br /><br />')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return value;
}

/** Convierte HTML o texto plano de Woo en markup seguro y legible para la ficha. */
export function toProductDescriptionHtml(htmlOrText: string): string {
  const trimmed = htmlOrText.trim();
  if (!trimmed) return '';

  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => `<p>${escapeHtml(part)}</p>`)
      .join('');
  }

  return sanitizeProductHtml(trimmed);
}
