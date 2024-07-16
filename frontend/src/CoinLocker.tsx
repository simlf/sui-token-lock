import React, { useState } from 'react';
import { ConnectButton, useCurrentAccount, useSuiClientMutation } from '@mysten/dapp-kit';

const CoinLocker: React.FC = () => {
    const accountInfo = useCurrentAccount();  // Get the entire account info object, assuming typing is correctly set by the library
    const lockCoinMutation = useSuiClientMutation('lockCoin'); // Assuming the mutation functions are typed by the library
    const unlockCoinMutation = useSuiClientMutation('unlockCoin');

    const [amount, setAmount] = useState<string>('');
    const [duration, setDuration] = useState<string>('');

    console.log("Account Info:", accountInfo); // Log account info to see if and when it becomes available

    const handleLockCoin = async () => {
        if (accountInfo && accountInfo.address) {
            console.log("Attempting to lock coins:", amount, "for duration:", duration); // Log attempt to lock coins
            await lockCoinMutation.mutateAsync({
                amount: parseFloat(amount),
                duration: parseInt(duration),
                owner: accountInfo.address,
            });
        }
    };

    const handleUnlockCoin = async () => {
        if (accountInfo && accountInfo.address) {
            console.log("Attempting to unlock coins for account:", accountInfo.address); // Log unlock attempt
            await unlockCoinMutation.mutateAsync({ owner: accountInfo.address });
        }
    };

    if (!accountInfo || !accountInfo.address) {
        console.log("No account info available, showing connect button.");
        return <ConnectButton />;  // Log when showing the connect button
    }

    return (
        <div>
            <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Amount of SUI to lock"
            />
            <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="Duration in seconds"
            />
            <button onClick={handleLockCoin}>Lock Coin</button>
            <button onClick={handleUnlockCoin}>Unlock Coin</button>
        </div>
    );
};

export default CoinLocker;
