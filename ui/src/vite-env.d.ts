/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_IMS_URL: string,
    readonly VITE_AP_URL: string,
    readonly VITE_SNOMIO_URL: string,
    readonly VITE_SNOMIO_UI_URL: string,
    readonly VITE_SNOMIO_PROD_UI_URL: string,
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}