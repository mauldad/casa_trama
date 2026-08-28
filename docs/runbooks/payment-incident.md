# Runbook — Incidente de pago

## Síntomas

- Cliente cobrada pero pedido en `pending_payment`
- Webhook duplicado o fuera de orden
- Monto distinto entre proveedor y WooCommerce
- Página de retorno muestra éxito pero estado real desconocido

## Acciones inmediatas

1. **No marcar manualmente como pagado** sin verificación server-to-server.
2. Localizar `order_id` en WooCommerce y referencia en proveedor de pago.
3. Revisar eventos en Neon (`payment_events`) por idempotency key duplicada.
4. Consultar estado con `PaymentProvider.getPaymentStatus(reference)`.
5. Si pago confirmado: transición permitida a `paid` + email idempotente.
6. Si pago fallido: transición a `payment_failed` + email de reintento seguro.

## Conciliación

- Job periódico para pedidos `pending_payment` > umbral (15 min sandbox, 60 min prod).
- Alerta por monto distinto, webhook inválido o pago huérfano.
- Herramienta de reintento autorizada **sin volver a cobrar**.

## Escalación

- Registrar incidente con timestamp, order_id, referencia de pago, hash de webhook.
- Notificar operaciones Casa Trama.
- Rollback de frontend solo si el incidente es de UI; nunca revertir pedido pagado.

## Prevención

- Idempotency keys en creación de transacción y emails.
- Firma y timestamp en webhooks.
- Revalidación de stock antes de crear transacción.
