# Casa Trama Auth (WordPress)

Plugin mínimo para login/registro del storefront headless.

Zip listo para subir: `dist-artifacts/casa-trama-auth.zip` (generado en el repo local).

## Instalación (Hostinger)

1. Comprime la carpeta `casa-trama-auth` en un zip (o usa el zip de `dist-artifacts/`).
2. WP Admin → Plugins → Añadir nuevo → Subir plugin → Activar.
3. Configura el shared secret (elige una):

En `wp-config.php` (antes de `That's all, stop editing!`):

```php
define('CT_AUTH_SECRET', 'EL_MISMO_VALOR_QUE_EN_NETLIFY');
```

O como option de WP: `casa_trama_auth_secret` (mismo valor).

4. En Netlify / `.env` del storefront:

```
CT_AUTH_SECRET=EL_MISMO_VALOR_QUE_EN_NETLIFY
CT_SESSION_SECRET=otro_secreto_largo
PUBLIC_WP_URL=https://blog.casatrama.cl
```

## Endpoints

Todos requieren header `X-CT-Auth-Secret: <CT_AUTH_SECRET>`.

- `POST /wp-json/casa-trama/v1/auth/login` `{ email, password }`
- `POST /wp-json/casa-trama/v1/auth/register` `{ email, password, firstName?, lastName? }`
- `POST /wp-json/casa-trama/v1/auth/password` `{ email, currentPassword, newPassword }`
- `POST /wp-json/casa-trama/v1/auth/customer-by-email` `{ email }` — solo BFF (olvidé contraseña). Si no hay cuenta pero sí pedidos pagados con ese correo, crea el cliente Woo y vincula pedidos anteriores.
- `POST /wp-json/casa-trama/v1/auth/set-password` `{ customerId, password }` — solo BFF (restablecer)
