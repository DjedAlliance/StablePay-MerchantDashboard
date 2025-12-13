import { useState, useEffect, useMemo } from 'react';
import { TransactionEvent } from '@/lib/transaction-service';
import {
  PlatformStats,
  DEFAULT_STATS,
  getCachedStats,
  setCachedStats,
} from '@/lib/stats-cache';

function calculateStats(transactions: TransactionEvent[]): Omit<PlatformStats, 'lastUpdated'> {
  const total = transactions.length;
  
  const revenue = transactions.reduce((sum, tx) => {
    const amount = parseFloat(tx.amountBC);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return {
    transactionsProcessed: total,
    revenueGenerated: Math.round(revenue * 10000) / 10000,
    successRate: 100, // All blockchain transactions are successful
    failedTransactions: 0,
    pendingTransactions: 0,
  };
}

export function useStats(transactions: TransactionEvent[], isLoading: boolean) {
  const [stats, setStats] = useState<PlatformStats>(DEFAULT_STATS);
  const [hasCachedData, setHasCachedData] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cached stats on mount (client-side only)
  useEffect(() => {
    const cached = getCachedStats();
    if (cached) {
      setStats(cached);
      setHasCachedData(true);
    }
    setIsHydrated(true);
  }, []);

  // Update stats when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      const calculated = calculateStats(transactions);
      const newStats: PlatformStats = {
        ...calculated,
        lastUpdated: Date.now(),
      };
      
      setStats(newStats);
      setHasCachedData(true);
      setCachedStats(newStats);
    }
  }, [transactions]);

  return {
    stats,
    hasCachedData,
    isHydrated,
    isRefreshing: isLoading && hasCachedData,
  };
}
