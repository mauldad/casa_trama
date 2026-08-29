import transbank from 'transbank-sdk';
import type { NormalizedPaymentStatus } from '@/types/payment';

const { IntegrationApiKeys, IntegrationCommerceCodes, WebpayPlus } = transbank;

export function createWebpayTransaction() {
  const env = import.meta.env.TRANSBANK_ENV ?? 'integration';

  if (env === 'production') {
    const commerceCode = import.meta.env.TRANSBANK_COMMERCE_CODE;
    const apiKey = import.meta.env.TRANSBANK_API_KEY;
    if (!commerceCode || !apiKey) {
      throw new Error('Faltan TRANSBANK_COMMERCE_CODE o TRANSBANK_API_KEY para producción.');
    }
    return WebpayPlus.Transaction.buildForProduction(commerceCode, apiKey);
  }

  return WebpayPlus.Transaction.buildForIntegration(
    import.meta.env.TRANSBANK_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS,
    import.meta.env.TRANSBANK_API_KEY || IntegrationApiKeys.WEBPAY,
  );
}

export function getSiteUrl() {
  return (import.meta.env.SITE_URL || 'http://localhost:4321').replace(/\/$/, '');
}

/** buy_order de Transbank admite máximo 26 caracteres. */
export function buildBuyOrder(orderId: number): string {
  const value = `CT${orderId}`;
  return value.length <= 26 ? value : value.slice(0, 26);
}

export function buildSessionId(idempotencyKey: string): string {
  return idempotencyKey.length <= 61 ? idempotencyKey : idempotencyKey.slice(0, 61);
}

export function mapTransbankStatus(status?: string): NormalizedPaymentStatus {
  switch ((status || '').toUpperCase()) {
    case 'AUTHORIZED':
      return 'approved';
    case 'FAILED':
    case 'REJECTED':
      return 'rejected';
    case 'INITIALIZED':
    case 'INITIALIZED_WITH_PAYMENT':
      return 'processing';
    case 'NULLIFIED':
    case 'PARTIALLY_NULLIFIED':
    case 'REVERSED':
      return 'refunded_total';
    default:
      return 'pending';
  }
}
