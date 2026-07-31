import './globals';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import '@midnight-ntwrk/dapp-connector-api';
import App from './App';
import { logger } from './logger';

const networkId = import.meta.env.VITE_NETWORK_ID || (import.meta.env.PROD ? 'preprod' : 'undeployed');
setNetworkId(networkId);
logger.trace(`networkId = ${networkId}`);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
