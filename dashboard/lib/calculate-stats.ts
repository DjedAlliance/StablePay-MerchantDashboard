/**
 * Calculate Stats Utility
 * Computes overview statistics from transaction data
 */

import { TransactionEvent } from './transaction-service';
import { OverviewStats } from './stats-cache';

/**
 * Calculates overview statistics from transaction events
 * @param transactions - Array of transaction events
 * @returns Calculated stats object
 */
export function calculateStatsFromTransactions(
  transactions: TransactionEvent[]
): Omit<OverviewStats, 'lastUpdated'> {
  const totalTransactions = transactions.length;
  
  // Calculate total revenue in BC (blockchain currency)
  const totalRevenue = transactions.reduce((sum, tx) => {
    return sum + parseFloat(tx.amountBC);
  }, 0);

  // For blockchain transactions, all fetched transactions are successful
  // In a real-world scenario, you might filter by status
  const successfulTransactions = totalTransactions;
  const successRate = totalTransactions > 0 
    ? (successfulTransactions / totalTransactions) * 100 
    : 0;

  // Blockchain transactions don't have failed or pending states
  // These would come from off-chain data or different contract events
  const failedTransactions = 0;
  const pendingTransactions = 0;

  return {
    transactionsProcessed: totalTransactions,
    revenueGenerated: Math.round(totalRevenue * 100) / 100, // Round to 2 decimals
    successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
    failedTransactions,
    pendingTransactions,
  };
}

/**
 * Formats revenue for display
 * @param revenue - Revenue amount
 * @returns Formatted string
 */
export function formatRevenue(revenue: number): string {
  if (revenue === 0) return 'T/A';
  
  // Format with commas and 2 decimal places
  return revenue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats success rate for display
 * @param rate - Success rate percentage
 * @returns Formatted string with % symbol
 */
export function formatSuccessRate(rate: number): string {
  if (rate === 0) return 'T/A';
  return `${rate.toFixed(1)}%`;
}
