<?php
/**
 * Plugin Name: Casa Trama Auth
 * Description: Login/registro seguro para el storefront headless (casatrama.cl).
 * Version: 1.0.0
 * Author: Casa Trama
 * Requires at least: 6.0
 * Requires PHP: 8.0
 */

if (!defined('ABSPATH')) {
  exit;
}

define('CT_AUTH_VERSION', '1.0.0');
define('CT_AUTH_NS', 'casa-trama/v1');

/**
 * Shared secret: define CT_AUTH_SECRET in wp-config.php
 *   define('CT_AUTH_SECRET', '...');
 * Or set option casa_trama_auth_secret in WP.
 */
function ct_auth_secret(): string {
  if (defined('CT_AUTH_SECRET') && is_string(CT_AUTH_SECRET) && CT_AUTH_SECRET !== '') {
    return CT_AUTH_SECRET;
  }
  $option = get_option('casa_trama_auth_secret', '');
  return is_string($option) ? $option : '';
}

function ct_auth_require_secret(WP_REST_Request $request): true|WP_Error {
  $secret = ct_auth_secret();
  if ($secret === '') {
    return new WP_Error('ct_auth_misconfigured', 'Auth secret no configurado.', ['status' => 503]);
  }
  $header = $request->get_header('x-ct-auth-secret');
  if (!is_string($header) || !hash_equals($secret, $header)) {
    return new WP_Error('ct_auth_forbidden', 'No autorizado.', ['status' => 401]);
  }
  return true;
}

function ct_auth_client_ip(): string {
  $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
  if (is_string($forwarded) && $forwarded !== '') {
    $parts = explode(',', $forwarded);
    return trim($parts[0]);
  }
  return isset($_SERVER['REMOTE_ADDR']) && is_string($_SERVER['REMOTE_ADDR'])
    ? $_SERVER['REMOTE_ADDR']
    : '0.0.0.0';
}

function ct_auth_rate_limit(string $bucket, int $max = 12, int $window = 600): true|WP_Error {
  $ip = ct_auth_client_ip();
  $key = 'ct_auth_rl_' . md5($bucket . '|' . $ip);
  $data = get_transient($key);
  if (!is_array($data)) {
    $data = ['count' => 0, 'start' => time()];
  }
  if (time() - (int) $data['start'] > $window) {
    $data = ['count' => 0, 'start' => time()];
  }
  $data['count'] = (int) $data['count'] + 1;
  set_transient($key, $data, $window);
  if ($data['count'] > $max) {
    return new WP_Error('ct_auth_rate_limited', 'Demasiados intentos. Espera unos minutos.', ['status' => 429]);
  }
  return true;
}

function ct_auth_customer_payload(WP_User $user): array {
  $customer_id = (int) $user->ID;
  return [
    'ok' => true,
    'userId' => $customer_id,
    'customerId' => $customer_id,
    'email' => $user->user_email,
    'firstName' => (string) get_user_meta($user->ID, 'first_name', true),
    'lastName' => (string) get_user_meta($user->ID, 'last_name', true),
    'displayName' => $user->display_name,
  ];
}

function ct_auth_register_routes(): void {
  register_rest_route(CT_AUTH_NS, '/auth/login', [
    'methods' => 'POST',
    'permission_callback' => 'ct_auth_require_secret',
    'callback' => 'ct_auth_login',
  ]);
  register_rest_route(CT_AUTH_NS, '/auth/register', [
    'methods' => 'POST',
    'permission_callback' => 'ct_auth_require_secret',
    'callback' => 'ct_auth_register',
  ]);
  register_rest_route(CT_AUTH_NS, '/auth/password', [
    'methods' => 'POST',
    'permission_callback' => 'ct_auth_require_secret',
    'callback' => 'ct_auth_password',
  ]);
  register_rest_route(CT_AUTH_NS, '/auth/customer-by-email', [
    'methods' => 'POST',
    'permission_callback' => 'ct_auth_require_secret',
    'callback' => 'ct_auth_customer_by_email',
  ]);
  register_rest_route(CT_AUTH_NS, '/auth/set-password', [
    'methods' => 'POST',
    'permission_callback' => 'ct_auth_require_secret',
    'callback' => 'ct_auth_set_password',
  ]);
}
add_action('rest_api_init', 'ct_auth_register_routes');

