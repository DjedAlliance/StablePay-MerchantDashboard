import { useState, useEffect, useMemo } from 'react';
import { transactionService, TransactionEvent } from '@/lib/transaction-service';

<<<<<<< Updated upstream
// Cache transactions in localStorage
const CACHE_KEY_PREFIX = 'stablepay_transactions';
<<<<<<< Updated upstream
=======
const CACHE_KEY = 'all_transactions';
>>>>>>> Stashed changes
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
=======
>>>>>>> Stashed changes

interface CachedData {
    transactions: (Omit<TransactionEvent, 'blockNumber'> & { blockNumber: string })[];
    lastSyncedBlock: string;
}

<<<<<<< Updated upstream
<<<<<<< Updated upstream
export function useTransactions(walletAddress: string | null) {
=======
export function useTransactions({ merchantAddress }: { merchantAddress?: string | null } = {}) {
>>>>>>> Stashed changes
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
=======
export function useTransactions() {
    const [allTransactions, setAllTransactions] = useState<TransactionEvent[]>([]);
>>>>>>> Stashed changes
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [walletFilter, setWalletFilter] = useState<string>('');

<<<<<<< Updated upstream
    const getCacheKey = () => walletAddress ? `${CACHE_KEY_PREFIX}_${walletAddress}` : null;

    const getCacheKey = () => merchantAddress ? `${CACHE_KEY_PREFIX}_${merchantAddress}` : null;

    // Load cached data on mount
=======
>>>>>>> Stashed changes
    useEffect(() => {
        const cacheKey = getCacheKey();
        if (!cacheKey) return;

        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
<<<<<<< Updated upstream
                const { transactions: cachedTransactions, timestamp }: CachedData = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

                if (!isExpired) {
=======
                const { transactions: cachedTransactions }: CachedData = JSON.parse(cached);
                if (cachedTransactions.length > 0) {
>>>>>>> Stashed changes
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber)
                    }));
                    setAllTransactions(restoredTransactions);
                    setHasFetched(true);
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
            }
        }
<<<<<<< Updated upstream
    }, [walletAddress]);

    const fetchTransactions = async () => {
        if (!walletAddress) return;
=======
    }, [merchantAddress]);

    const fetchTransactions = async () => {
        const cacheKey = getCacheKey();
        if (!merchantAddress || !cacheKey) {
            setError("Merchant address is not available.");
            return;
        }
>>>>>>> Stashed changes

        try {
            setLoading(true);
            setError(null);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            const events = await transactionService.fetchStableCoinPurchases(walletAddress);
            setTransactions(events);
=======
            const events = await transactionService.fetchStableCoinPurchases();
            setAllTransactions(events);
>>>>>>> Stashed changes
            setHasFetched(true);

            const serializableEvents = events.map(event => ({
                ...event,
                blockNumber: event.blockNumber.toString()
            }));

            const cacheData: CachedData = {
                transactions: serializableEvents as any,
                timestamp: Date.now()
            };
            const cacheKey = getCacheKey();
            if (cacheKey) {
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            }
=======

            const cached = localStorage.getItem(cacheKey);
            let lastSyncedBlock = BigInt(0);
            let existingTransactions: TransactionEvent[] = [];

            if (cached) {
                const { transactions: cachedTransactions, lastSyncedBlock: cachedBlock }: CachedData = JSON.parse(cached);
                lastSyncedBlock = BigInt(cachedBlock);
                existingTransactions = cachedTransactions.map(event => ({
                    ...event,
                    blockNumber: BigInt(event.blockNumber)
                }));
            }

            const newEvents = await transactionService.fetchStableCoinPurchases(
                merchantAddress,
                lastSyncedBlock > 0 ? lastSyncedBlock + BigInt(1) : undefined
            );

            if (newEvents.length > 0) {
                const combinedTransactions = [...existingTransactions, ...newEvents];
                setTransactions(combinedTransactions);

                const latestBlock = newEvents.reduce((max, t) => t.blockNumber > max ? t.blockNumber : max, lastSyncedBlock);

                const serializableEvents = combinedTransactions.map(event => ({
                    ...event,
                    blockNumber: event.blockNumber.toString()
                }));

                const cacheData: CachedData = {
                    transactions: serializableEvents,
                    lastSyncedBlock: latestBlock.toString()
                };
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            }
            setHasFetched(true);
>>>>>>> Stashed changes
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const clearCache = () => {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
        const cacheKey = getCacheKey();
        if (cacheKey) {
            localStorage.removeItem(cacheKey);
        }
        setTransactions([]);
=======
        localStorage.removeItem(CACHE_KEY);
        setAllTransactions([]);
>>>>>>> Stashed changes
        setHasFetched(false);
    };

    const filteredTransactions = useMemo(() => {
        if (!walletFilter.trim()) {
            return allTransactions;
        }
        
        const normalizedFilter = walletFilter.toLowerCase().trim();
        
        return allTransactions.filter(tx => {
            const buyer = tx.buyer.toLowerCase();
            const receiver = tx.receiver.toLowerCase();
            const txHash = tx.transactionHash.toLowerCase();
            
            return buyer.includes(normalizedFilter) || 
                   receiver.includes(normalizedFilter) ||
                   txHash.includes(normalizedFilter);
        });
    }, [allTransactions, walletFilter]);

    return {
        transactions: filteredTransactions,
        allTransactions,
        loading,
        error,
        hasFetched,
        fetchTransactions,
        clearCache,
        walletFilter,
        setWalletFilter
    };
}