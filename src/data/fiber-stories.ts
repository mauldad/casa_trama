export interface FiberBenefit {
  title: string;
  body: string;
  icon: 'touch' | 'leaf' | 'time' | 'guide' | 'alpaca' | 'shield';
}

export interface FiberStory {
  id: string;
  name: string;
  kicker: string;
  headline: string;
  lede: string;
  whatItIs: string;
  myth: { claim: string; truth: string };
  traits: Array<{ label: string; value: string }>;
  benefits: FiberBenefit[];
  closing: string;
  guideHref: string;
}

export const fiberStories: Record<string, FiberStory> = {
  alpaca: {
    id: 'alpaca',
    name: 'Baby alpaca',
    kicker: 'La fibra',
    headline: 'Qué es la baby alpaca — y por qué se siente distinta',
    lede:
      'No es un animal joven: es una clasificación por finura. Elegimos esa fibra porque abriga con poco peso y se siente noble al primer contacto.',
    whatItIs:
      'La baby alpaca se selecciona por el diámetro de la fibra (más fina, más suave). Viene del altiplano: climas extremos que enseñaron a la fibra a aislar sin volverse pesada. En Casa Trama la curamos cuando esa calidez llega limpia a la piel — sin prurito, sin volumen innecesario.',
    myth: {
      claim: 'A veces se cree que “baby” alpaca viene de una cría.',
      truth:
        'En realidad habla de finura: una selección de vellón más delicado. Es un estándar de calidad táctil, no de edad.',
    },
    traits: [
      { label: 'Finura', value: 'Suave, uniforme, agradable sobre la piel' },
      { label: 'Aislamiento', value: 'Fibra con memoria térmica: abriga con poco gramos' },
      { label: 'Lanolina', value: 'Sin lanolina de oveja: menos irritación habitual' },
      { label: 'Caída', value: 'Liviana, se acomoda al cuerpo sin rigidizarse' },
      { label: 'Brillo', value: 'Mate natural: nobleza sin brillo plástico' },
      { label: 'Permanencia', value: 'Bien cuidada, acompaña temporadas' },
    ],
    benefits: [
      {
        title: 'Calor sin peso',
        body: 'Ideal cuando quieres abrigo real y seguir moviéndote con libertad.',
        icon: 'time',
      },
      {
        title: 'Suavidad que se nota',
        body: 'La diferencia aparece en el cuello y las muñecas: zonas que no perdonan una fibra burda.',
        icon: 'touch',
      },
      {
        title: 'Menos “raspa”',
        body: 'Al no tener lanolina como la lana de oveja, muchas personas la toleran mejor sobre la piel.',
        icon: 'shield',
      },
      {
        title: 'Lujo silencioso',
        body: 'No grita marca: se siente. Esa es la señal que buscamos en cada hallazgo.',
        icon: 'leaf',
      },
    ],
    closing:
      'Elegir baby alpaca es elegir menos volumen y más presencia. Una pieza que justifica su precio cuando la usas — no cuando la describes.',
    guideHref: '/guias/fibras-nobles/#baby-alpaca',
  },
  algodon: {
    id: 'algodon',
    name: 'Algodón',
    kicker: 'La fibra',
    headline: 'Algodón noble: frescura con carácter',
    lede:
      'Buscamos algodones que respiren y acompañen el día: suavidad cotidiana con caída serena, no tela genérica.',
    whatItIs:
      'El algodón bien elegido equilibra tacto, absorción y aire. En Casa Trama entra cuando la mano confirma frescura y la trama promete uso real — no solo look de temporada.',
    myth: {
      claim: 'Todo algodón se siente igual.',
      truth: 'La largura de fibra, el hilado y el acabado cambian por completo el tacto y la caída.',
    },
    traits: [
      { label: 'Tacto', value: 'Suave y respirable' },
      { label: 'Temporada', value: 'Media estación y capas ligeras' },
      { label: 'Caída', value: 'Natural, sin exceso de peso' },
    ],
    benefits: [
      {
        title: 'Frescura limpia',
        body: 'Acompaña sin abrumar: ideal cuando el clima pide suavidad, no abrigo extremo.',
        icon: 'leaf',
      },
      {
        title: 'Uso diario',
        body: 'Una fibra que se vuelve hábito si la calidad está en el hilado.',
        icon: 'touch',
      },
    ],
    closing: 'El algodón que elegimos debe sentirse intencional: fresco, serio y agradable al cuerpo.',
    guideHref: '/guias/fibras-nobles/',
  },
  mezclas: {
    id: 'mezclas',
    name: 'Mezclas nobles',
    kicker: 'La fibra',
    headline: 'Cuando la mezcla suma carácter',
    lede:
      'Una buena mezcla no diluye: equilibra. Buscamos proporciones que den cuerpo, suavidad y uso real.',
    whatItIs:
      'Mezclar fibras permite afinar caída, temperatura y estructura. Curamos solo las combinaciones donde cada material aporta algo que se siente.',
    myth: {
      claim: 'Mezcla = menor calidad.',
      truth: 'Una mezcla bien pensada puede superar a una fibra sola para un uso concreto.',
    },
    traits: [
      { label: 'Equilibrio', value: 'Suavidad + estructura' },
      { label: 'Versatilidad', value: 'Más horas del día, más climas' },
    ],
    benefits: [
      {
        title: 'Versátil sin ser genérica',
        body: 'La pieza acompaña media estación e invierno suave con personalidad propia.',
        icon: 'guide',
      },
    ],
    closing: 'La mezcla correcta se reconoce al usarla: cómoda, con carácter, sin excesos.',
    guideHref: '/guias/fibras-nobles/',
  },
};

export function getFiberStory(fiber: string) {
  return fiberStories[fiber];
}
