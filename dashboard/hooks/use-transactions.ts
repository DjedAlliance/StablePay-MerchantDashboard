import { useState, useEffect, useCallback } from 'react';
import { transactionService, TransactionEvent } from '@/lib/transaction-service';
import { getStoredMerchantAddress } from './use-wallet';

// Persistent cache keys
const CACHE_KEY = 'stablepay_transactions';

interface SerializableTransaction extends Omit<TransactionEvent, 'blockNumber'> {
    blockNumber: string;
}

interface CachedData {
    transactions: SerializableTransaction[];
    lastSyncedBlock: string;
    merchantAddress: string;
}

/**
 * Hook for managing blockchain transactions with:
 * - Wallet-based filtering (merchant as receiver)
 * - Persistent localStorage cache (indefinite, no expiry)
 * - Incremental fetching via lastSyncedBlock tracking
 */
export function useTransactions() {
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [lastSyncedBlock, setLastSyncedBlock] = useState<bigint | null>(null);

    // Load cached data on mount (persistent - no expiry)
    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return;

        try {
            const data: CachedData = JSON.parse(cached);
            const currentMerchant = getStoredMerchantAddress();

            // Only restore cache if merchant address matches
            if (currentMerchant && data.merchantAddress.toLowerCase() === currentMerchant.toLowerCase()) {
                const restored = data.transactions.map(tx => ({
                    ...tx,
                    blockNumber: BigInt(tx.blockNumber)
                }));
                setTransactions(restored);
                setLastSyncedBlock(BigInt(data.lastSyncedBlock));
                setHasFetched(true);
            } else if (currentMerchant && data.merchantAddress !== currentMerchant) {
                // Clear stale cache for different merchant
                localStorage.removeItem(CACHE_KEY);
            }
        } catch {
            localStorage.removeItem(CACHE_KEY);
        }
    }, []);

    const saveToCache = useCallback((txs: TransactionEvent[], block: bigint, merchant: string) => {
        const serializable: SerializableTransaction[] = txs.map(tx => ({
            ...tx,
            blockNumber: tx.blockNumber.toString()
        }));

        const cacheData: CachedData = {
            transactions: serializable,
            lastSyncedBlock: block.toString(),
            merchantAddress: merchant
        };

        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (e) {
            // Handle quota exceeded
            if (e instanceof Error && e.name === 'QuotaExceededError') {
                localStorage.removeItem(CACHE_KEY);
            }
        }
    }, []);

    const fetchTransactions = useCallback(async (incremental = false) => {
        const merchantAddress = getStoredMerchantAddress();
        
        if (!merchantAddress) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const startBlock = incremental && lastSyncedBlock 
                ? lastSyncedBlock + BigInt(1) 
                : undefined;

            const newEvents = await transactionService.fetchStableCoinPurchases(
                merchantAddress,
                startBlock
            );

            // Deduplicate by transaction hash
            const existingHashes = new Set(transactions.map(tx => tx.transactionHash));
            const uniqueNew = newEvents.filter(tx => !existingHashes.has(tx.transactionHash));
            
            const allTransactions = incremental 
                ? [...transactions, ...uniqueNew]
                : newEvents;

            setTransactions(allTransactions);
            setHasFetched(true);

            // Update lastSyncedBlock
            const maxBlock = allTransactions.length > 0
                ? allTransactions.reduce((max, tx) => tx.blockNumber > max ? tx.blockNumber : max, BigInt(0))
                : lastSyncedBlock || BigInt(0);
            
            setLastSyncedBlock(maxBlock);
            saveToCache(allTransactions, maxBlock, merchantAddress);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    }, [transactions, lastSyncedBlock, saveToCache]);

    const fetchFreshData = useCallback(() => fetchTransactions(true), [fetchTransactions]);

    const clearCache = useCallback(() => {
        localStorage.removeItem(CACHE_KEY);
        setTransactions([]);
        setLastSyncedBlock(null);
        setHasFetched(false);
        setError(null);
    }, []);

    return {
        transactions,
        loading,
        error,
        hasFetched,
        lastSyncedBlock,
        fetchTransactions: () => fetchTransactions(false),
        fetchFreshData,
        clearCache
    };
}
