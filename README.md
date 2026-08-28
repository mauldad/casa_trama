# Casa Trama — Storefront Headless

Storefront premium de Casa Trama construido con **Astro 7** + **WordPress/WooCommerce** headless, desplegado en Netlify.

Base visual: `Casa_Trama_Astro_Theme_v1.0.0`

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Astro 7 + TypeScript estricto |
| Hosting | Netlify |
| CMS | WordPress |
| Comercio | WooCommerce Store API |
| Email | Resend |
| Datos app | Neon Postgres |
| Pago | Adaptador intercambiable (mock en dev) |

## Inicio rápido

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Abrir [http://localhost:4321](http://localhost:4321)

Sin `WOO_STORE_API_URL`, el catálogo usa datos mock en `src/data/products.ts`.

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Typecheck + build producción |
| `pnpm test` | Tests unitarios |
| `pnpm verify` | Puerta de calidad (check + test + build) |

## Documentación

- [PRD](docs/prd/PRD.md) — especificación de producto
- [Sprint 0](docs/SPRINT-0.md) — discovery y decisiones abiertas
- [WordPress headless](docs/WORDPRESS-HEADLESS.md) — integración CMS/comercio
- [ADRs](docs/adr/) — decisiones de arquitectura
- [Contratos](docs/contracts/) — APIs y adaptadores
- [Analítica](docs/analytics/events.md) — eventos GA4

## Variables de entorno

Ver `.env.example`. Nunca commitear secretos.

## Arquitectura

WooCommerce es la **única fuente de verdad** para catálogo, precio, stock y pedidos. Neon almacena eventos técnicos e idempotencia. Ver ADR-001.
