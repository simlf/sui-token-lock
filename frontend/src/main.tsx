import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import '@mysten/dapp-kit/dist/index.css';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const networks = {
    devnet: { url: getFullnodeUrl('devnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networks} defaultNetwork="devnet">
                <WalletProvider>
                    <App />
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
