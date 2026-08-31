import type { Product, ProductAttribute, ProductSense } from '@/types/commerce';

type SenseIcon = ProductSense['icon'];

/** Los cuatro indicadores que siempre mostramos en ficha. */
export const CORE_SENSE_DEFS: Array<{
  keys: string[];
  label: string;
  icon: SenseIcon;
}> = [
  { keys: ['tacto'], label: 'Tacto', icon: 'touch' },
  { keys: ['calidez', 'calor'], label: 'Calidez', icon: 'time' },
  { keys: ['peso', 'livandad', 'ligereza'], label: 'Peso', icon: 'guide' },
  { keys: ['caída', 'caida', 'drapeado'], label: 'Caída', icon: 'alpaca' },
];

const EXTRA_SENSE_DEFS: Array<{
  keys: string[];
  label: string;
  icon: SenseIcon;
}> = [
  { keys: ['sensación', 'sensacion', 'sensaciones'], label: 'Sensación', icon: 'leaf' },
  { keys: ['densidad', 'trama'], label: 'Densidad', icon: 'shield' },
];

const PROMISE_KEYS = ['promesa', 'por qué elegirla', 'por que elegirla', 'motivo'];
const IDEAL_KEYS = ['ideal para', 'momento', 'uso', 'ocasión', 'ocasion'];
const FINISH_KEYS = ['terminación', 'terminacion', 'acabado'];
const HIDDEN_FROM_FACTS = new Set([
  ...CORE_SENSE_DEFS.flatMap((item) => item.keys),
  ...EXTRA_SENSE_DEFS.flatMap((item) => item.keys),
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

/** Quita el sufijo “· 4/5” del texto visible; el nivel vive en el medidor. */
export function cleanSenseValue(value: string) {
  return value.replace(/\s*·\s*[1-5]\s*\/\s*5\s*$/i, '').trim();
}

/** Interpreta niveles 1–5 desde texto Woo (ej. "Alta", "4/5", "Suave y liviano"). */
export function senseLevel(label: string, value: string): number | undefined {
  const raw = value.trim();
  const fraction = raw.match(/([1-5])\s*\/\s*5/);
  if (fraction) return Number(fraction[1]);

  const key = normalizeKey(label);
  const text = normalizeKey(raw);

  if (/(muy alta|muy livian|intensa|maxima|máxima|profunda|muy fino)/.test(text)) {
    if (key === 'peso') return 1;
    return 5;
  }
  if (/(alta|abrigad|envolvente|marcada|generosa|fluida)/.test(text)) {
    if (key === 'peso') return 2;
    return 4;
  }
  if (/(media|equilibrad|versatil|versátil|con cuerpo|definida|estructura)/.test(text)) return 3;
  if (/(suave|liger|livian|fina|fino|delicad|sutil|natural)/.test(text)) {
    if (key === 'calidez') return 3;
    if (key === 'peso') return 2;
    if (key === 'caida') return 4;
    return 4;
  }
  if (/(baja|minima|mínima|casi nula)/.test(text)) return 2;

  return undefined;
}

type SenseDefaults = Record<string, { value: string; level: number }>;

/** Completa indicadores faltantes según composición / tacto / categoría. */
function inferSenseDefaults(attributes: ProductAttribute[]): SenseDefaults {
  const composition = normalizeKey(getAttrValue(attributes, ['Composición', 'Composicion', 'Material', 'Fibra']) || '');
  const tacto = normalizeKey(getAttrValue(attributes, ['Tacto']) || '');
  const isBabyAlpaca = /baby|alpaca/.test(composition) && !/algodon|algodón|lana|mezcla/.test(composition.replace(/alpaca/g, ''));
  const isAlpacaHeavy = /alpaca/.test(composition);
  const isBlend = /algodon|algodón|lana|mezcla/.test(composition);

  const defaults: SenseDefaults = {
    Tacto: { value: 'Suave al contacto', level: 4 },
    Calidez: { value: 'Media', level: 3 },
    Peso: { value: 'Ligero', level: 3 },
    Caída: { value: 'Natural', level: 3 },
  };

  if (isBabyAlpaca || (isAlpacaHeavy && !isBlend)) {
    defaults.Calidez = { value: 'Alta', level: 4 };
    defaults.Peso = { value: 'Liviano', level: 2 };
    defaults.Caída = { value: 'Envolvente', level: 4 };
  } else if (isBlend) {
    defaults.Calidez = { value: 'Media', level: 3 };
    defaults.Peso = { value: 'Ligero con estructura', level: 3 };
    defaults.Caída = { value: 'Definida', level: 3 };
  }

  if (/abrigad|calor/.test(tacto)) defaults.Calidez = { value: 'Alta', level: 4 };
  if (/livian|fino|fina/.test(tacto)) defaults.Peso = { value: 'Liviano', level: 2 };
  if (/cuerpo|estructura/.test(tacto)) defaults.Peso = { value: 'Con cuerpo', level: 3 };
  if (/envolvente|fluida/.test(tacto)) defaults.Caída = { value: 'Envolvente', level: 4 };

  return defaults;
}

export function buildProductSenses(attributes: ProductAttribute[]): ProductSense[] {
  const defaults = inferSenseDefaults(attributes);
  const senses: ProductSense[] = [];

  for (const def of CORE_SENSE_DEFS) {
    const attribute = findAttribute(attributes, def.keys);
    const fallback = defaults[def.label] || { value: def.label, level: 3 };
    const rawValue = attribute?.value?.trim() || fallback.value;
    const level = senseLevel(def.label, rawValue) ?? fallback.level;

    senses.push({
      key: normalizeKey(def.label),
      label: def.label,
      value: cleanSenseValue(rawValue),
      level,
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
  // Siempre 4 indicadores core (Woo + inferencia).
  const senses = buildProductSenses(product.attributes);
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
