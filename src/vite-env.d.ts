/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_MSAL_CLIENT_ID?: string;
  readonly NEXT_PUBLIC_MSAL_AUTHORITY?: string;
  readonly NEXT_PUBLIC_MSAL_REDIRECT_URI?: string;
  readonly NEXT_PUBLIC_OA_API_URL?: string;
  readonly VITE_OA_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