function ct_auth_login(WP_REST_Request $request) {
  $limited = ct_auth_rate_limit('login');
  if (is_wp_error($limited)) {
    return $limited;
  }

  $email = sanitize_email((string) $request->get_param('email'));
  $password = (string) $request->get_param('password');
  if ($email === '' || $password === '') {
    return new WP_Error('ct_auth_invalid', 'Credenciales incompletas.', ['status' => 400]);
  }

  $user = wp_authenticate($email, $password);
  if (is_wp_error($user)) {
    // Mensaje genérico: no revelar si el email existe.
    return new WP_Error('ct_auth_failed', 'No pudimos entrar.', ['status' => 401]);
  }

  if (!user_can($user, 'read') || user_can($user, 'manage_options')) {
    // Bloquear admins en este canal; solo clientes de tienda.
    if (!in_array('customer', (array) $user->roles, true) && !in_array('subscriber', (array) $user->roles, true)) {
      return new WP_Error('ct_auth_failed', 'No pudimos entrar.', ['status' => 401]);
    }
  }

  return rest_ensure_response(ct_auth_customer_payload($user));
}

function ct_auth_register(WP_REST_Request $request) {
  $limited = ct_auth_rate_limit('register', 8, 900);
  if (is_wp_error($limited)) {
    return $limited;
  }

  $email = sanitize_email((string) $request->get_param('email'));
  $password = (string) $request->get_param('password');
  $first = sanitize_text_field((string) $request->get_param('firstName'));
  $last = sanitize_text_field((string) $request->get_param('lastName'));

  if ($email === '' || !is_email($email)) {
    return new WP_Error('ct_auth_invalid', 'Correo inválido.', ['status' => 400]);
  }
  if (strlen($password) < 8) {
    return new WP_Error('ct_auth_invalid', 'La contraseña debe tener al menos 8 caracteres.', ['status' => 400]);
  }
  if (email_exists($email) || username_exists($email)) {
    return new WP_Error('ct_auth_exists', 'No pudimos crear la cuenta.', ['status' => 409]);
  }

  $user_id = wp_insert_user([
    'user_login' => $email,
    'user_email' => $email,
    'user_pass' => $password,
    'first_name' => $first,
    'last_name' => $last,
    'display_name' => trim($first . ' ' . $last) ?: $email,
    'role' => 'customer',
  ]);

  if (is_wp_error($user_id)) {
    return new WP_Error('ct_auth_failed', 'No pudimos crear la cuenta.', ['status' => 500]);
  }

  // Asegura meta de nombre (algunos hooks de Woo no conservan first_name del insert).
  if ($first !== '') {
    update_user_meta((int) $user_id, 'first_name', $first);
  }
  if ($last !== '') {
    update_user_meta((int) $user_id, 'last_name', $last);
  }
  if (function_exists('wc_update_new_customer_past_orders')) {
    wc_update_new_customer_past_orders((int) $user_id);
  }

  $user = get_user_by('id', (int) $user_id);
  if (!$user) {
    return new WP_Error('ct_auth_failed', 'No pudimos crear la cuenta.', ['status' => 500]);
  }

  return rest_ensure_response(ct_auth_customer_payload($user));
}

function ct_auth_password(WP_REST_Request $request) {
  $limited = ct_auth_rate_limit('password', 8, 900);
  if (is_wp_error($limited)) {
    return $limited;
  }

  $email = sanitize_email((string) $request->get_param('email'));
  $current = (string) $request->get_param('currentPassword');
  $next = (string) $request->get_param('newPassword');

  if ($email === '' || $current === '' || strlen($next) < 8) {
    return new WP_Error('ct_auth_invalid', 'Datos incompletos.', ['status' => 400]);
  }

  $user = wp_authenticate($email, $current);
  if (is_wp_error($user)) {
    return new WP_Error('ct_auth_failed', 'No pudimos actualizar la contraseña.', ['status' => 401]);
  }

  wp_set_password($next, (int) $user->ID);
  return rest_ensure_response(['ok' => true]);
}

