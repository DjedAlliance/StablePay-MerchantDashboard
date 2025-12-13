import { useState, useEffect } from 'react';
import { transactionService, TransactionEvent } from '@/lib/transaction-service';
import { useWallet } from './use-wallet';

// Cache transactions indefinitely in localStorage
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
    const { walletAddress, isConnected } = useWallet();

    // Load cached data on mount
    useEffect(() => {
        if (!isConnected || !walletAddress) return;

        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { transactions: cachedTransactions, lastSyncedBlock: cachedBlock, merchantAddress }: CachedData = JSON.parse(cached);
                
                // Only use cache if it matches the current wallet address
                if (merchantAddress.toLowerCase() === walletAddress.toLowerCase()) {
                    // Convert string blockNumber back to BigInt
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber)
                    }));
                    
                    setTransactions(restoredTransactions);
                    setLastSyncedBlock(BigInt(cachedBlock));
                    setHasFetched(true);
                    console.log(`Loaded ${restoredTransactions.length} cached transactions for ${walletAddress}`);
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
                localStorage.removeItem(CACHE_KEY);
            }
        }
    }, [isConnected, walletAddress]);

    const fetchTransactions = async (incremental = false) => {
        if (!isConnected || !walletAddress) {
            setError('Please connect your wallet first');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log(`Fetching transactions for merchant: ${walletAddress}`);
            console.log(incremental ? `Incremental fetch from block ${lastSyncedBlock}` : 'Full fetch');
            
            // Fetch transactions filtered by wallet address
            // For incremental fetch, pass the last synced block
            const fromBlock = incremental && lastSyncedBlock ? lastSyncedBlock + 1n : undefined;
            const events = await transactionService.fetchStableCoinPurchases(walletAddress, fromBlock);
            
            console.log(`Fetched ${events.length} new transactions`);
            
            let updatedTransactions: TransactionEvent[];
            
            if (incremental && transactions.length > 0) {
                // Append new transactions to existing cache
                updatedTransactions = [...transactions, ...events];
                console.log(`Appended ${events.length} new transactions to existing ${transactions.length}`);
            } else {
                // Replace with new transactions
                updatedTransactions = events;
            }
            
            setTransactions(updatedTransactions);
            setHasFetched(true);
            
            // Update last synced block if we have transactions
            if (events.length > 0) {
                const maxBlock = events.reduce((max, event) => 
                    event.blockNumber > max ? event.blockNumber : max, 
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
                    merchantAddress: walletAddress
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
                console.log(`Cached ${updatedTransactions.length} transactions, last block: ${maxBlock}`);
            }
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
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
        lastSyncedBlock,
        merchantAddress: walletAddress,
        fetchTransactions,
        clearCache
    };
}
