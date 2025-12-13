"use client"

import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import DashboardChart from "@/components/dashboard/chart"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import LockIcon from "@/components/icons/lock"
import { useTransactions } from "@/hooks/use-transactions"
import { useStats } from "@/hooks/use-stats"
import { formatRevenue, formatLastUpdated } from "@/lib/stats-cache"

const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
  lock: LockIcon,
}

export default function DashboardOverview() {
  const { transactions, loading, hasFetched } = useTransactions();
  const { stats, hasCachedData, isHydrated, isRefreshing } = useStats(transactions, loading);

  // Show "..." during hydration, "T/A" if no data, otherwise show value
  const getValue = (value: string | number) => {
    if (!isHydrated) return "...";
    if (!hasCachedData) return "T/A";
    return value.toString();
  };

  const statsDisplay = [
    {
      label: "TRANSACTIONS PROCESSED",
      value: getValue(stats.transactionsProcessed.toLocaleString()),
      description: hasCachedData ? "TOTAL COUNT" : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "REVENUE GENERATED",
      value: getValue(`${formatRevenue(stats.revenueGenerated)} ETH`),
      description: hasCachedData ? "TOTAL EARNINGS" : "Fetch transactions for data",
      icon: "proccesor" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "SUCCESS RATE",
      value: getValue(`${stats.successRate}%`),
      description: hasCachedData ? "PAYMENT SUCCESS" : "Fetch transactions for data",
      icon: "boom" as keyof typeof iconMap,
      intent: "positive" as const,
    },
    {
      label: "FAILED TRANSACTIONS",
      value: getValue(stats.failedTransactions),
      description: hasCachedData 
        ? (stats.failedTransactions > 0 ? "NEEDS ATTENTION" : "NO FAILURES")
        : "Fetch transactions for data",
      icon: "lock" as keyof typeof iconMap,
      intent: stats.failedTransactions > 0 ? "negative" as const : "positive" as const,
    },
    {
      label: "PENDING TRANSACTIONS",
      value: getValue(stats.pendingTransactions),
      description: hasCachedData
        ? (stats.pendingTransactions > 0 ? "AWAITING CONFIRMATION" : "ALL CONFIRMED")
        : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "neutral" as const,
    },
  ];

  const headerDescription = !isHydrated
    ? "Loading..."
    : hasCachedData
      ? (isRefreshing ? "Refreshing data..." : `Updated ${formatLastUpdated(stats.lastUpdated)}`)
      : "Fetch transactions to get analysis";

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: headerDescription,
        icon: BracketsIcon,
      }}
    >
      {/* Info banner when no cached data */}
      {isHydrated && !hasCachedData && (
        <div className="mb-6 p-4 bg-muted/50 border border-border/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Fetch transactions from the Transactions tab to see real-time statistics.
          </p>
        </div>
      )}

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-primary font-medium">
            Refreshing data... Showing cached values.
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
        <DashboardChart 
          transactions={transactions} 
          hasCachedData={hasCachedData}
          isLoading={isRefreshing}
        />
      </div>
    </DashboardPageLayout>
  )
}
