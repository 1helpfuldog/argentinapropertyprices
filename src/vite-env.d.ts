/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEWSLETTER_WEBHOOK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
