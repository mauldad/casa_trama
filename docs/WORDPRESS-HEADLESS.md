# Integración WordPress + WooCommerce

## Fuente de verdad

WooCommerce debe ser la única fuente de verdad para SKU, precio, impuesto, descuento, variante, stock y pedido. Neon puede almacenar eventos técnicos y proyecciones mínimas, pero no un inventario alternativo.

## Plugins/capacidades sugeridas

- WooCommerce actualizado y HPOS validado.
- WPGraphQL.
- ACF Pro + WPGraphQL for ACF, o bloques Gutenberg propios con esquema estable.
- Plugin SEO compatible con WPGraphQL si la metadata editorial se administra en WordPress.
- Configuración CORS restringida a los dominios reales de Casa Trama.

## Lectura del catálogo

El archivo `src/lib/commerce.ts` consulta:

```text
GET {WOO_STORE_API_URL}/products?per_page=24
```

Si la URL no existe o la API falla durante desarrollo, usa `src/data/products.ts`. En producción puede decidirse que un fallo muestre la última caché válida en vez del catálogo mock.

## Modelo editorial mínimo

### Producto WooCommerce

- nombre, slug, SKU y estado;
- precio regular/oferta;
- stock y variaciones;
- galería y texto alternativo;
- composición y porcentajes;
- tacto/textura;
- color;
- medidas y peso;
- origen/técnica cuando estén respaldados;
- cuidado;
- colecciones y productos relacionados.

### Opciones globales

- anuncio superior;
- navegación;
- hero e imágenes responsive;
- productos destacados;
- manifiesto/materialidad;
- newsletter y datos de contacto;
- redes y políticas.

## Publicación y caché

- Los webhooks de publicación deben invalidar la ruta afectada o disparar un deploy controlado.
- Los cambios de stock no deben reconstruir toda la web.
- Revalidar stock mediante Store API antes de agregar y pagar.
- Precio y disponibilidad deben formar parte del HTML inicial y del schema de producto.

## Carro y checkout

Para producción, las llamadas sensibles pasan por endpoints Astro server-side. El navegador nunca recibe Consumer Secret de WooCommerce ni claves de pago.

Flujo recomendado:

1. Crear/obtener carro mediante Woo Store API.
2. Guardar `Cart-Token` de forma segura.
3. Agregar/quitar líneas contra WooCommerce.
4. Revalidar el carro.
5. Crear pedido pendiente.
6. Crear transacción idempotente.
7. Verificar webhook y estado del proveedor.
8. Actualizar WooCommerce.
9. Enviar correo y `purchase` una sola vez.

La página de retorno del proveedor no es evidencia suficiente de pago.

## SEO/GEO/AEO

- Mantener producto, oferta y stock coherentes entre interfaz y JSON-LD.
- Enviar solo URLs canónicas 200 al sitemap.
- No indexar carro, checkout, búsqueda interna o pedidos.
- Crear contenidos propios sobre fibras, textura, cuidado, clima, uso y selección.
- Toda afirmación de origen, sostenibilidad o propiedad técnica necesita respaldo.
- `llms.txt` puede agregarse como archivo informativo; no reemplaza el sitemap ni garantiza visibilidad.

## Analítica

El theme deja eventos base en `window.dataLayer`. La implementación final debe validar:

- `view_item_list`
- `select_item`
- `view_item`
- `add_to_cart`
- `remove_from_cart`
- `view_cart`
- `begin_checkout`
- `add_shipping_info`
- `add_payment_info`
- `purchase`
- `refund`

`purchase` se emite únicamente después de verificar pago y usa el ID real de WooCommerce como `transaction_id`.
