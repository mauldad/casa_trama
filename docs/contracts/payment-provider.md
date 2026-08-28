# Contrato `PaymentProvider`

Interfaz intercambiable para proveedores de pago chilenos (Transbank, Mercado Pago, Flow, etc.).

```typescript
interface PaymentProvider {
  createPayment(order: PaymentOrder): Promise<PaymentSession>;
  getPaymentStatus(reference: string): Promise<PaymentStatus>;
  verifyWebhook(headers: Headers, body: string): Promise<WebhookPayload>;
  refund(reference: string, amount: number): Promise<RefundResult>;
  mapProviderStatus(status: string): NormalizedPaymentStatus;
  getPublicConfiguration(): PublicPaymentConfig;
}
```

## Estados normalizados

- `pending`
- `processing`
- `approved`
- `rejected`
- `cancelled`
- `refunded_partial`
- `refunded_total`

## Reglas

- `createPayment` debe ser idempotente por `order_id`.
- `verifyWebhook` valida firma, timestamp y esquema antes de procesar.
- La URL de retorno del navegador **no** acredita pago.
- Cambiar proveedor es operación técnica controlada, no editable desde WordPress.

## Implementación

- Desarrollo local sin Transbank: `PAYMENT_PROVIDER=mock`
- Staging/producción P0: `PAYMENT_PROVIDER=webpay` — ver [webpay.md](./webpay.md)
- Producción: candidato seleccionado en Sprint 0 → **Webpay Plus**
