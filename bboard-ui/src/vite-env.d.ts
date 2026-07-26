/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK_ID: string;
  readonly VITE_LOGGING_LEVEL?: string;
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_INDEXER_URI?: string;
  readonly VITE_INDEXER_WS_URI?: string;
  readonly VITE_PROOF_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
