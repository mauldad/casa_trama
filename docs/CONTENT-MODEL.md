# Modelo de contenido Casa Trama

**Regla:** WordPress/WooCommerce editan el contenido. Astro/Netlify fija el diseño (tipografía, layout, CSS). Cambiar un producto o post no debe romper la estética.

## Qué se edita en WordPress

| En WP/Woo | Dónde se ve en la web |
|---|---|
| Productos (nombre, precio, stock, galería, descripción) | `/tienda`, `/producto/[slug]`, home (destacados), colecciones |
| Categorías de producto | Filtros de `/tienda`, bloques de `/colecciones` |
| Atributos de producto (`Composición`, `Tacto`, `Color`, …) | Ficha de producto |
| Atributo **Cuidado** (opciones separadas por `\|`) | Bloque “Cuidado” de la ficha |
| Atributo **Línea** (opcional) | Eyebrow sobre el nombre |
| Etiqueta **Destacado** (`destacado`) | Home y orden “Selección Casa Trama” |
| Entradas (posts) + imagen destacada | `/historias`, `/historias/[slug]`, bloque editorial del home |

Descripción de categoría Woo → texto bajo el título en Colecciones.

## Qué NO se edita en WordPress

Chrome visual: tipografías, colores, header, footer, marquee, manifesto, hero de la home (imágenes/paneles brand), botones, drawer.

Eso vive en `src/styles/global.css` y componentes Astro.

## Checklist editorial rápido

1. Crear/editar producto en Woo → publicar.
2. Asignar categorías (Bufandas, Estolas, Baby alpaca, …).
3. Completar atributos visibles + **Cuidado**.
4. Marcar destacados con etiqueta **Destacado**.
5. Subir fotos con ALT.
6. Publicar historias en Entradas con imagen destacada.

Verificar Store API:

```bash
curl -s "https://blog.casatrama.cl/wp-json/wc/store/v1/products" | head
curl -s "https://blog.casatrama.cl/wp-json/wc/store/v1/products/categories"
curl -s "https://blog.casatrama.cl/wp-json/wp/v2/posts"
```

## Fallbacks

Si Woo/WP no responde, el storefront usa `src/data/products.ts` e historias de muestra en `src/lib/wordpress.ts` para no dejar la web vacía.
