export interface ProductVideo {
  src: string;
  poster?: string;
  label?: string;
}

/** Videos de ficha por slug Woo o público (archivos en /public/videos). */
export const productVideosBySlug: Record<string, ProductVideo> = {
  'bufanda-esencia-baby-alpaca': {
    src: '/videos/bufanda-esencia-baby-alpaca.mp4',
    poster: '/videos/bufanda-esencia-baby-alpaca.jpg',
    label: 'Bufanda Esencia Baby Alpaca en movimiento',
  },
  'bufanda-baby-alpaca': {
    src: '/videos/bufanda-esencia-baby-alpaca.mp4',
    poster: '/videos/bufanda-esencia-baby-alpaca.jpg',
    label: 'Bufanda Esencia Baby Alpaca en movimiento',
  },
};

export function getProductVideo(slug: string): ProductVideo | undefined {
  return productVideosBySlug[slug];
}
