import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Store merchant address in localStorage
const MERCHANT_ADDRESS_KEY = 'stablepay_merchant_address';

export function useWallet() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();

    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    // Restore merchant address from localStorage on mount
    useEffect(() => {
        const storedAddress = localStorage.getItem(MERCHANT_ADDRESS_KEY);
        if (storedAddress && isConnected) {
            setWalletAddress(storedAddress);
        }
    }, [isConnected]);

    useEffect(() => {
        if (isConnected && address) {
            // Persist merchant address to localStorage
            localStorage.setItem(MERCHANT_ADDRESS_KEY, address);
            setWalletAddress(address);
        } else {
            setWalletAddress(null);
        }
    }, [isConnected, address]);

    const connectWallet = () => {
        connect({ connector: injected() });
    };

    const disconnectWallet = () => {
        // Clear merchant address from localStorage on disconnect
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

// Helper function to get stored merchant address
export function getStoredMerchantAddress(): string | null {
    return localStorage.getItem(MERCHANT_ADDRESS_KEY);
}
