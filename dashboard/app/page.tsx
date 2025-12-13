"use client"

import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import DashboardChart from "@/components/dashboard/chart"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import LockIcon from "@/components/icons/lock"
import { useTransactions } from "@/contexts/TransactionContext"
import { useStats } from "@/hooks/use-stats"
import { RefreshCw } from "lucide-react"

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
  lock: LockIcon,
}

export default function DashboardOverview() {
  const { transactions, loading, hasFetched } = useTransactions();
  const { stats, hasCachedData, isRefreshing, isHydrated } = useStats(transactions, loading);

  // Format stats for display
  const statsDisplay = [
    {
      label: "TRANSACTIONS PROCESSED",
      value: hasCachedData ? stats.transactionsProcessed.toString() : "T/A",
      description: hasCachedData ? "TOTAL TRANSACTIONS" : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "REVENUE GENERATED", 
      value: hasCachedData ? `${stats.revenueGenerated.toFixed(4)} ETH` : "T/A",
      description: hasCachedData ? "TOTAL EARNINGS" : "Fetch transactions for data",
      icon: "proccesor" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "SUCCESS RATE",
      value: hasCachedData ? `${stats.successRate}%` : "T/A", 
      description: hasCachedData ? "PAYMENT SUCCESS" : "Fetch transactions for data",
      icon: "boom" as keyof typeof iconMap,
      intent: "positive" as const,
    },
    {
      label: "FAILED TRANSACTIONS",
      value: hasCachedData ? stats.failedTransactions.toString() : "T/A",
      description: hasCachedData ? "NO FAILURES" : "Fetch transactions for data",
      icon: "lock" as keyof typeof iconMap,
      intent: stats.failedTransactions > 0 ? "negative" as const : "positive" as const,
    },
    {
      label: "PENDING TRANSACTIONS", 
      value: hasCachedData ? stats.pendingTransactions.toString() : "T/A",
      description: hasCachedData ? "NO PENDING" : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "neutral" as const,
    }
  ];

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: !isHydrated 
          ? "Fetch transactions to get analysis"
          : hasCachedData 
            ? (isRefreshing ? "Updating data..." : "Real-time blockchain data")
            : "Fetch transactions to get analysis",
        icon: BracketsIcon,
      }}
    >
      {/* Info banner when no data is cached */}
      {!hasCachedData && (
        <div className="mb-6 p-4 bg-muted/50 border border-border/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Fetch transactions from the Transactions tab to get real-time analysis and statistics.
          </p>
        </div>
      )}

      {/* Loading indicator during refresh */}
      {isRefreshing && (
        <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
          <RefreshCw className="size-4 animate-spin text-primary" />
          <p className="text-sm text-primary font-medium">
            Refreshing data from blockchain...
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
        {statsDisplay.map((stat, index) => (
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
        <DashboardChart transactions={transactions} hasCachedData={hasCachedData} />
      </div>
    </DashboardPageLayout>
  )
}
