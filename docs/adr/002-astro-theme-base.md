# ADR 002 — Theme oficial `Casa_Trama_Astro_Theme_v1.0.0`

**Estado:** Aceptado  
**Fecha:** 2026-08-28

## Contexto

Existe un prototipo visual aprobado materializado en el theme Astro v1.0.0 con tokens, componentes, rutas, responsive, accesibilidad y contratos iniciales con WooCommerce.

## Decisión

El repositorio de producción se inicia **desde el theme oficial**, no desde un starter genérico de Astro. Se conservan design tokens, tipografías self-hosted, navegación, componentes y criterios responsive salvo cambio aprobado mediante ADR.

## Consecuencias

- El catálogo mock (`src/data/products.ts`) existe solo para desarrollo y QA.
- En producción, productos, precio y stock provienen de WooCommerce.
- Cambios materiales de dirección visual requieren preview, comparación y aprobación humana.
- Refactors de mantenibilidad o accesibilidad están permitidos si no alteran la intención visual.

## Stack validado

- Astro 7.x + TypeScript estricto
- Adaptador Netlify oficial
- React islands solo donde aporten valor (futuro: filtros, galería, carro, checkout)
