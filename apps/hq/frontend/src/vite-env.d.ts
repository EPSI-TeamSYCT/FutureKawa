/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the central HQ REST API. Empty when running on mocks. */
  readonly VITE_API_URL: string
  /** "true" boots the MSW mock layer instead of a real API. */
  readonly VITE_USE_MOCKS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
