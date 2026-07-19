/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_NEON_AUTH_URL?: string
  readonly VITE_NEON_DATA_API_URL?: string
  readonly VITE_VAPID_PUBLIC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
