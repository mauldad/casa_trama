/// <reference types="astro/client" />

interface Window {
  dataLayer?: Array<Record<string, unknown>>;
  turnstile?: {
    reset: (widget?: HTMLElement | string) => void;
    getResponse: (widget?: HTMLElement | string) => string | undefined;
  };
}

interface ImportMetaEnv {
  readonly SITE_URL: string;
  readonly PUBLIC_WP_URL: string;
  readonly WP_GRAPHQL_URL?: string;
  readonly WOO_STORE_API_URL: string;
  readonly WC_CONSUMER_KEY?: string;
  readonly WC_CONSUMER_SECRET?: string;
  readonly WP_URL?: string;
  readonly CT_AUTH_SECRET?: string;
  readonly CT_SESSION_SECRET?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  readonly TURNSTILE_SECRET?: string;
  readonly TURNSTILE_HOSTNAMES?: string;
  readonly PUBLIC_GTM_ID: string;
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL?: string;
  readonly CONTACT_TO_EMAIL?: string;
  readonly ORDERS_TO_EMAIL?: string;
  readonly LOOPS_API_KEY?: string;
  readonly LOOPS_MAILING_LIST_ID?: string;
  readonly DATABASE_URL: string;
  readonly PAYMENT_PROVIDER: 'mock' | 'webpay';
  readonly TRANSBANK_ENV: 'integration' | 'production';
  readonly TRANSBANK_COMMERCE_CODE: string;
  readonly TRANSBANK_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
