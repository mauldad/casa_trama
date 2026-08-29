/// <reference types="astro/client" />

interface Window {
  dataLayer?: Array<Record<string, unknown>>;
}

interface ImportMetaEnv {
  readonly SITE_URL: string;
  readonly PUBLIC_WP_URL: string;
  readonly WP_GRAPHQL_URL?: string;
  readonly WOO_STORE_API_URL: string;
  readonly PUBLIC_GTM_ID: string;
  readonly RESEND_API_KEY: string;
  readonly DATABASE_URL: string;
  readonly PAYMENT_PROVIDER: 'mock' | 'webpay';
  readonly TRANSBANK_ENV: 'integration' | 'production';
  readonly TRANSBANK_COMMERCE_CODE: string;
  readonly TRANSBANK_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
