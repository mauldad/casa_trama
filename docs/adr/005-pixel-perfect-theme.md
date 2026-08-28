# ADR 005 — Fidelidad visual pixel-perfect del theme

**Estado:** Aceptado  
**Fecha:** 2026-08-28

## Contexto

`Casa_Trama_Astro_Theme_v1.0.0` es la autoridad visual aprobada. Cualquier desviación tipográfica, de espaciado, color o composición diluye la marca.

## Decisión

La implementación debe ser **pixel-perfect respecto al prototipo aprobado**. El theme Astro aporta tokens y sistema; cuando el prototipo y el theme divergen (como en el hero de tres paneles), **manda el prototipo**.

1. Tokens, tipografías, ritmos y componentes del theme son la fuente de verdad.
2. Páginas nuevas reutilizan clases existentes (`simple-page`, `checkout-page`, `button`, `button-secondary`, etc.).
3. No se mezclan `.button` y `.button-secondary` en el mismo elemento.
4. Cambios materiales de dirección visual requieren preview, comparación y ADR.
5. El CSS de tokens/layout del theme no se “reinterpreta” por preferencias genéricas de diseño.

## Consecuencias

- QA visual en 320 / 390 / 768 / 1024 / 1280 / 1440 px antes de liberar UI.
- Checkout, pedido y futuros flujos deben verse como parte del mismo sistema, no como pantallas utilitarias.
- Fotografías reales sustituyen mocks sin alterar proporciones de galería (`4/5`) ni ritmos de sección.
