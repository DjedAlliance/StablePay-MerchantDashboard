import { useState, useEffect } from 'react';
import { transactionService, TransactionEvent } from '@/lib/transaction-service';
import { getStoredMerchantAddress } from './use-wallet';

// Cache transactions in localStorage (persistent - no expiry)
const CACHE_KEY = 'stablepay_transactions';
const LAST_SYNCED_BLOCK_KEY = 'stablepay_last_synced_block';

interface CachedData {
    transactions: (Omit<TransactionEvent, 'blockNumber'> & { blockNumber: string })[];
    lastSyncedBlock: string;
    merchantAddress: string;
}

export function useTransactions() {
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [lastSyncedBlock, setLastSyncedBlock] = useState<bigint | null>(null);

    // Load cached data on mount (persistent cache - no expiry)
    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { transactions: cachedTransactions, lastSyncedBlock: cachedBlock, merchantAddress }: CachedData = JSON.parse(cached);
                const currentMerchantAddress = getStoredMerchantAddress();
                
                // Only load cache if it matches current merchant address
                if (currentMerchantAddress && merchantAddress === currentMerchantAddress) {
                    // Convert string blockNumber back to BigInt
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber)
                    }));
                    setTransactions(restoredTransactions);
                    setLastSyncedBlock(BigInt(cachedBlock));
                    setHasFetched(true);
                    console.log(`Loaded ${restoredTransactions.length} cached transactions for merchant ${merchantAddress}`);
                } else {
                    // Clear cache if merchant address changed
                    console.log('Merchant address changed, clearing cache');
                    localStorage.removeItem(CACHE_KEY);
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
                localStorage.removeItem(CACHE_KEY);
            }
        }
    }, []);

    const fetchTransactions = async (incrementalFetch = false) => {
        try {
            setLoading(true);
            setError(null);
            
            // Get merchant address from localStorage
            const merchantAddress = getStoredMerchantAddress();
            
            if (!merchantAddress) {
                setError('Please connect your wallet first');
                setLoading(false);
                return;
            }

            console.log(`Fetching transactions for merchant: ${merchantAddress}`);
            
            let newEvents: TransactionEvent[];
            
            if (incrementalFetch && lastSyncedBlock) {
                // Incremental fetch: only get transactions after last synced block
                console.log(`Incremental fetch from block ${lastSyncedBlock + BigInt(1)}`);
                newEvents = await transactionService.fetchStableCoinPurchases(
                    merchantAddress,
                    lastSyncedBlock + BigInt(1)
                );
                
                // Append new transactions to existing ones
                const updatedTransactions = [...transactions, ...newEvents];
                setTransactions(updatedTransactions);
                
                console.log(`Fetched ${newEvents.length} new transactions`);
            } else {
                // Full fetch from start
                console.log('Full fetch from start');
                newEvents = await transactionService.fetchStableCoinPurchases(merchantAddress);
                setTransactions(newEvents);
            }
            
            setHasFetched(true);

            // Update last synced block to the latest block number
            if (newEvents.length > 0) {
                const maxBlock = newEvents.reduce((max, event) => 
                    event.blockNumber > max ? event.blockNumber : max, 
                    lastSyncedBlock || BigInt(0)
                );
                setLastSyncedBlock(maxBlock);
            }

            // Cache the data (convert BigInt to string for serialization)
            const allTransactions = incrementalFetch && lastSyncedBlock 
                ? [...transactions, ...newEvents] 
                : newEvents;
            
            const serializableEvents = allTransactions.map(event => ({
                ...event,
                blockNumber: event.blockNumber.toString()
            }));

            const newLastSyncedBlock = allTransactions.length > 0
                ? allTransactions.reduce((max, event) => 
                    event.blockNumber > max ? event.blockNumber : max, 
                    BigInt(0)
                  ).toString()
                : (lastSyncedBlock || BigInt(0)).toString();

            const cacheData: CachedData = {
                transactions: serializableEvents as any,
                lastSyncedBlock: newLastSyncedBlock,
                merchantAddress: merchantAddress
            };
            
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            console.log(`Cached ${allTransactions.length} total transactions, last synced block: ${newLastSyncedBlock}`);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const fetchFreshData = async () => {
        // Incremental fetch - only get new transactions
        await fetchTransactions(true);
    };

    const clearCache = () => {
        localStorage.removeItem(CACHE_KEY);
        setTransactions([]);
        setLastSyncedBlock(null);
        setHasFetched(false);
        console.log('Cache cleared');
    };

    return {
        transactions,
        loading,
        error,
        hasFetched,
        fetchTransactions: () => fetchTransactions(false),
        fetchFreshData,
        clearCache,
        lastSyncedBlock
    };
}