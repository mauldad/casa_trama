# ADR 003 — Resend para correos transaccionales

**Estado:** Aceptado  
**Fecha:** 2026-08-28

## Contexto

El PRD referencia "Raisin", interpretado como **Resend**. Casa Trama necesita correos transaccionales confiables, idempotentes y alineados con la marca.

## Decisión

Resend será el proveedor de email transaccional P0. WooCommerce **no** enviará los mismos correos en paralelo. Cada tipo de email usa una clave idempotente `event_type/order_id/version`.

## Consecuencias

- Dominio de envío verificado con SPF, DKIM y DMARC antes de producción.
- Plantillas alineadas con el sistema visual (React Email en implementación futura).
- Webhooks de entrega, rebote y complaint se almacenan en Neon.
- Separación estricta entre email transaccional y marketing.

## Emails P0

1. Pedido recibido
2. Pago confirmado
3. Pago rechazado o incompleto
4. Pedido en preparación
5. Pedido enviado
6. Cancelación
7. Reembolso
8. Notificación interna de venta o incidente
