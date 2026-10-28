/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the separately deployed Express backend (e.g. http://localhost:4000/api).
   * When unset or empty, the app runs on built-in mock data.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
