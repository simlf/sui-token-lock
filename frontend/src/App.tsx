// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
//
// function App() {
//   const [count, setCount] = useState(0)
//
//   return (
//     <>
//       <div>
//         <a href="https://vitejs.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }
//
// export default App

import { ConnectButton, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import CoinLocker from './CoinLocker';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <ConnectButton />
            </header>

            <ConnectedAccount />
        </div>
    );
}

function ConnectedAccount() {
    const account = useCurrentAccount();

    if (!account) {
        return null;
    }

    return (
        <div>
            <div>Connected to {account.address}</div>;
            <OwnedObjects address={account.address} />
            <CoinLocker />
        </div>
    );
}

function OwnedObjects({ address }: { address: string }) {
    const { data } = useSuiClientQuery('getOwnedObjects', {
        owner: address,
    });
    if (!data) {
        return null;
    }

    return (
        <ul>
            {data.data.map((object) => (
                <li key={object.data?.objectId}>
                    <a href={`https://example-explorer.com/object/${object.data?.objectId}`}>
                        {object.data?.objectId}
                    </a>
                </li>
            ))}
        </ul>
    );
}
export default App
