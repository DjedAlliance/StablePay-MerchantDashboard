"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { parseUnits } from 'viem';
import { transactionService } from '@/lib/transaction-service';
import type { TransactionEvent } from '@/lib/transaction-service';
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

interface CachedData {
    transactions: (Omit<TransactionEvent, 'blockNumber' | 'timestamp'> & {
        blockNumber: string;
        timestamp?: string; // ISO string
    })[];
    timestamp: number; // cache creation time
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(25);

    // Sorting state
    const [sortBy, setSortBy] = useState<SortBy>('blockNumber');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [fetchingTimestamps, setFetchingTimestamps] = useState(false);
    const [timestampsFetched, setTimestampsFetched] = useState(false);

    // Helper to persist current transactions to cache (including timestamps)
    const persistToCache = useCallback((events: TransactionEvent[], wallet: string) => {
        const serializableEvents: CachedData['transactions'] = events.map(event => ({
            ...event,
            blockNumber: event.blockNumber.toString(),
            timestamp: event.timestamp ? event.timestamp.toISOString() : undefined,
        }));
        const cacheData: CachedData = {
            transactions: serializableEvents,
            timestamp: Date.now(),
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
                const { transactions: cachedTransactions, timestamp }: CachedData = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

                if (!isExpired && cachedTransactions.length > 0) {
                    const restoredTransactions = cachedTransactions.map(event => ({
                        ...event,
                        blockNumber: BigInt(event.blockNumber),
                        timestamp: event.timestamp ? new Date(event.timestamp) : undefined,
                    }));
                    setTransactions(restoredTransactions);
                    setHasFetched(true);
                    // If cached data already has timestamps, mark as fetched
                    const hasTimestamps = restoredTransactions.some(tx => tx.timestamp);
                    if (hasTimestamps) setTimestampsFetched(true);
                }
            } catch (err) {
                console.warn('Failed to parse cached transactions:', err);
            }
        }
    }, [activeAddress, isDevelopment]);

    // Sorted transactions (operates on ALL transactions before pagination)
    const sortedTransactions = useMemo(() => {
        const sorted = [...transactions];
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
    }, [transactions, sortBy, sortDirection]);

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
            setTransactions(withTimestamps);
            setTimestampsFetched(true);
            // Update cache with timestamps using the wallet that was active at fetch start
            persistToCache(withTimestamps, walletAtStart);
        } catch (err) {
            console.error('Error fetching timestamps:', err);
        } finally {
            setFetchingTimestamps(false);
        }
    }, [timestampsFetched, fetchingTimestamps, transactions, persistToCache]);

    // When sort changes to timestamp, auto-fetch timestamps if not already done
    const changeSortBy = useCallback((newSortBy: SortBy) => {
        setSortBy(newSortBy);
        setCurrentPage(1);
        if (newSortBy === 'timestamp' && !timestampsFetched && transactions.length > 0) {
            // Will trigger timestamp fetch
        }
    }, [timestampsFetched, transactions.length]);

    // Auto-fetch timestamps when sortBy is 'timestamp' and they haven't been fetched
    useEffect(() => {
        if (sortBy === 'timestamp' && !timestampsFetched && !fetchingTimestamps && transactions.length > 0) {
            fetchTimestamps();
        }
    }, [sortBy, timestampsFetched, fetchingTimestamps, transactions.length, fetchTimestamps]);

    const changeSortDirection = useCallback((newDir: SortDirection) => {
        setSortDirection(newDir);
        setCurrentPage(1);
    }, []);

    const fetchTransactions = async () => {
        const requestWallet = latestWalletRef.current;
        try {
            setLoading(true);
            setError(null);
            if (!isDevelopment && !requestWallet) throw new Error('Connect a wallet to fetch transactions');
            const events = await transactionService.fetchStableCoinPurchases(requestWallet || undefined);
            if (latestWalletRef.current !== requestWallet) return;
            setTransactions(events);
            setHasFetched(true);
            setCurrentPage(1);
            setTimestampsFetched(false); // Fresh data, timestamps not fetched yet

            // Cache the data
            persistToCache(events, requestWallet);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const clearCache = () => {
        const cacheKey = `${CACHE_KEY}_${activeAddress || 'dev'}`;
        localStorage.removeItem(cacheKey);
        setTransactions([]);
        setHasFetched(false);
        setCurrentPage(1);
        setTimestampsFetched(false);
    };

    return {
        transactions,
        paginatedTransactions,
        loading,
        error,
        hasFetched,
        fetchTransactions,
        clearCache,
        // Pagination
        currentPage,
        pageSize,
        totalPages,
        totalCount: transactions.length,
        goToPage,
        changePageSize,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
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
