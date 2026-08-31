import type { Product, ProductAttribute, ProductSense } from '@/types/commerce';

type SenseIcon = ProductSense['icon'];

const SENSE_DEFS: Array<{
  keys: string[];
  label: string;
  icon: SenseIcon;
}> = [
  { keys: ['tacto'], label: 'Tacto', icon: 'touch' },
  { keys: ['sensación', 'sensacion', 'sensaciones'], label: 'Sensación', icon: 'leaf' },
  { keys: ['calidez', 'calor'], label: 'Calidez', icon: 'time' },
  { keys: ['peso', 'livandad', 'ligereza'], label: 'Peso', icon: 'guide' },
  { keys: ['caída', 'caida', 'drapeado'], label: 'Caída', icon: 'alpaca' },
  { keys: ['densidad', 'trama'], label: 'Densidad', icon: 'shield' },
];

const PROMISE_KEYS = ['promesa', 'por qué elegirla', 'por que elegirla', 'motivo'];
const IDEAL_KEYS = ['ideal para', 'momento', 'uso', 'ocasión', 'ocasion'];
const FINISH_KEYS = ['terminación', 'terminacion', 'acabado'];
const HIDDEN_FROM_FACTS = new Set([
  ...SENSE_DEFS.flatMap((item) => item.keys),
  ...PROMISE_KEYS,
  ...IDEAL_KEYS,
  ...FINISH_KEYS,
  'línea',
  'linea',
  'eyebrow',
  'cuidado',
  'care',
  'cuidados',
]);

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function findAttribute(attributes: ProductAttribute[], keys: string[]) {
  const wanted = keys.map(normalizeKey);
  return attributes.find((attribute) => wanted.includes(normalizeKey(attribute.name)));
}

/** Interpreta niveles 1–5 desde texto Woo (ej. "Alta", "4/5", "Suave y liviano"). */
export function senseLevel(label: string, value: string): number | undefined {
  const raw = value.trim();
  const fraction = raw.match(/([1-5])\s*\/\s*5/);
  if (fraction) return Number(fraction[1]);

  const key = normalizeKey(label);
  const text = normalizeKey(raw);

  if (/(muy alta|intensa|maxima|máxima|profunda)/.test(text)) return 5;
  if (/(alta|abrigad|envolvente|marcada|generosa)/.test(text)) return 4;
  if (/(media|equilibrad|versatil|versátil|con cuerpo)/.test(text)) return 3;
  if (/(suave|liger|livian|fina|fino|delicad|sutil)/.test(text)) {
    if (key === 'calidez') return 3;
    if (key === 'peso') return 2;
    return 4;
  }
  if (/(baja|minima|mínima|casi nula)/.test(text)) return 2;

  return undefined;
}

export function buildProductSenses(attributes: ProductAttribute[]): ProductSense[] {
  const senses: ProductSense[] = [];

  for (const def of SENSE_DEFS) {
    const attribute = findAttribute(attributes, def.keys);
    if (!attribute?.value) continue;
    senses.push({
      key: def.label.toLowerCase(),
      label: def.label,
      value: attribute.value,
      level: senseLevel(def.label, attribute.value),
      icon: def.icon,
    });
  }

  return senses;
}

export function getAttrValue(attributes: ProductAttribute[], keys: string[]) {
  return findAttribute(attributes, keys)?.value;
}

export function buildFactAttributes(attributes: ProductAttribute[]): ProductAttribute[] {
  return attributes.filter((attribute) => !HIDDEN_FROM_FACTS.has(normalizeKey(attribute.name)));
}

export function enrichProductProfile<T extends Product>(product: T): T & {
  senses: ProductSense[];
  promise?: string;
  idealFor?: string;
  finish?: string;
  facts: ProductAttribute[];
} {
  const senses = product.senses?.length ? product.senses : buildProductSenses(product.attributes);
  const promise = product.promise || getAttrValue(product.attributes, PROMISE_KEYS);
  const idealFor = product.idealFor || getAttrValue(product.attributes, IDEAL_KEYS);
  const finish = product.finish || getAttrValue(product.attributes, FINISH_KEYS);
  const facts = buildFactAttributes(product.attributes);

  return {
    ...product,
    senses,
    promise,
    idealFor,
    finish,
    facts,
  };
}
