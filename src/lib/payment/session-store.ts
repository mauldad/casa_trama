import type { PaymentSessionRecord } from '@/types/payment-session';

const sessionsByToken = new Map<string, PaymentSessionRecord>();

export function savePaymentSession(token: string, record: PaymentSessionRecord) {
  sessionsByToken.set(token, record);
}

export function getPaymentSession(token: string): PaymentSessionRecord | undefined {
  return sessionsByToken.get(token);
}

export function getPaymentSessionByOrderToken(orderToken: string): PaymentSessionRecord | undefined {
  for (const record of sessionsByToken.values()) {
    if (record.orderToken === orderToken) return record;
  }
  return undefined;
}

export function updatePaymentSessionStatus(
  token: string,
  status: PaymentSessionRecord['status'],
  authorizationCode?: string,
) {
  const current = sessionsByToken.get(token);
  if (!current) return;
  sessionsByToken.set(token, { ...current, status, authorizationCode });
}
