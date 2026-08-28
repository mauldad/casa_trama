# ADR 004 — Webpay Plus como proveedor de pago P0

**Estado:** Aceptado  
**Fecha:** 2026-08-28

## Contexto

Casa Trama necesita un medio de pago confiable para clientas chilenas en un checkout headless. El PRD evaluaba Transbank Webpay Plus, Mercado Pago y Flow.

## Decisión

**Webpay Plus (Transbank)** será el proveedor de pago P0. La integración usará el SDK oficial `transbank-sdk` detrás del contrato `PaymentProvider`.

Despacho y catálogo real quedan **fuera de este cierre**: se implementarán en iteraciones posteriores sin bloquear la integración de pago.

## Consecuencias

- `PAYMENT_PROVIDER=webpay` en producción.
- Ambiente de integración con credenciales públicas de Transbank para desarrollo y pruebas.
- El retorno del navegador dispara `commit` server-side; no se acredita pago solo por query string manipulable.
- Webpay no usa webhooks clásicos: la confirmación ocurre en `/api/payments/webpay/return`.
- Las credenciales comerciales (`TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_KEY`) viven solo en variables de entorno.
- Reembolsos usarán `transaction.refund()` cuando operaciones lo habilite.

## Pendiente de Casa Trama

- Crear/completar contrato comercial Webpay Plus.
- Entregar credenciales de producción.
- Validar una compra real de monto mínimo antes del go-live.
