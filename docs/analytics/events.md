# Contrato GA4 Ecommerce — Casa Trama

Versión: 1.0  
Fuente de verdad del monto: pedido WooCommerce confirmado server-side.

## Reglas globales

- `purchase` se emite **una sola vez** por `transaction_id` (Woo order ID).
- No enviar PII a GA4.
- `item_id` consistente en todo el funnel (SKU o variation ID).
- `value` debe declarar si incluye impuestos y despacho; la regla no cambia entre eventos.

## Eventos P0

| Evento | Momento | Identidad principal |
|--------|---------|---------------------|
| `view_item_list` | Lista visible | `item_list_id` |
| `select_item` | Click en producto | SKU |
| `view_item` | Ficha cargada | SKU |
| `add_to_cart` | Woo confirma agregado | SKU + qty |
| `remove_from_cart` | Woo confirma retiro | SKU + qty |
| `view_cart` | Vista carro | cart ID anónimo |
| `begin_checkout` | Checkout iniciado | cart/order draft |
| `add_shipping_info` | Despacho confirmado | shipping tier |
| `add_payment_info` | Método elegido | payment type |
| `purchase` | Pago verificado servidor | Woo order ID |
| `refund` | Reembolso confirmado | Woo order ID |
| `search` | Búsqueda interna | término saneado |
| `generate_lead` | Contacto enviado | form type |

## Implementación actual

El theme inicializa `window.dataLayer` en `BaseLayout.astro`. La capa final debe validarse con DebugView y Tag Assistant antes de go-live.
