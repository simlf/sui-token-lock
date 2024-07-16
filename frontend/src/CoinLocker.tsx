import React, { useState } from 'react';
import { ConnectButton, useCurrentAccount, useSuiClient, useSuiClientContext, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';
import { Transaction } from '@mysten/sui/transactions';
import { Button, TextField, Text } from '@radix-ui/themes';

const CoinLocker: React.FC = () => {
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState('');
    const [status, setStatus] = useState('');

    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    // const ctx = useSuiClientContext();
    const packageId = useNetworkVariable('packageId');  // Assuming you've set this up in networkConfig

    const { mutate: signAndExecute } = useSignAndExecuteTransaction({
        execute: async ({ bytes, signature }) =>
            await suiClient.executeTransactionBlock({
                transactionBlock: bytes,
                signature,
                options: {
                    showEffects: true,
                    showEvents: true,
                },
            }),
    });

const handleLockCoin = () => {
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const handleLockCoin = async () => {
        if (!currentAccount?.address) {
            setStatus('Please connect your wallet');
            return;
        }

        const txb = new Transaction();

        // Split the coin from gas
        const [coinToLock] = txb.splitCoins(txb.gas, [txb.pure.u64(amount)]);

        // Call the lock_coin_entry function
        txb.moveCall({
            target: `${packageId}::token_lock::lock_coin_entry`,
            arguments: [
                txb.object('0x6'), // Clock object ID
                coinToLock,
                txb.pure.u64(duration),
            ],
        });

        try {
            await signAndExecuteTransaction({
                transaction: txb,
            });
            setStatus('Coins locked successfully');
        } catch (error) {
            console.error('Error executing transaction:', error);
            setStatus(`Error: ${error.message}`);
        }
    };

    return (
        // Your component JSX here
        <button onClick={handleLockCoin}>Lock Coin</button>
    );
};

const handleUnlockCoin = async () => {
    if (!currentAccount?.address) {
        setStatus('Please connect your wallet');
        return;
    }

    const tx = new Transaction();
    tx.moveCall({
        target: `${packageId}::token_lock::unlock_coin_entry`,
        arguments: [tx.pure(currentAccount.address)],
    });

    try {
        await signAndExecute({
            transaction: tx,
        }, {
            onSuccess: (result) => {
                console.log('Transaction successful:', result);
                setStatus('Coins unlocked successfully');
            },
            onError: (error) => {
                console.error('Transaction failed:', error);
                setStatus(`Failed to unlock coins: ${error.message}`);
            },
        });
    } catch (error) {
        console.error('Error executing transaction:', error);
        setStatus(`Error: ${error.message}`);
    }
    };

    if (!currentAccount) {
        return <ConnectButton />;
    }

    return (
        <div>
            <TextField.Root
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount of SUI to lock"
            />
            <TextField.Root
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Duration in seconds"
            />
            <Button onClick={handleLockCoin}>Lock Coin</Button>
            <Button onClick={handleUnlockCoin}>Unlock Coin</Button>
            <Text>{status}</Text>
        </div>
    );
};

export default CoinLocker;

// import React, { useState } from 'react';
// import { ConnectButton, useCurrentAccount, useSuiClientMutation } from '@mysten/dapp-kit';
//
// const CoinLocker: React.FC = () => {
//     const accountInfo = useCurrentAccount();  // Get the entire account info object, assuming typing is correctly set by the library
//     const lockCoinMutation = useSuiClientMutation('lockCoin'); // Assuming the mutation functions are typed by the library
//     const unlockCoinMutation = useSuiClientMutation('unlockCoin');
//
//     const [amount, setAmount] = useState<string>('');
//     const [duration, setDuration] = useState<string>('');
//
//     console.log("Account Info:", accountInfo); // Log account info to see if and when it becomes available
//
//     const handleLockCoin = async () => {
//         if (accountInfo && accountInfo.address) {
//             console.log("Attempting to lock coins:", amount, "for duration:", duration); // Log attempt to lock coins
//             await lockCoinMutation.mutateAsync({
//                 amount: parseFloat(amount),
//                 duration: parseInt(duration),
//                 owner: accountInfo.address,
//             });
//         }
//     };
//
//     const handleUnlockCoin = async () => {
//         if (accountInfo && accountInfo.address) {
//             console.log("Attempting to unlock coins for account:", accountInfo.address); // Log unlock attempt
//             await unlockCoinMutation.mutateAsync({ owner: accountInfo.address });
//         }
//     };
//
//     if (!accountInfo || !accountInfo.address) {
//         console.log("No account info available, showing connect button.");
//         return <ConnectButton />;  // Log when showing the connect button
//     }
//
//     return (
//         <div>
//             <input
//                 type="number"
//                 value={amount}
//                 onChange={e => setAmount(e.target.value)}
//                 placeholder="Amount of SUI to lock"
//             />
//             <input
//                 type="number"
//                 value={duration}
//                 onChange={e => setDuration(e.target.value)}
//                 placeholder="Duration in seconds"
//             />
//             <button onClick={handleLockCoin}>Lock Coin</button>
//             <button onClick={handleUnlockCoin}>Unlock Coin</button>
//         </div>
//     );
// };
//
// export default CoinLocker;
//
