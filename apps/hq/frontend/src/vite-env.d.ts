/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional same-origin base for apiGet; leave empty when using the /hq proxy. */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
