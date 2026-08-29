#!/usr/bin/env node
/**
 * Borra el post por defecto "Hello world!" y publica una historia Casa Trama.
 *
 * Usage:
 *   WP_USER=admin WP_APP_PASSWORD='xxxx xxxx xxxx xxxx' node scripts/seed-wp-story.mjs
 *
 * Optional:
 *   WP_URL=https://blog.casatrama.cl
 *
 * Crear la Application Password en WP Admin → Usuarios → Perfil → Contraseñas de aplicación.
 */

const WP_URL = (process.env.WP_URL || 'https://blog.casatrama.cl').replace(/\/$/, '');
const USER = process.env.WP_USER;
const PASS = process.env.WP_APP_PASSWORD?.replace(/\s+/g, '');

if (!USER || !PASS) {
  console.error(`
Faltan credenciales de WordPress Application Password.

  WP_USER=tu_usuario WP_APP_PASSWORD='xxxx xxxx xxxx xxxx' node scripts/seed-wp-story.mjs
`);
  process.exit(1);
}

const auth = Buffer.from(`${USER}:${PASS}`).toString('base64');

const story = {
  title: 'La trama que abriga sin imponer',
  slug: 'la-trama-que-abriga-sin-imponer',
  status: 'publish',
  excerpt:
    'Baby alpaca, luz de sur y la decisión de elegir piezas que acompañan el cuerpo sin pedirle protagonismo.',
  content: `
<p>En Casa Trama partimos de una pregunta sencilla: ¿qué se siente al llevar una fibra buena un martes cualquiera?</p>
<p>No buscamos el gesto ruidoso. Buscamos una trama que abrigue sin imponer —una estola que toma la luz de la mañana, una bufanda que recupera su forma después del uso, un tono que dialoga con el bosque y con la ciudad.</p>
<p>Desde Puerto Varas observamos el clima, el tacto y el tiempo. Esa observación guía qué piezas entran al catálogo y cuáles no. La composición clara, el cuidado honesto y la caída de la tela son parte del mismo criterio.</p>
<p>Elegir fibra, en ese sentido, también es una forma de habitar el sur con calma.</p>
`.trim(),
};

async function wp(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${WP_URL}/wp-json/wp/v2${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    const message = payload?.message || text || response.statusText;
    throw new Error(`${method} ${path} → ${response.status}: ${message}`);
  }
  return payload;
}

async function main() {
  console.log(`WordPress: ${WP_URL}`);

  const existing = await wp('/posts?per_page=100&status=publish,draft,pending,private&_fields=id,slug,title,status');
  const hello = (existing || []).filter((post) => {
    const slug = String(post.slug || '').toLowerCase();
    const title = String(post.title?.rendered || '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .toLowerCase();
    return slug === 'hello-world' || title === 'hello world!' || title === 'hello world';
  });

  for (const post of hello) {
    await wp(`/posts/${post.id}?force=true`, { method: 'DELETE' });
    console.log(`Eliminado Hello World (id ${post.id})`);
  }

  const already = (existing || []).find((post) => post.slug === story.slug);
  if (already) {
    const updated = await wp(`/posts/${already.id}`, { method: 'POST', body: story });
    console.log(`Actualizada historia: ${updated.link || updated.slug}`);
    return;
  }

  const created = await wp('/posts', { method: 'POST', body: story });
  console.log(`Publicada historia: ${created.link || created.slug}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
