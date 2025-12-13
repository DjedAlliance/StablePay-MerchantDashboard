/**
 * Stats Cache - localStorage caching for Overview statistics
 */

export interface PlatformStats {
  transactionsProcessed: number;
  revenueGenerated: number;
  successRate: number;
  failedTransactions: number;
  pendingTransactions: number;
  lastUpdated: number;
}

const STATS_CACHE_KEY = 'stablepay_overview_stats';

export const DEFAULT_STATS: PlatformStats = {
  transactionsProcessed: 0,
  revenueGenerated: 0,
  successRate: 100,
  failedTransactions: 0,
  pendingTransactions: 0,
  lastUpdated: 0,
};

export function getCachedStats(): PlatformStats | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(STATS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function setCachedStats(stats: PlatformStats): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

export function formatRevenue(amount: number): string {
  if (amount === 0) return '0';
  if (amount < 0.0001) return '<0.0001';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function formatLastUpdated(timestamp: number): string {
  if (timestamp === 0) return 'Never';
  
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
