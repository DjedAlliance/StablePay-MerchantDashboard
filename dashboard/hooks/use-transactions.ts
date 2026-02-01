import { useState, useEffect, useCallback } from 'react';
import { transactionService, TransactionEvent, FetchState } from '@/lib/transaction-service';

// Cache transactions in localStorage
const CACHE_KEY = 'stablepay_transactions_v2';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CachedData {
    transactions: any[];
    fetchState: any;
    timestamp: number;
}

// Helper to serialize BigInt in FetchState
const serializeState = (state: FetchState) => {
    return {
        cursors: Object.fromEntries(
            Object.entries(state.cursors).map(([k, v]) => [k, v.toString()])
        ),
        buffers: Object.fromEntries(
            Object.entries(state.buffers).map(([k, events]) => [k, events.map(e => ({
                ...e,
                blockNumber: e.blockNumber.toString()
            }))])
        ),
        hasMore: state.hasMore
    };
};

// Helper to deserialize FetchState
const deserializeState = (state: any): FetchState => {
    return {
        cursors: Object.fromEntries(
            Object.entries(state.cursors).map(([k, v]) => [k, BigInt(v as string)])
        ),
        buffers: Object.fromEntries(
            Object.entries(state.buffers).map(([k, events]) => [k, (events as any[]).map(e => ({
                ...e,
                blockNumber: BigInt(e.blockNumber),
                timestamp: e.timestamp ? new Date(e.timestamp) : undefined
            }))])
        ),
        hasMore: state.hasMore
    };
};

export function useTransactions() {
    const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
    const [fetchState, setFetchState] = useState<FetchState | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Load cached data on mount
    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { transactions: cachedTransactions, fetchState: cachedState, timestamp }: CachedData = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

                if (!isExpired && cachedTransactions.length > 0) {
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber),
                        timestamp: event.timestamp ? new Date(event.timestamp) : undefined
                    }));
                    setTransactions(restoredTransactions);
                    
                    if (cachedState) {
                        const restoredState = deserializeState(cachedState);
                        setFetchState(restoredState);
                        setHasMore(restoredState.hasMore);
                    }
                    
                    setHasFetched(true);
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
                localStorage.removeItem(CACHE_KEY);
            }
        }
    }, []);

    const fetchTransactions = useCallback(async (isLoadMore: boolean = false) => {
        // Prevent strictly if loading, unless it's a new fetch call that might override? 
        // For simplicity: lock if loading.
        // But we need to handle "Refresh" when detailed state is stagnant?
        // We'll trust the user to not hammer the button or the UI to disable it.
        if (loading) return; 

        // If loading more and we know there's no more, stop.
        if (isLoadMore && !hasMore) return;

        try {
            setLoading(true);
            setError(null);
            
            const merchantAddress = ''; 
            
            // If fetching fresh (not load more), reset state
            const stateToUse = isLoadMore ? fetchState : undefined;
            
            const { events, nextState } = await transactionService.fetchTransactions({
                limit: 25,
                state: stateToUse,
                merchantAddress
            });
            
            // If we are loading more, append events. If fresh, replace.
            const newTransactions = isLoadMore ? [...transactions, ...events] : events;
            
            setTransactions(newTransactions);
            setFetchState(nextState);
            setHasMore(nextState.hasMore);
            setHasFetched(true);

            // Cache the data
            const serializableTransactions = newTransactions.map(event => ({
                ...event,
                blockNumber: event.blockNumber.toString()
            }));

            const cacheData: CachedData = {
                transactions: serializableTransactions,
                fetchState: nextState ? serializeState(nextState) : undefined,
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    }, [fetchState, hasMore, loading, transactions]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchTransactions(true);
        }
    }, [fetchTransactions, loading, hasMore]);

    const clearCache = useCallback(() => {
        localStorage.removeItem(CACHE_KEY);
        setTransactions([]);
        setFetchState(undefined);
        setHasMore(true);
        setHasFetched(false);
    }, []);

    return {
        transactions,
        loading,
        error,
        hasFetched,
        hasMore,
        loadMore,
        fetchTransactions: () => fetchTransactions(false),
        clearCache
    };
}
