import { mockPaymentProvider } from '@/lib/payment/mock';
import { webpayPaymentProvider } from '@/lib/payment/webpay';
import type { PaymentProvider } from '@/types/payment';

export { mockPaymentProvider } from '@/lib/payment/mock';
export { webpayPaymentProvider } from '@/lib/payment/webpay';

export function getPaymentProvider(): PaymentProvider {
  const provider = import.meta.env.PAYMENT_PROVIDER ?? 'mock';

  if (provider === 'mock') return mockPaymentProvider;
  if (provider === 'webpay') return webpayPaymentProvider;

  throw new Error(`Proveedor de pago no configurado: ${provider}`);
}

export function getPublicPaymentConfig() {
  return getPaymentProvider().getPublicConfiguration();
}
