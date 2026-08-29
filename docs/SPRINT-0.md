# Sprint 0 — Discovery y reconciliación

**Duración objetivo:** 1 semana  
**Estado:** En curso

## Entregables

- [x] Theme oficial extraído e instalado en el repositorio
- [x] PRD versionado en `docs/prd/`
- [x] ADRs iniciales de arquitectura
- [x] Harness mínimo (`pnpm verify`)
- [ ] Inventario de pantallas vs. PRD
- [ ] Decisiones comerciales cerradas (ver abajo)
- [x] Contrato `PaymentProvider` con adaptador mock y **Webpay Plus**
- [ ] Ambiente WordPress/Woo staging
- [ ] Preview Netlify conectada

## Decisiones abiertas

| # | Tema | Responsable | Estado |
|---|------|-------------|--------|
| 1 | Confirmar Resend (no "Raisin") | Producto | Asumido ✓ |
| 2 | Proveedor de pago P0 | Casa Trama | **Webpay Plus ✓** |
| 3 | Reglas de despacho, cobertura y tarifas | Casa Trama | **Pospuesto** |
| 4 | Boleta/factura e integración tributaria | Casa Trama + legal | Pendiente |
| 5 | Hosting WordPress (`blog.casatrama.cl`) | Técnico | Listo (REST); WooCommerce pendiente |
| 6 | Catálogo definitivo, variantes y stock | Casa Trama | **Pospuesto** |
| 7 | Cupones y promociones | Casa Trama | Pendiente |
| 8 | Cambios, devoluciones y reembolsos | Casa Trama | Pendiente |
| 9 | Validación theme vs. activos reales de marca | Diseño | Pendiente |
| 10 | Dominio productivo y redirects | Técnico | Pendiente |
| 11 | Responsable de contenidos y aprobaciones | Casa Trama | Pendiente |

## Inventario de rutas del theme

| Ruta | PRD | Theme | Notas |
|------|-----|-------|-------|
| `/` | ✓ | ✓ | Home editorial |
| `/tienda/` | ✓ | ✓ | Listado con filtros mock |
| `/producto/{slug}/` | ✓ | ✓ | Ficha dinámica |
| `/coleccion/{slug}/` | ✓ | `/colecciones/` | Ajustar slug singular en integración |
| `/categoria/{slug}/` | ✓ | — | Crear en Sprint 3 |
| `/materiales/{slug}/` | ✓ | `/guias/fibras-nobles` | Expandir taxonomía |
| `/historias/` | ✓ | ✓ | Blog |
| `/casa-trama/` | ✓ | ✓ | Nosotros |
| `/contacto/` | ✓ | ✓ | |
| `/carro/` | ✓ | ✓ | También alias `/carrito/` |
| `/checkout/` | ✓ | ✓ | Demo Chile |
| `/pedido/{token}/` | ✓ | ✓ | Retorno Webpay + estado |
| Políticas | ✓ | ✓ | despachos, cambios, privacidad, términos |

## Próximo sprint (Fundación)

1. Conectar preview Netlify
2. Esquema Neon para eventos e idempotencia
3. Contrato `PaymentProvider` con adaptador mock
4. Endpoints BFF para carro Store API
5. CI con `pnpm verify`
