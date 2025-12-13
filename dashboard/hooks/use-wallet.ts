import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Persist merchant address for cross-session availability
const MERCHANT_ADDRESS_KEY = 'stablepay_merchant_address';

/**
 * Get stored merchant address (SSR-safe)
 */
export function getStoredMerchantAddress(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(MERCHANT_ADDRESS_KEY);
}

export function useWallet() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    useEffect(() => {
        if (isConnected && address) {
            // Persist merchant address on connect
            localStorage.setItem(MERCHANT_ADDRESS_KEY, address);
            setWalletAddress(address);
        } else if (!isConnected) {
            setWalletAddress(null);
        } else {
            // Restore from localStorage if connected but address not yet available
            const stored = getStoredMerchantAddress();
            if (stored) setWalletAddress(stored);
        }
    }, [isConnected, address]);

    const connectWallet = () => {
        connect({ connector: injected() });
    };

    const disconnectWallet = () => {
        // Clear merchant address on disconnect
        localStorage.removeItem(MERCHANT_ADDRESS_KEY);
        disconnect();
    };

    return {
        walletAddress,
        isConnected,
        connectWallet,
        disconnectWallet,
    };
}
