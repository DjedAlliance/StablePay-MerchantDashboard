import { useState, useEffect, useRef } from 'react';
import { transactionService, TransactionEvent } from '@/lib/transaction-service';
import { useWallet } from './use-wallet';

// Cache transactions in localStorage
const CACHE_KEY = 'stablepay_transactions';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CachedData {
    transactions: (Omit<TransactionEvent, 'blockNumber'> & { blockNumber: string })[];
    timestamp: number;
}

export function useTransactions() {
    const { walletAddress } = useWallet();
    const latestWalletRef = useRef<string | null>(walletAddress);
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

       // Clear state when wallet changes
         useEffect(() => {
             latestWalletRef.current = walletAddress;
            // Reset state for new wallet context
            setTransactions([]);
            setHasFetched(false);
            setError(null);
            
            if (!walletAddress) return;
            
            const cacheKey = `${CACHE_KEY}_${walletAddress}`;
            const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { transactions: cachedTransactions, timestamp }: CachedData = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

                if (!isExpired && cachedTransactions.length > 0) {
                    // Convert string blockNumber back to BigInt
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber)
                    }));
                    setTransactions(restoredTransactions);
                    setHasFetched(true);
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
            }
        }
    }, [walletAddress]);

    const fetchTransactions = async () => {
        const requestWallet = latestWalletRef.current;
        try {
            setLoading(true);
            setError(null);
            // Filter for specific merchant address: 
            const merchantAddress = '';
            const events = await transactionService.fetchStableCoinPurchases(merchantAddress);
            if (latestWalletRef.current !== requestWallet) return;
            setTransactions(events);
            setHasFetched(true);

            // Cache the data (convert BigInt to string for serialization)
            const serializableEvents = events.map(event => ({
                ...event,
                blockNumber: event.blockNumber.toString()
            }));

            const cacheData: CachedData = {
                transactions: serializableEvents as any,
                timestamp: Date.now()
            };
               if (requestWallet) {
                    const cacheKey = `${CACHE_KEY}_${requestWallet}`;
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
               }
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };
        const clearCache = () => {
            if (walletAddress) {
                const cacheKey = `${CACHE_KEY}_${walletAddress}`;
                localStorage.removeItem(cacheKey);
            }
        setTransactions([]);
        setHasFetched(false);
    };

    return {
        transactions,
        loading,
        error,
        hasFetched,
        fetchTransactions,
        clearCache
    };
}
