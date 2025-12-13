"use client"

import { useState, useEffect } from "react"
import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import DashboardChart from "@/components/dashboard/chart"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import { useTransactions } from "@/hooks/use-transactions"
import { 
  getCachedStats, 
  setCachedStats, 
  getFormattedUpdateTime,
  DEFAULT_STATS,
  type OverviewStats 
} from "@/lib/stats-cache"
import { calculateStatsFromTransactions, formatRevenue, formatSuccessRate } from "@/lib/calculate-stats"
import { Loader2 } from "lucide-react"

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

export default function DashboardOverview() {
  const { transactions, hasFetched, loading } = useTransactions();
  const [stats, setStats] = useState<OverviewStats>(DEFAULT_STATS);
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);

  // Load cached stats on mount
  useEffect(() => {
    const cached = getCachedStats();
    setStats(cached);
  }, []);

  // Update stats when transactions change
  useEffect(() => {
    if (hasFetched && transactions.length > 0) {
      setIsLoadingFresh(true);
      
      // Calculate fresh stats from transactions
      const calculatedStats = calculateStatsFromTransactions(transactions);
      const newStats: OverviewStats = {
        ...calculatedStats,
        lastUpdated: Date.now(),
      };
      
      // Update state and cache
      setStats(newStats);
      setCachedStats(newStats);
      
      // Remove loading indicator after a brief delay for smooth UX
      setTimeout(() => {
        setIsLoadingFresh(false);
      }, 500);
    }
  }, [transactions, hasFetched]);

  // Determine if we should show T/A or actual values
  const showTA = stats.lastUpdated === 0 && !hasFetched;

  // Format stats for display
  const displayStats = [
    {
      label: "TRANSACTIONS PROCESSED",
      value: showTA ? "T/A" : stats.transactionsProcessed.toString(),
      description: showTA ? "Fetch transactions for data" : "TOTAL PROCESSED",
      icon: "gear" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "REVENUE GENERATED", 
      value: showTA ? "T/A" : formatRevenue(stats.revenueGenerated),
      description: showTA ? "Fetch transactions for data" : "TOTAL IN BC",
      icon: "proccesor" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "SUCCESS RATE",
      value: showTA ? "T/A" : formatSuccessRate(stats.successRate), 
      description: showTA ? "Fetch transactions for data" : "PAYMENT SUCCESS",
      icon: "boom" as keyof typeof iconMap,
      intent: "positive" as const,
    },
    {
      label: "FAILED TRANSACTIONS",
      value: showTA ? "T/A" : stats.failedTransactions.toString(),
      description: showTA ? "Fetch transactions for data" : "TOTAL FAILED",
      icon: "gear" as keyof typeof iconMap,
      intent: stats.failedTransactions > 0 ? "negative" as const : "neutral" as const,
    },
    {
      label: "PENDING TRANSACTIONS", 
      value: showTA ? "T/A" : stats.pendingTransactions.toString(),
      description: showTA ? "Fetch transactions for data" : "AWAITING CONFIRMATION",
      icon: "gear" as keyof typeof iconMap,
      intent: "neutral" as const,
    }
  ];

  const lastUpdatedText = stats.lastUpdated > 0 
    ? `Last updated: ${getFormattedUpdateTime(stats.lastUpdated)}` 
    : "Fetch transactions to get analysis";

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: lastUpdatedText,
        icon: BracketsIcon,
      }}
    >
      {/* Info banner when no data is fetched yet */}
      {!hasFetched && stats.lastUpdated === 0 && (
        <div className="mb-6 p-4 bg-muted/50 border border-border/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Fetch transactions from the Transactions tab to get real-time analysis and statistics.
          </p>
        </div>
      )}

      {/* Loading indicator when fetching fresh data */}
      {isLoadingFresh && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating stats with fresh data...</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
        {displayStats.map((stat, index) => (
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

      {/* Chart section */}
      <div className="mb-6">
        <DashboardChart 
          transactions={transactions}
          isLoading={isLoadingFresh}
        />
      </div>
    </DashboardPageLayout>
  )
}
