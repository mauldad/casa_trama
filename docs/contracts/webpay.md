# Webpay Plus — flujo headless

Proveedor P0: **Transbank Webpay Plus**  
SDK: `transbank-sdk`

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PAYMENT_PROVIDER` | `webpay` en staging/producción; `mock` en local sin Transbank |
| `TRANSBANK_ENV` | `integration` o `production` |
| `TRANSBANK_COMMERCE_CODE` | Código de comercio |
| `TRANSBANK_API_KEY` | API Key secreta |
| `SITE_URL` | Base para `return_url` |

## Credenciales de integración (públicas Transbank)

```env
TRANSBANK_ENV=integration
TRANSBANK_COMMERCE_CODE=597055555532
TRANSBANK_API_KEY=579B532A7440BB0C9079DEDCF3031822143F866E
```

Tarjetas de prueba: [documentación Transbank](https://www.transbankdevelopers.cl/documentacion/webpay-plus).

## Flujo

1. Checkout POST → `/api/payments/create`
2. Servidor crea transacción Webpay (`create`)
3. Navegador POST a URL Transbank con `token_ws`
4. Clienta paga en formulario Transbank
5. Transbank retorna a `/api/payments/webpay/return?order={token}`
6. Servidor ejecuta `commit(token_ws)` — **única acreditación válida**
7. Redirección a `/pedido/{token}?status=approved|rejected|cancelled`

## Cancelación

Si la clienta aborta, Transbank envía `TBK_TOKEN`. El sistema marca `cancelled` y **no** confirma pago.

## Idempotencia

- `buy_order` máximo 26 caracteres (`CT{orderId}`)
- `session_id` = clave idempotente del pedido
- `commit` solo desde servidor
- Eventos de pago/email/GA4 deben usar la misma clave por pedido

## Producción

1. Obtener credenciales comerciales reales
2. Cambiar `TRANSBANK_ENV=production`
3. Probar compra mínima real
4. Activar conciliación periódica (Neon, Sprint 5)
