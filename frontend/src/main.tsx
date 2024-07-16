// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App.tsx'
//
// import '@mysten/dapp-kit/dist/index.css';
// import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
// import { getFullnodeUrl } from '@mysten/sui/client';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
//
// const queryClient = new QueryClient();
// const networks = {
//     devnet: { url: getFullnodeUrl('devnet') },
//     mainnet: { url: getFullnodeUrl('mainnet') },
// };
//
// ReactDOM.createRoot(document.getElementById('root')!).render(
//     <React.StrictMode>
//         <QueryClientProvider client={queryClient}>
//             <SuiClientProvider networks={networks} defaultNetwork="devnet">
//                 <WalletProvider>
//                     <App />
//                 </WalletProvider>
//             </SuiClientProvider>
//         </QueryClientProvider>
//     </React.StrictMode>,
// );

// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import ReactDOM from 'react-dom/client';

import '@mysten/dapp-kit/dist/index.css';
import '@radix-ui/themes/styles.css';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { Theme } from '@radix-ui/themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import App from './App.tsx';
import { networkConfig } from './config';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Theme appearance="light">
            <QueryClientProvider client={queryClient}>
                <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
                    <WalletProvider autoConnect>
                        <>
                            <Toaster position="top-center" />
                            <App />
                        </>
                    </WalletProvider>
                </SuiClientProvider>
            </QueryClientProvider>
        </Theme>
    </React.StrictMode>,
);
