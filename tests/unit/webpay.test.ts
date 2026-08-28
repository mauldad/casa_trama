import { describe, expect, it } from 'vitest';
import { buildBuyOrder, buildSessionId, mapTransbankStatus } from '@/lib/payment/transbank';

describe('Transbank helpers', () => {
  it('genera buy_order con prefijo CT y máximo 26 caracteres', () => {
    expect(buildBuyOrder(12345)).toBe('CT12345');
    expect(buildBuyOrder(12345).length).toBeLessThanOrEqual(26);
  });

  it('recorta session_id largo a 61 caracteres', () => {
    const longKey = 'order/'.padEnd(80, 'x');
    expect(buildSessionId(longKey)).toHaveLength(61);
  });

  it('mapea estados de Transbank a estados normalizados', () => {
    expect(mapTransbankStatus('AUTHORIZED')).toBe('approved');
    expect(mapTransbankStatus('FAILED')).toBe('rejected');
    expect(mapTransbankStatus('INITIALIZED')).toBe('processing');
    expect(mapTransbankStatus('NULLIFIED')).toBe('refunded_total');
  });
});
