# Integración WordPress + WooCommerce

## Modelo de contenido (diseño vs edición)

Ver [`docs/CONTENT-MODEL.md`](CONTENT-MODEL.md): WP/Woo editan catálogo, categorías e historias; Astro conserva la coherencia visual.

## Dominio CMS

Fuente editorial y comercial (cuando WooCommerce esté activo):

```text
https://blog.casatrama.cl
```

Variables del storefront:

```text
PUBLIC_WP_URL=https://blog.casatrama.cl
WOO_STORE_API_URL=https://blog.casatrama.cl/wp-json/wc/store/v1
```

`WP_GRAPHQL_URL` queda para más adelante: hoy el sitio no tiene WPGraphQL. Historias usan REST (`/wp-json/wp/v2/posts`).

## Fuente de verdad comercial

WooCommerce debe ser la única fuente de verdad para SKU, precio, impuesto, descuento, variante, stock y pedido. Neon puede almacenar eventos técnicos y proyecciones mínimas, pero no un inventario alternativo.

## Checklist Hostinger (activar catálogo real)

Hoy `blog.casatrama.cl` es un WordPress fresco **sin WooCommerce**. Hasta que exista Store API, Astro sigue con el catálogo mock de `src/data/products.ts`.

1. En el panel Hostinger / WP Admin, instalar y activar **WooCommerce** (Hostinger expone onboarding en `hostinger-easy-onboarding/v1/woo-setup`).
2. Configurar tienda: país **Chile**, moneda **CLP**, impuestos según operación real.
3. Confirmar que Store API responde:
   ```bash
   curl -sI "https://blog.casatrama.cl/wp-json/wc/store/v1/products"
   ```
   Debe ser HTTP 200 (no 404).
4. Crear 1–3 productos de prueba con SKU, precio, stock, galería y slug limpio.
5. Revisar CORS si el storefront en otro dominio consume el carro desde el navegador; para mutaciones sensibles preferir BFF Astro.
6. En Netlify, setear las mismas variables (`PUBLIC_WP_URL`, `WOO_STORE_API_URL`, `SITE_URL=https://casa-trama.netlify.app`).
7. Redeploy: `src/lib/commerce.ts` deja el mock automáticamente cuando Store API responde OK.

## Lectura editorial (activa)

`src/lib/wordpress.ts` consulta:

```text
GET {PUBLIC_WP_URL}/wp-json/wp/v2/posts
```

Páginas:

- `/historias/` — listado
- `/historias/[slug]/` — detalle

Si la API falla o no hay posts, usa historias de muestra (mismo patrón que el catálogo).

## Lectura del catálogo

El archivo `src/lib/commerce.ts` consulta:

```text
GET {WOO_STORE_API_URL}/products?per_page=24
```

Si la URL no existe o la API falla durante desarrollo, usa `src/data/products.ts`. En producción puede decidirse que un fallo muestre la última caché válida en vez del catálogo mock.

## Plugins/capacidades sugeridas

- WooCommerce actualizado y HPOS validado.
- WPGraphQL (opcional, fase posterior).
- ACF Pro + WPGraphQL for ACF, o bloques Gutenberg propios con esquema estable.
- Plugin SEO compatible si la metadata editorial se administra en WordPress.
- Configuración CORS restringida a los dominios reales de Casa Trama (`casa-trama.netlify.app`, `casatrama.cl`).

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

Hoy el drawer de bolsa usa `localStorage` como puente temporal hasta conectar Cart-Token.

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
