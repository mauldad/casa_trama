import { stripHtml } from '@/lib/format';
import type { Story, WpMedia, WpPost } from '@/types/wordpress';

const wpUrl = import.meta.env.PUBLIC_WP_URL?.replace(/\/$/, '');

const fallbackStories: Story[] = [
  {
    id: 1,
    slug: 'la-trama-que-abriga-sin-imponer',
    title: 'La trama que abriga sin imponer',
    excerpt:
      'Baby alpaca, luz de sur y la decisión de elegir piezas que acompañan el cuerpo sin pedirle protagonismo.',
    content: `
<p>En Casa Trama partimos de una pregunta sencilla: ¿qué se siente al llevar una fibra buena un martes cualquiera?</p>
<p>No buscamos el gesto ruidoso. Buscamos una trama que abrigue sin imponer —una estola que toma la luz de la mañana, una bufanda que recupera su forma después del uso, un tono que dialoga con el bosque y con la ciudad.</p>
<p>Desde Puerto Varas observamos el clima, el tacto y el tiempo. Esa observación guía qué piezas entran al catálogo y cuáles no. La composición clara, el cuidado honesto y la caída de la tela son parte del mismo criterio.</p>
<p>Elegir fibra, en ese sentido, también es una forma de habitar el sur con calma.</p>
`.trim(),
    date: '2026-08-29',
    index: '01',
  },
  {
    id: 2,
    slug: 'como-reconocer-una-fibra-que-vale-la-pena',
    title: 'Cómo reconocer una fibra que vale la pena',
    excerpt: 'Tacto, recuperación, brillo y composición: cuatro señales antes de elegir.',
    content:
      '<p>Una fibra noble se reconoce al tacto, en cómo recupera su forma y en la claridad de su composición. Elegir bien es también una forma de cuidar.</p>',
    date: '2026-08-08',
    index: '02',
  },
  {
    id: 3,
    slug: 'cuidar-tambien-es-una-manera-de-conservar',
    title: 'Cuidar también es una manera de conservar',
    excerpt: 'Menos lavados, agua fría y secado correcto para acompañar la vida de una pieza.',
    content:
      '<p>Menos lavados, agua fría y un secado paciente alargan la vida de una pieza. Cuidar también es una manera de conservar lo que elegimos tocar.</p>',
    date: '2026-08-15',
    index: '03',
  },
];

const isDefaultWpPost = (post: WpPost) => {
  const slug = post.slug?.toLowerCase() || '';
  const title = stripHtml(post.title?.rendered || '').toLowerCase();
  return slug === 'hello-world' || title === 'hello world!' || title === 'hello world';
};

const padIndex = (index: number) => String(index + 1).padStart(2, '0');

export const normalizeWpPost = (post: WpPost, index = 0, image?: Story['image']): Story => ({
  id: post.id,
  slug: post.slug,
  title: stripHtml(post.title.rendered),
  excerpt: stripHtml(post.excerpt.rendered),
  content: post.content.rendered,
  date: post.date,
  index: padIndex(index),
  image,
});

async function fetchJson<T>(path: string): Promise<T> {
  if (!wpUrl) throw new Error('PUBLIC_WP_URL no configurada');
  const response = await fetch(`${wpUrl}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`WordPress respondió ${response.status}`);
  return (await response.json()) as T;
}

async function resolveFeaturedImage(mediaId: number): Promise<Story['image'] | undefined> {
  if (!mediaId) return undefined;
  try {
    const media = await fetchJson<WpMedia>(`/wp-json/wp/v2/media/${mediaId}`);
    return {
      src: media.source_url,
      alt: stripHtml(media.alt_text || media.title?.rendered || ''),
    };
  } catch {
    return undefined;
  }
}

async function mapPosts(posts: WpPost[]): Promise<Story[]> {
  return Promise.all(
    posts.map(async (post, index) => {
      const image = await resolveFeaturedImage(post.featured_media);
      return normalizeWpPost(post, index, image);
    }),
  );
}

export async function getPosts(): Promise<Story[]> {
  try {
    const posts = await fetchJson<WpPost[]>(
      '/wp-json/wp/v2/posts?per_page=24&_fields=id,slug,date,modified,link,title,excerpt,content,featured_media',
    );
    const editorial = posts.filter((post) => !isDefaultWpPost(post));
    if (!editorial.length) return fallbackStories;
    return mapPosts(editorial);
  } catch (error) {
    console.warn('[Casa Trama] Usando historias de muestra:', error);
    return fallbackStories;
  }
}

export async function getPost(slug: string): Promise<Story | undefined> {
  try {
    const posts = await fetchJson<WpPost[]>(
      `/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug,date,modified,link,title,excerpt,content,featured_media`,
    );
    if (posts[0] && !isDefaultWpPost(posts[0])) {
      const [story] = await mapPosts([posts[0]]);
      return story;
    }
  } catch (error) {
    console.warn('[Casa Trama] Fallback de historia individual:', error);
  }

  const all = await getPosts();
  return all.find((story) => story.slug === slug);
}

export async function getLatestPost(): Promise<Story | undefined> {
  const posts = await getPosts();
  return posts[0];
}