function ct_auth_is_store_customer(WP_User $user): bool {
  $roles = (array) $user->roles;
  return in_array('customer', $roles, true) || in_array('subscriber', $roles, true);
}

function ct_auth_find_order_billing(string $email): ?array {
  if (!function_exists('wc_get_orders')) {
    return null;
  }

  $orders = wc_get_orders([
    'billing_email' => $email,
    'limit' => 1,
    'status' => ['processing', 'completed', 'on-hold'],
    'orderby' => 'date',
    'order' => 'DESC',
  ]);

  if (empty($orders)) {
    return null;
  }

  $order = $orders[0];
  if (!is_object($order) || !method_exists($order, 'get_billing_first_name')) {
    return null;
  }

  return [
    'email' => $email,
    'firstName' => (string) $order->get_billing_first_name(),
    'lastName' => (string) $order->get_billing_last_name(),
  ];
}

function ct_auth_provision_customer_from_orders(string $email): WP_User|WP_Error {
  $existing = get_user_by('email', $email);
  if ($existing instanceof WP_User) {
    if (ct_auth_is_store_customer($existing)) {
      return $existing;
    }
    return new WP_Error('ct_auth_not_found', 'No encontrado.', ['status' => 404]);
  }

  $billing = ct_auth_find_order_billing($email);
  if ($billing === null) {
    return new WP_Error('ct_auth_not_found', 'No encontrado.', ['status' => 404]);
  }

  $first = sanitize_text_field($billing['firstName']);
  $last = sanitize_text_field($billing['lastName']);
  $password = wp_generate_password(24, true, true);

  $user_id = wp_insert_user([
    'user_login' => $email,
    'user_email' => $email,
    'user_pass' => $password,
    'first_name' => $first,
    'last_name' => $last,
    'display_name' => trim($first . ' ' . $last) ?: $email,
    'role' => 'customer',
  ]);

  if (is_wp_error($user_id)) {
    return new WP_Error('ct_auth_failed', 'No pudimos preparar la cuenta.', ['status' => 500]);
  }

  if ($first !== '') {
    update_user_meta((int) $user_id, 'first_name', $first);
  }
  if ($last !== '') {
    update_user_meta((int) $user_id, 'last_name', $last);
  }
  if (function_exists('wc_update_new_customer_past_orders')) {
    wc_update_new_customer_past_orders((int) $user_id);
  }

  $user = get_user_by('id', (int) $user_id);
  if (!$user instanceof WP_User) {
    return new WP_Error('ct_auth_failed', 'No pudimos preparar la cuenta.', ['status' => 500]);
  }

  return $user;
}

function ct_auth_customer_by_email(WP_REST_Request $request) {
  $limited = ct_auth_rate_limit('lookup', 24, 600);
  if (is_wp_error($limited)) {
    return $limited;
  }

  $email = sanitize_email((string) $request->get_param('email'));
  if ($email === '' || !is_email($email)) {
    return new WP_Error('ct_auth_invalid', 'Correo inválido.', ['status' => 400]);
  }

  $user = get_user_by('email', $email);
  if (!$user instanceof WP_User || !ct_auth_is_store_customer($user)) {
    $provisioned = ct_auth_provision_customer_from_orders($email);
    if (is_wp_error($provisioned)) {
      return $provisioned;
    }
    $user = $provisioned;
  }

  return rest_ensure_response(ct_auth_customer_payload($user));
}

function ct_auth_set_password(WP_REST_Request $request) {
  $limited = ct_auth_rate_limit('set-password', 12, 600);
  if (is_wp_error($limited)) {
    return $limited;
  }

  $customer_id = (int) $request->get_param('customerId');
  $password = (string) $request->get_param('password');
  if ($customer_id <= 0 || strlen($password) < 8) {
    return new WP_Error('ct_auth_invalid', 'Datos incompletos.', ['status' => 400]);
  }

  $user = get_user_by('id', $customer_id);
  if (!$user instanceof WP_User || !ct_auth_is_store_customer($user)) {
    return new WP_Error('ct_auth_not_found', 'No encontrado.', ['status' => 404]);
  }

  wp_set_password($password, $customer_id);
  return rest_ensure_response(['ok' => true]);
}
