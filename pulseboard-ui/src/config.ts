const CONTRACT_KEY = 'pulseboard:contract-address';

export type AppConfig = {
  networkId: string;
  contractAddress: string | null;
  indexerUri: string | null;
  indexerWsUri: string | null;
  proofServerUri: string | null;
  loggingLevel: string;
};

export function networkLabel(networkId: string): string {
  switch (networkId) {
    case 'undeployed':
      return 'Local devnet';
    case 'preview':
      return 'Preview';
    case 'preprod':
      return 'Preprod';
    default:
      return networkId;
  }
}

export function loadConfig(): AppConfig {
  const envAddress = import.meta.env.VITE_CONTRACT_ADDRESS?.trim() || null;
  const override = localStorage.getItem(CONTRACT_KEY)?.trim() || null;
  return {
    networkId: import.meta.env.VITE_NETWORK_ID || 'undeployed',
    contractAddress: override || envAddress,
    indexerUri: import.meta.env.VITE_INDEXER_URI?.trim() || null,
    indexerWsUri: import.meta.env.VITE_INDEXER_WS_URI?.trim() || null,
    proofServerUri: import.meta.env.VITE_PROOF_SERVER_URL?.trim() || null,
    loggingLevel: import.meta.env.VITE_LOGGING_LEVEL || 'info',
  };
}

export function saveContractAddressOverride(address: string | null) {
  if (!address?.trim()) localStorage.removeItem(CONTRACT_KEY);
  else localStorage.setItem(CONTRACT_KEY, address.trim());
  window.dispatchEvent(new Event('pulseboard:config'));
}

export const LACE_STORE_URL = 'https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk';
