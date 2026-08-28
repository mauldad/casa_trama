# ADR 001 — WooCommerce como fuente única de verdad comercial

**Estado:** Aceptado  
**Fecha:** 2026-08-28

## Contexto

Casa Trama necesita un ecommerce headless donde catálogo, precio, stock, impuestos, cupones y pedidos permanezcan conciliables entre storefront, pagos, emails y analítica.

## Decisión

WooCommerce será la **única fuente de verdad** para SKU, precio, IVA, descuentos, variantes, stock y pedidos. Neon Postgres almacenará solo datos técnicos de aplicación: idempotencia, eventos de integración, auditoría, preferencias, proyecciones mínimas y colas de reintento.

## Consecuencias

- El storefront lee catálogo y carro vía Woo Store API.
- Mutaciones sensibles pasan por funciones server-side de Astro/Netlify.
- No se mantiene un segundo inventario ni un segundo libro de pedidos.
- Los webhooks de pago y email deben ser idempotentes.
- La confirmación de pago requiere verificación server-to-server; la URL de retorno del navegador no acredita por sí sola.

## Alternativas consideradas

- Inventario duplicado en Neon: descartado por riesgo de sobreventa y trabajo manual.
- Shopify headless: descartado porque el equipo editorial ya opera sobre WordPress.
