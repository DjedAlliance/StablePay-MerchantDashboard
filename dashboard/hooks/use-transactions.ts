import { useState, useEffect } from 'react';
import { transactionService, TransactionEvent } from '@/lib/transaction-service';

// Persistent cache configuration (indefinite storage)
const CACHE_KEY_PREFIX = 'stablepay_transactions';
const LAST_SYNCED_BLOCK_KEY_PREFIX = 'stablepay_last_synced_block';

interface CachedData {
    transactions: (Omit<TransactionEvent, 'blockNumber'> & { blockNumber: string })[];
    lastSyncedBlock: string;
    merchantAddress: string;
    timestamp: number;
}

export function useTransactions(merchantAddress?: string) {
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [lastSyncedBlock, setLastSyncedBlock] = useState<bigint | null>(null);

    // Generate wallet-specific cache key
    const getCacheKey = (address?: string) => {
        return address ? `${CACHE_KEY_PREFIX}_${address.toLowerCase()}` : CACHE_KEY_PREFIX;
    };

    // Load cached data on mount or when merchant address changes
    useEffect(() => {
        const cacheKey = getCacheKey(merchantAddress);
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                const { transactions: cachedTransactions, lastSyncedBlock: cachedBlock, merchantAddress: cachedAddress }: CachedData = JSON.parse(cached);

                // Only use cache if it matches the current merchant address (or both are empty)
                if (!merchantAddress || !cachedAddress || cachedAddress.toLowerCase() === merchantAddress.toLowerCase()) {
                    // Convert string blockNumber back to BigInt
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber)
                    }));
                    setTransactions(restoredTransactions);
                    setLastSyncedBlock(BigInt(cachedBlock));
                    setHasFetched(true);
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
            }
        }
    }, [merchantAddress]);

    const fetchTransactions = async (incrementalFetch: boolean = false) => {
        try {
            setLoading(true);
            setError(null);

            // Determine starting block for incremental fetch
            const fromBlock = incrementalFetch && lastSyncedBlock ? lastSyncedBlock + BigInt(1) : undefined;

            // Fetch transactions with merchant address filter
            const events = await transactionService.fetchStableCoinPurchases(
                merchantAddress || undefined,
                fromBlock
            );

            let updatedTransactions: TransactionEvent[];

            if (incrementalFetch && lastSyncedBlock) {
                // Append new transactions and deduplicate by transactionHash
                const existingHashes = new Set(transactions.map((tx: TransactionEvent) => tx.transactionHash));
                const newTransactions = events.filter((tx: TransactionEvent) => !existingHashes.has(tx.transactionHash));
                updatedTransactions = [...transactions, ...newTransactions];
            } else {
                // First fetch or full refresh
                updatedTransactions = events;
            }

            // Sort by block number (descending - newest first)
            updatedTransactions.sort((a, b) => Number(b.blockNumber - a.blockNumber));

            setTransactions(updatedTransactions);
            setHasFetched(true);

            // Update lastSyncedBlock to the highest block number
            if (updatedTransactions.length > 0) {
                const maxBlock = updatedTransactions.reduce((max, tx) =>
                    tx.blockNumber > max ? tx.blockNumber : max,
                    BigInt(0)
                );
                setLastSyncedBlock(maxBlock);

                // Cache the data (convert BigInt to string for serialization)
                const serializableEvents = updatedTransactions.map(event => ({
                    ...event,
                    blockNumber: event.blockNumber.toString()
                }));

                const cacheData: CachedData = {
                    transactions: serializableEvents as any,
                    lastSyncedBlock: maxBlock.toString(),
                    merchantAddress: merchantAddress || '',
                    timestamp: Date.now()
                };

                const cacheKey = getCacheKey(merchantAddress);
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
        const cacheKey = getCacheKey(merchantAddress);
        localStorage.removeItem(cacheKey);
        setTransactions([]);
        setHasFetched(false);
        setLastSyncedBlock(null);
    };

    return {
        transactions,
        loading,
        error,
        hasFetched,
        lastSyncedBlock,
        fetchTransactions,
        clearCache
    };
}