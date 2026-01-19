import { useState, useEffect, useMemo } from 'react';
import { TransactionEvent } from '@/lib/transaction-service';

// Cache key for stats in localStorage
const STATS_CACHE_KEY = 'stablepay_stats';

export interface PlatformStats {
    transactionsProcessed: number;
    revenueGenerated: number;
    successRate: number;
    failedTransactions: number;
    pendingTransactions: number;
}

interface CachedStats {
    stats: PlatformStats;
    timestamp: number;
}

// Calculate stats from transactions
function calculateStats(transactions: TransactionEvent[]): PlatformStats {
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(tx.amountBC), 0);
    
    // All blockchain transactions are successful by nature
    const successRate = totalTransactions > 0 ? 100 : 0;
    const failedTransactions = 0;
    const pendingTransactions = 0;

    return {
        transactionsProcessed: totalTransactions,
        revenueGenerated: totalRevenue,
        successRate,
        failedTransactions,
        pendingTransactions,
    };
}

// Default stats to show before any data is fetched
const DEFAULT_STATS: PlatformStats = {
    transactionsProcessed: 0,
    revenueGenerated: 0,
    successRate: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
};

// Load cached stats synchronously (only on client)
function getInitialStats(): PlatformStats {
    if (typeof window === 'undefined') {
        return DEFAULT_STATS;
    }
    
    try {
        const cached = localStorage.getItem(STATS_CACHE_KEY);
        if (cached) {
            const { stats: cachedStats }: CachedStats = JSON.parse(cached);
            return cachedStats;
        }
    } catch (err) {
        console.warn('Failed to parse cached stats:', err);
    }
    
    return DEFAULT_STATS;
}

// Check if we have cached data synchronously
function hasInitialCache(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    
    try {
        const cached = localStorage.getItem(STATS_CACHE_KEY);
        return !!cached;
    } catch {
        return false;
    }
}

export function useStats(transactions: TransactionEvent[], isFetching: boolean) {
    // Always start with DEFAULT_STATS for SSR consistency
    const [stats, setStats] = useState<PlatformStats>(DEFAULT_STATS);
    const [hasCachedData, setHasCachedData] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load cached data on mount (client-side only)
    useEffect(() => {
        setIsHydrated(true);
        
        const cached = localStorage.getItem(STATS_CACHE_KEY);
        if (cached) {
            try {
                const { stats: cachedStats }: CachedStats = JSON.parse(cached);
                setStats(cachedStats);
                setHasCachedData(true);
            } catch (err) {
                console.warn('Failed to parse cached stats:', err);
            }
        }
    }, []);

    // Update stats when transactions change
    useEffect(() => {
        if (transactions.length > 0) {
            const newStats = calculateStats(transactions);
            setStats(newStats);
            setHasCachedData(true);

            // Cache the stats
            const cacheData: CachedStats = {
                stats: newStats,
                timestamp: Date.now(),
            };
            localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(cacheData));
        }
    }, [transactions]);

    return {
        stats,
        hasCachedData,
        isRefreshing: isFetching && hasCachedData,
        isHydrated,
    };
}