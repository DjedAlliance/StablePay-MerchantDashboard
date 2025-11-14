import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function useWallet() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    useEffect(() => {
        if (isConnected && address) {
            setWalletAddress(address);
        } else {
            setWalletAddress(null);
        }
    }, [isConnected, address]);

    const connectWallet = () => {
        connect({ connector: injected() });
    };

    const disconnectWallet = () => {
        disconnect();
    };

    return {
        walletAddress,
        isConnected,
        connectWallet,
        disconnectWallet,
    };
}
