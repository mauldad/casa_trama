import { describe, expect, it } from 'vitest';
import { formatCLP, stripHtml } from '@/lib/format';

describe('formatCLP', () => {
  it('formatea montos enteros en pesos chilenos', () => {
    expect(formatCLP(45900)).toMatch(/\$?\s?45\.?900/);
  });

  it('no muestra decimales', () => {
    expect(formatCLP(1000)).not.toContain(',50');
  });
});

describe('stripHtml', () => {
  it('elimina etiquetas HTML y normaliza espacios', () => {
    expect(stripHtml('<p>Hola <strong>mundo</strong></p>')).toBe('Hola mundo');
  });

  it('devuelve cadena vacía para HTML vacío', () => {
    expect(stripHtml('<br/>')).toBe('');
  });
});
