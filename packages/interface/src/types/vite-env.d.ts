/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SINGLE_CONTACT_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
