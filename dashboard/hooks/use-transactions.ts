"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { parseUnits } from 'viem';
import { transactionService } from '@/lib/transaction-service';
import type { TransactionEvent, NetworkCursorResult } from '@/lib/transaction-service';
import { useWallet } from './use-wallet';

// Cache transactions in localStorage
const CACHE_KEY = 'stablepay_transactions';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const SORT_BY_OPTIONS = ['blockNumber', 'timestamp', 'amountSC', 'amountBC'] as const;
export type SortBy = (typeof SORT_BY_OPTIONS)[number];

export const SORT_DIRECTION_OPTIONS = ['desc', 'asc'] as const;
export type SortDirection = (typeof SORT_DIRECTION_OPTIONS)[number];

const SORT_BY_LABELS: Record<SortBy, string> = {
    blockNumber: 'Block Number',
    timestamp: 'Timestamp',
    amountSC: 'Amount SC',
    amountBC: 'Amount BC',
};
export { SORT_BY_LABELS };

export const getRiskLevel = (amount: string): "high" | "medium" | "low" => {
    const numAmount = parseFloat(amount);
    if (numAmount > 100) return "high";
    if (numAmount > 50) return "medium";
    return "low";
};

export interface TransactionFilters {
    buyer: string;
    receiver: string;
    status: string;
    blockMin: string;
    blockMax: string;
    blockchain: string;
    amountSCMin: string;
    amountSCMax: string;
    amountBCMin: string;
    amountBCMax: string;
    risk: string;
    timestampStart: string;
    timestampEnd: string;
}

export const initialFilters: TransactionFilters = {
    buyer: '',
    receiver: '',
    status: '',
    blockMin: '',
    blockMax: '',
    blockchain: '',
    amountSCMin: '',
    amountSCMax: '',
    amountBCMin: '',
    amountBCMax: '',
    risk: '',
    timestampStart: '',
    timestampEnd: ''
};

interface CachedData {
    transactions: (Omit<TransactionEvent, 'blockNumber' | 'timestamp'> & {
        blockNumber: string;
        timestamp?: string; // ISO string
    })[];
    timestamp: number; // cache creation time
    isAllTransactionsFetched?: boolean;
    networkCursors?: Record<string, string>;
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

    // Progressive fetch state
    const [isAllTransactionsFetched, setIsAllTransactionsFetched] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [networkCursors, setNetworkCursors] = useState<Record<string, string>>({});
    const abortControllerRef = useRef<AbortController | null>(null);
    const MAX_EVENTS = 1000;

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(25);

    // Sorting state
    const [sortBy, setSortBy] = useState<SortBy>('blockNumber');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [fetchingTimestamps, setFetchingTimestamps] = useState(false);
    const [timestampsFetched, setTimestampsFetched] = useState(false);

    // Filtering state
    const [filters, setFilters] = useState<TransactionFilters>(initialFilters);

    const clearFilters = useCallback(() => {
        setFilters(initialFilters);
        setCurrentPage(1);
    }, []);

    const applyFilters = useCallback((newFilters: TransactionFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    }, []);

    // Helper to persist current transactions to cache (including timestamps)
    const persistToCache = useCallback((events: TransactionEvent[], wallet: string, fullyLoaded: boolean, cursors: Record<string, string>) => {
        const serializableEvents: CachedData['transactions'] = events.map(event => ({
            ...event,
            blockNumber: event.blockNumber.toString(),
            timestamp: event.timestamp ? event.timestamp.toISOString() : undefined,
        }));
        const cacheData: CachedData = {
            transactions: serializableEvents,
            timestamp: Date.now(),
            isAllTransactionsFetched: fullyLoaded,
            networkCursors: cursors,
        };
        const cacheKey = `${CACHE_KEY}_${wallet || 'dev'}`;
        try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (err) {
            console.warn('Failed to persist cache:', err);
        }
    }, []);

