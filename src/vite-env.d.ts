/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_B2_BUCKET_NAME: string;
  readonly VITE_B2_ENDPOINT: string;
  readonly VITE_B2_REGION: string;
  readonly VITE_POSTHOG_KEY: string;
  readonly VITE_POSTHOG_HOST: string;
  readonly VITE_RAZORPAY_KEY_ID: string;
  readonly VITE_BILLING_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
