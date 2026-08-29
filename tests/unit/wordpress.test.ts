import { describe, expect, it } from 'vitest';
import { normalizeWpPost } from '@/lib/wordpress';
import type { WpPost } from '@/types/wordpress';

const sample: WpPost = {
  id: 12,
  slug: 'fibra-y-tacto',
  date: '2026-08-29T00:00:00',
  modified: '2026-08-29T00:00:00',
  link: 'https://blog.casatrama.cl/fibra-y-tacto/',
  title: { rendered: 'Fibra &amp; tacto' },
  excerpt: { rendered: '<p>Una nota sobre materia.</p>' },
  content: { rendered: '<p>Cuerpo completo.</p>' },
  featured_media: 0,
};

describe('normalizeWpPost', () => {
  it('limpia HTML de título y excerpt y asigna índice', () => {
    const story = normalizeWpPost(sample, 0);
    expect(story.title).toBe('Fibra & tacto');
    expect(story.excerpt).toBe('Una nota sobre materia.');
    expect(story.content).toContain('<p>Cuerpo completo.</p>');
    expect(story.index).toBe('01');
    expect(story.slug).toBe('fibra-y-tacto');
  });
});
