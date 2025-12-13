/**
 * Stats Cache Utility
 * Manages localStorage caching for Overview statistics
 */

export interface OverviewStats {
  transactionsProcessed: number;
  revenueGenerated: number;
  successRate: number;
  failedTransactions: number;
  pendingTransactions: number;
  lastUpdated: number;
}

const STATS_CACHE_KEY = 'stablepay_overview_stats';

/**
 * Default stats values to show before any data is fetched
 */
export const DEFAULT_STATS: OverviewStats = {
  transactionsProcessed: 0,
  revenueGenerated: 0,
  successRate: 0,
  failedTransactions: 0,
  pendingTransactions: 0,
  lastUpdated: 0,
};

/**
 * Retrieves cached stats from localStorage
 * @returns Cached stats or default stats if no cache exists
 */
export function getCachedStats(): OverviewStats {
  if (typeof window === 'undefined') {
    return DEFAULT_STATS;
  }

  try {
    const cached = localStorage.getItem(STATS_CACHE_KEY);
    if (cached) {
      const stats: OverviewStats = JSON.parse(cached);
      return stats;
    }
  } catch (error) {
    console.warn('Failed to parse cached stats:', error);
  }

  return DEFAULT_STATS;
}

/**
 * Saves stats to localStorage cache
 * @param stats - The stats to cache
 */
export function setCachedStats(stats: OverviewStats): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const statsWithTimestamp: OverviewStats = {
      ...stats,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(statsWithTimestamp));
  } catch (error) {
    console.error('Failed to cache stats:', error);
  }
}

/**
 * Clears the stats cache
 */
export function clearStatsCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STATS_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear stats cache:', error);
  }
}

/**
 * Checks if cached stats exist
 * @returns true if cache exists, false otherwise
 */
export function hasCachedStats(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const cached = localStorage.getItem(STATS_CACHE_KEY);
    return cached !== null;
  } catch {
    return false;
  }
}

/**
 * Gets formatted time string for last updated timestamp
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export function getFormattedUpdateTime(timestamp: number): string {
  if (timestamp === 0) {
    return 'Never';
  }

  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}
