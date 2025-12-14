"use client"

import { useEffect, useState } from "react"
import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import DashboardChart from "@/components/dashboard/chart"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import { useTransactions } from "@/hooks/use-transactions"
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"

const mockData = mockDataJson as MockData

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

// Stats cache key and expiry
const STATS_CACHE_KEY = 'stablepay_stats_cache';
const STATS_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedStats {
  totalTransactions: number;
  totalRevenue: number;
  successRate: number;
  failedTransactions: number;
  pendingTransactions: number;
  timestamp: number;
}

export default function DashboardOverview() {
  const { transactions, hasFetched, loading } = useTransactions();
  const [cachedStats, setCachedStats] = useState<CachedStats | null>(null);
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);

  // Load cached stats on mount
  useEffect(() => {
    const cached = localStorage.getItem(STATS_CACHE_KEY);
    if (cached) {
      try {
        const parsedStats: CachedStats = JSON.parse(cached);
        const isExpired = Date.now() - parsedStats.timestamp > STATS_CACHE_EXPIRY;
        if (!isExpired) {
          setCachedStats(parsedStats);
        }
      } catch (err) {
        console.warn('Failed to parse cached stats:', err);
      }
    }
  }, []);

  // Calculate real stats from transactions
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(tx.amountBC), 0);
  const successRate = totalTransactions > 0 ? 100 : 0; // All transactions are successful in blockchain
  const failedTransactions = 0; // No failed transactions in blockchain data
  const pendingTransactions = 0; // No pending transactions in blockchain data

  // Cache stats whenever transactions change
  useEffect(() => {
    if (hasFetched && transactions.length > 0) {
      const stats: CachedStats = {
        totalTransactions,
        totalRevenue,
        successRate,
        failedTransactions,
        pendingTransactions,
        timestamp: Date.now()
      };
      localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(stats));
      setCachedStats(stats);
      setIsLoadingFresh(false);
    }
  }, [transactions, hasFetched, totalTransactions, totalRevenue, successRate, failedTransactions, pendingTransactions]);

  // Track when fresh data is being fetched
  useEffect(() => {
    if (loading) {
      if (cachedStats) {
        setIsLoadingFresh(true);
      }
    } else {
      setIsLoadingFresh(false);
    }
  }, [loading, cachedStats]);

  // Determine which stats to display (cached or fresh)
  const displayStats = hasFetched ? {
    totalTransactions,
    totalRevenue,
    successRate,
    failedTransactions,
    pendingTransactions
  } : cachedStats || {
    totalTransactions: 0,
    totalRevenue: 0,
    successRate: 0,
    failedTransactions: 0,
    pendingTransactions: 0
  };

  const hasAnyData = hasFetched || cachedStats !== null;

  // Use real data if available, otherwise show T/A
  const stats = [
    {
      label: "TRANSACTIONS PROCESSED",
      value: hasAnyData ? displayStats.totalTransactions.toString() : "T/A",
      description: hasAnyData ? "THIS WEEK" : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "REVENUE GENERATED",
      value: hasAnyData ? `${displayStats.totalRevenue.toFixed(2)} BC` : "T/A",
      description: hasAnyData ? "TOTAL REVENUE" : "Fetch transactions for data",
      icon: "proccesor" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "SUCCESS RATE",
      value: hasAnyData ? `${displayStats.successRate}%` : "T/A",
      description: hasAnyData ? "PAYMENT SUCCESS" : "Fetch transactions for data",
      icon: "boom" as keyof typeof iconMap,
      intent: "positive" as const,
    },
    {
      label: "FAILED TRANSACTIONS",
      value: hasAnyData ? displayStats.failedTransactions.toString() : "T/A",
      description: hasAnyData ? "NO FAILURES" : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "negative" as const,
    },
    {
      label: "PENDING TRANSACTIONS",
      value: hasAnyData ? displayStats.pendingTransactions.toString() : "T/A",
      description: hasAnyData ? "ALL COMPLETED" : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "neutral" as const,
    }
  ];

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: hasFetched
          ? "Last updated: Real-time blockchain data"
          : cachedStats
            ? `Cached data from ${new Date(cachedStats.timestamp).toLocaleString()}`
            : "Fetch transactions to get analysis",
        icon: BracketsIcon,
      }}
    >
      {!hasFetched && !cachedStats && (
        <div className="mb-6 p-4 bg-muted/50 border border-border/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Fetch transactions from the Transactions tab to get real-time analysis and statistics.
          </p>
        </div>
      )}

      {isLoadingFresh && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/40 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            🔄 <strong>Updating:</strong> Fetching latest data... (showing cached values)
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
        {stats.map((stat, index) => (
          <DashboardStat
            key={index}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            icon={iconMap[stat.icon]}
            intent={stat.intent}
            direction={stat.direction}
          />
        ))}
      </div>

      <div className="mb-6">
        <DashboardChart />
      </div>
    </DashboardPageLayout>
  )
}
