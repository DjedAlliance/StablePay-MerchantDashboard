import { useState, useEffect, useRef } from 'react';
import { transactionService, TransactionEvent } from '@/lib/transaction-service';
import { useWallet } from './use-wallet';

// Persistent cache key prefix
const CACHE_KEY = 'stablepay_transactions';

interface CachedData {
    transactions: (Omit<TransactionEvent, 'blockNumber'> & { blockNumber: string })[];
    lastSyncedBlocks: Record<string, string>; // network -> block number (stringified bigint)
}

export function useTransactions() {
    const { walletAddress } = useWallet();
    const isDevelopment = process.env.NODE_ENV === 'development';
    const activeAddress = isDevelopment ? '' : (walletAddress || '');
    const latestWalletRef = useRef<string>(activeAddress);
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const lastSyncedBlocksRef = useRef<Record<string, bigint>>({});

    // Helper to get the per-wallet cache key
    const getCacheKey = (address: string) => `${CACHE_KEY}_${address || 'dev'}`;

    // Restore from persistent cache on wallet change (indefinite – no expiry)
    useEffect(() => {
        latestWalletRef.current = activeAddress;
        // Reset state for new wallet context
        setTransactions([]);
        setHasFetched(false);
        setError(null);
        setLoading(false);
        lastSyncedBlocksRef.current = {};

        if (!isDevelopment && !activeAddress) return;

        const cacheKey = getCacheKey(activeAddress);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { transactions: cachedTransactions, lastSyncedBlocks }: CachedData = JSON.parse(cached);

                if (cachedTransactions.length > 0) {
                    // Convert string blockNumber back to BigInt
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber)
                    }));
                    setTransactions(restoredTransactions);
                    setHasFetched(true);
                }

                // Restore lastSyncedBlocks
                if (lastSyncedBlocks) {
                    const restored: Record<string, bigint> = {};
                    for (const [network, block] of Object.entries(lastSyncedBlocks)) {
                        restored[network] = BigInt(block);
                    }
                    lastSyncedBlocksRef.current = restored;
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
            }
        }
    }, [activeAddress, isDevelopment]);

    // Persist current state to localStorage
    const persistToCache = (
        txns: TransactionEvent[],
        syncedBlocks: Record<string, bigint>,
        walletKey: string
    ) => {
        const serializableEvents = txns.map(event => ({
            ...event,
            blockNumber: event.blockNumber.toString()
        }));

        const serializedBlocks: Record<string, string> = {};
        for (const [network, block] of Object.entries(syncedBlocks)) {
            serializedBlocks[network] = block.toString();
        }

        const cacheData: CachedData = {
            transactions: serializableEvents as any,
            lastSyncedBlocks: serializedBlocks
        };
        const cacheKey = getCacheKey(walletKey);
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    };

    const fetchTransactions = async () => {
        const requestWallet = latestWalletRef.current;
        try {
            setLoading(true);
            setError(null);
            if (!isDevelopment && !requestWallet) throw new Error('Connect a wallet to fetch transactions');

            // Build per-network fromBlock overrides for incremental fetch.
            // Start from lastSyncedBlock + 1 so we don't re-fetch the last synced block.
            const fromBlocks: Record<string, bigint> | undefined =
                Object.keys(lastSyncedBlocksRef.current).length > 0
                    ? Object.fromEntries(
                          Object.entries(lastSyncedBlocksRef.current).map(
                              ([network, block]) => [network, block + BigInt(1)]
                          )
                      )
                    : undefined;

            const { events: newEvents, highestBlocks } = await transactionService.fetchStableCoinPurchases(
                requestWallet || undefined,
                fromBlocks
            );

            // Bail if the wallet changed while fetching
            if (latestWalletRef.current !== requestWallet) return;

            // Merge: append new events to existing cached transactions, deduplicate by txHash
            setTransactions(prev => {
                const existingHashes = new Set(prev.map(tx => tx.transactionHash));
                const uniqueNew = newEvents.filter(tx => !existingHashes.has(tx.transactionHash));
                const merged = [...prev, ...uniqueNew];

                // Update synced blocks
                lastSyncedBlocksRef.current = { ...lastSyncedBlocksRef.current, ...highestBlocks };

                // Persist merged data
                persistToCache(merged, lastSyncedBlocksRef.current, requestWallet);

                return merged;
            });
            setHasFetched(true);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const clearCache = () => {
        const cacheKey = getCacheKey(activeAddress);
        localStorage.removeItem(cacheKey);
        setTransactions([]);
        setHasFetched(false);
        lastSyncedBlocksRef.current = {};
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