    // Clear state when wallet changes
    useEffect(() => {
        latestWalletRef.current = activeAddress;
        // Reset state for new wallet context
        setTransactions([]);
        setHasFetched(false);
        setError(null);
        setLoading(false);
        setCurrentPage(1);
        setTimestampsFetched(false);
        if (!isDevelopment && !activeAddress) return;

        const cacheKey = `${CACHE_KEY}_${activeAddress || 'dev'}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { transactions: cachedTransactions, timestamp, isAllTransactionsFetched: cachedFullyLoaded, networkCursors: cachedCursors }: CachedData = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

                if (!isExpired && cachedTransactions.length > 0) {
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber),
                        timestamp: event.timestamp ? new Date(event.timestamp) : undefined,
                    }));
                    setTransactions(restoredTransactions);
                    setHasFetched(true);
                    if (cachedFullyLoaded !== undefined) setIsAllTransactionsFetched(cachedFullyLoaded);
                    if (cachedCursors) setNetworkCursors(cachedCursors);

                    // If cached data already has timestamps, mark as fetched
                    const hasTimestamps = restoredTransactions.some(tx => tx.timestamp);
                    if (hasTimestamps) setTimestampsFetched(true);
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
            }
        }
    }, [activeAddress, isDevelopment]);

    // Filtered transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            if (filters.buyer && !tx.buyer.toLowerCase().includes(filters.buyer.toLowerCase())) return false;
            if (filters.receiver && !tx.receiver.toLowerCase().includes(filters.receiver.toLowerCase())) return false;
            if (filters.status && filters.status !== 'completed' && filters.status !== 'all') return false; // Assuming all are completed in the mock data
            
            if (filters.blockMin && tx.blockNumber < BigInt(filters.blockMin)) return false;
            if (filters.blockMax && tx.blockNumber > BigInt(filters.blockMax)) return false;
            if (filters.blockchain && filters.blockchain !== 'all' && tx.networkName !== filters.blockchain) return false;
            
            if (filters.amountSCMin && parseFloat(tx.amountSC) < parseFloat(filters.amountSCMin)) return false;
            if (filters.amountSCMax && parseFloat(tx.amountSC) > parseFloat(filters.amountSCMax)) return false;
            
            if (filters.amountBCMin && parseFloat(tx.amountBC) < parseFloat(filters.amountBCMin)) return false;
            if (filters.amountBCMax && parseFloat(tx.amountBC) > parseFloat(filters.amountBCMax)) return false;
            
            if (filters.risk && filters.risk !== 'all' && getRiskLevel(tx.amountSC) !== filters.risk.toLowerCase()) return false;
            
            if (filters.timestampStart && (!tx.timestamp || tx.timestamp < new Date(filters.timestampStart))) return false;
            if (filters.timestampEnd && (!tx.timestamp || tx.timestamp > new Date(filters.timestampEnd))) return false;
            
            return true;
        });
    }, [transactions, filters]);

    // Sorted transactions (operates on FILTERED transactions before pagination)
    const sortedTransactions = useMemo(() => {
        const sorted = [...filteredTransactions];
        const dir = sortDirection === 'asc' ? 1 : -1;

        sorted.sort((a, b) => {
            switch (sortBy) {
                case 'blockNumber': {
                    if (a.blockNumber < b.blockNumber) return -1 * dir;
                    if (a.blockNumber > b.blockNumber) return 1 * dir;
                    return 0;
                }
                case 'timestamp': {
                    const aTime = a.timestamp?.getTime() ?? 0;
                    const bTime = b.timestamp?.getTime() ?? 0;
                    return (aTime - bTime) * dir;
                }
                case 'amountSC': {
                    const aSC = parseUnits(a.amountSC, 6);
                    const bSC = parseUnits(b.amountSC, 6);
                    if (aSC < bSC) return -1 * dir;
                    if (aSC > bSC) return 1 * dir;
                    return 0;
                }
                case 'amountBC': {
                    const aBC = parseUnits(a.amountBC, 18);
                    const bBC = parseUnits(b.amountBC, 18);
                    if (aBC < bBC) return -1 * dir;
                    if (aBC > bBC) return 1 * dir;
                    return 0;
                }
                default:
                    return 0;
            }
        });

        return sorted;
    }, [filteredTransactions, sortBy, sortDirection]);

    // Pagination computed values
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(sortedTransactions.length / pageSize));
    }, [sortedTransactions.length, pageSize]);

    // Clamp currentPage when totalPages changes (e.g. after changing pageSize)
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return sortedTransactions.slice(startIndex, endIndex);
    }, [sortedTransactions, currentPage, pageSize]);

    const goToPage = useCallback((page: number) => {
        const clamped = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(clamped);
    }, [totalPages]);

    const changePageSize = useCallback((newSize: PageSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
    }, []);

    // Fetch timestamps on demand (when user sorts by timestamp)
    const fetchTimestamps = useCallback(async () => {
        if (timestampsFetched || fetchingTimestamps || transactions.length === 0) return;

        const walletAtStart = latestWalletRef.current;
        try {
            setFetchingTimestamps(true);
            const withTimestamps = await transactionService.fetchTimestampsForEvents(transactions);
            // Guard: if wallet changed during the async fetch, discard stale results
            if (latestWalletRef.current !== walletAtStart) return;
            setTransactions(prev => {
                const timestampMap = new Map<string, Date>();
                withTimestamps.forEach(tx => {
                    if (tx.timestamp) timestampMap.set(tx.transactionHash, tx.timestamp);
                });
                
                const updatedTransactions = prev.map(tx => {
                    const ts = timestampMap.get(tx.transactionHash);
                    if (!tx.timestamp && ts) {
                        return { ...tx, timestamp: ts };
                    }
                    return tx;
                });
                
                // Update cache with timestamps using the wallet that was active at fetch start
                persistToCache(updatedTransactions, walletAtStart, isAllTransactionsFetched, networkCursors);
                return updatedTransactions;
            });
            setTimestampsFetched(true);
        } catch (err) {
            console.error('Error fetching timestamps:', err);
        } finally {
            setFetchingTimestamps(false);
        }
    }, [timestampsFetched, fetchingTimestamps, transactions, persistToCache, isAllTransactionsFetched, networkCursors]);

    // When sort changes to timestamp, auto-fetch timestamps if not already done
    const changeSortBy = useCallback((newSortBy: SortBy) => {
        setSortBy(newSortBy);
        setCurrentPage(1);
    }, []);

    // Auto-fetch timestamps when sortBy is 'timestamp' or timestamp filters are applied and they haven't been fetched
    const needsTimestamps = sortBy === 'timestamp' || !!filters.timestampStart || !!filters.timestampEnd;
    
    useEffect(() => {
        if (needsTimestamps && !timestampsFetched && !fetchingTimestamps && transactions.length > 0) {
            fetchTimestamps();
        }
    }, [needsTimestamps, timestampsFetched, fetchingTimestamps, transactions.length, fetchTimestamps]);

    const changeSortDirection = useCallback((newDir: SortDirection) => {
        setSortDirection(newDir);
        setCurrentPage(1);
    }, []);

    const fetchTransactions = async () => {
        const requestWallet = latestWalletRef.current;
        try {
            setLoading(true);
            setError(null);
            setIsAllTransactionsFetched(false);
            setNetworkCursors({});
            if (!isDevelopment && !requestWallet) throw new Error('Connect a wallet to fetch transactions');

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            let currentEvents: TransactionEvent[] = [];
            let hitLimit = false;

            const cursors = await transactionService.fetchStableCoinPurchasesProgressive(
                requestWallet || undefined,
                (chunk) => {
                    if (latestWalletRef.current !== requestWallet) return;
                    currentEvents = [...currentEvents, ...chunk];
                    if (currentEvents.length >= MAX_EVENTS) {
                        currentEvents = currentEvents.slice(0, MAX_EVENTS);
                        hitLimit = true;
                        abortController.abort();
                    }
                    setTransactions(currentEvents);
                    setHasFetched(true);
                    setCurrentPage(1);
                },
                { signal: abortController.signal }
            );

            if (latestWalletRef.current !== requestWallet) return;

            const newCursors: Record<string, string> = {};
            for (const [key, res] of Object.entries(cursors)) {
                newCursors[key] = res.cursor;
            }
            setNetworkCursors(newCursors);
            const allScanned = Object.values(cursors).every(c => c.cursor === '0');
            setIsAllTransactionsFetched(allScanned);

            setTimestampsFetched(false);
            persistToCache(currentEvents, requestWallet, allScanned, newCursors);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const fetchMore = async () => {
        if (isAllTransactionsFetched || loadingMore || Object.keys(networkCursors).length === 0) return;
        const requestWallet = latestWalletRef.current;
        try {
            setLoadingMore(true);
            setError(null);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            let newEvents: TransactionEvent[] = [];
            let hitLimit = false;
            const currentTotal = transactions.length;

            const cursors = await transactionService.fetchStableCoinPurchasesProgressive(
                requestWallet || undefined,
                (chunk) => {
                    if (latestWalletRef.current !== requestWallet) return;
                    newEvents = [...newEvents, ...chunk];
                    if (newEvents.length >= MAX_EVENTS) {
                        newEvents = newEvents.slice(0, MAX_EVENTS);
                        hitLimit = true;
                        abortController.abort();
                    }
                    setTransactions(prev => [...prev.slice(0, currentTotal), ...newEvents]);
                },
                { signal: abortController.signal, cursors: networkCursors }
            );

            if (latestWalletRef.current !== requestWallet) return;

            const newCursors: Record<string, string> = {};
            for (const [key, res] of Object.entries(cursors)) {
                newCursors[key] = res.cursor;
            }
            setNetworkCursors(newCursors);
            const allScanned = Object.values(cursors).every(c => c.cursor === '0');
            setIsAllTransactionsFetched(allScanned);

            setTimestampsFetched(false);

            setTransactions(prev => {
                persistToCache(prev, requestWallet, allScanned, newCursors);
                return prev;
            });

        } catch (err) {
            console.error('Error fetching more transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch more transactions');
        } finally {
            setLoadingMore(false);
        }
    };

    const clearCache = () => {
        const cacheKey = `${CACHE_KEY}_${activeAddress || 'dev'}`;
        localStorage.removeItem(cacheKey);
        setTransactions([]);
        setHasFetched(false);
        setIsAllTransactionsFetched(false);
        setNetworkCursors({});
        setCurrentPage(1);
        setTimestampsFetched(false);
    };

    return {
        transactions,
        paginatedTransactions,
        loading,
        error,
        hasFetched,
        isAllTransactionsFetched,
        loadingMore,
        fetchTransactions,
        fetchMore,
        clearCache,
        // Pagination
        currentPage,
        pageSize,
        totalPages,
        totalCount: filteredTransactions.length,
        goToPage,
        changePageSize,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        // Filtering
        filters,
        applyFilters,
        clearFilters,
        // Sorting
        sortBy,
        sortDirection,
        changeSortBy,
        changeSortDirection,
        fetchingTimestamps,
        timestampsFetched,
        sortByOptions: SORT_BY_OPTIONS,
        sortByLabels: SORT_BY_LABELS,
        sortDirectionOptions: SORT_DIRECTION_OPTIONS,
    };
}
