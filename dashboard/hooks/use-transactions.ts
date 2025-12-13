import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi'; 
import { transactionService, TransactionEvent } from '@/lib/transaction-service';

// Cache keys
const CACHE_KEY_TXS = 'stablepay_transactions';
const CACHE_KEY_BLOCK = 'stablepay_last_synced_block';


interface CachedTransaction extends Omit<TransactionEvent, 'blockNumber'> {
    blockNumber: string;
}

export function useTransactions() {
    const { address } = useAccount(); 
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
    const [lastSyncedBlock, setLastSyncedBlock] = useState<bigint>(BigInt(0));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    
    useEffect(() => {
        const cachedTxs = localStorage.getItem(CACHE_KEY_TXS);
        const cachedBlock = localStorage.getItem(CACHE_KEY_BLOCK);

        if (cachedTxs) {
            try {
                const parsedTxs: CachedTransaction[] = JSON.parse(cachedTxs);
                
                
                const restoredTransactions = parsedTxs.map(tx => ({
                    ...tx,
                    blockNumber: BigInt(tx.blockNumber)
                }));
                
                setTransactions(restoredTransactions);
                setHasFetched(true);
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
            }
        }

        if (cachedBlock) {
            setLastSyncedBlock(BigInt(cachedBlock));
        }
    }, []);

    
    useEffect(() => {
        
    }, [address]);

    const fetchTransactions = useCallback(async () => {
        if (!address) {
            setError("Please connect your wallet first.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            
            const fromBlock = lastSyncedBlock > BigInt(0) ? lastSyncedBlock + BigInt(1) : undefined;
            
            console.log(`Starting fetch for ${address} from block: ${fromBlock || 'Default'}`);

            
            const newEvents = await transactionService.fetchStableCoinPurchases(address, fromBlock);
            
            if (newEvents.length > 0) {
                
                const updatedTransactions = [...transactions, ...newEvents];
                
                
                setTransactions(updatedTransactions);
                
               
                let maxBlock = lastSyncedBlock;
                newEvents.forEach(e => {
                    if (e.blockNumber > maxBlock) maxBlock = e.blockNumber;
                });
                setLastSyncedBlock(maxBlock);

                
                const serializableEvents = updatedTransactions.map(event => ({
                    ...event,
                    blockNumber: event.blockNumber.toString()
                }));

                localStorage.setItem(CACHE_KEY_TXS, JSON.stringify(serializableEvents));
                localStorage.setItem(CACHE_KEY_BLOCK, maxBlock.toString());
            } else {
                console.log("No new transactions found.");
                
            }
            
            setHasFetched(true);

        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    }, [address, lastSyncedBlock, transactions]); 

    const clearCache = () => {
        localStorage.removeItem(CACHE_KEY_TXS);
        localStorage.removeItem(CACHE_KEY_BLOCK);
        setTransactions([]);
        setLastSyncedBlock(BigInt(0));
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