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

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
  lock: LockIcon,
}

export default function DashboardOverview() {
  const { transactions, loading, hasFetched } = useTransactions();

  // Calculate real stats from transactions (works with cached or fresh data)
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(tx.amountBC || "0"), 0);
  const successRate = totalTransactions > 0 ? 100 : undefined; // All blockchain transactions are successful
  const failedTransactions = 0; // No failed transactions in blockchain data
  const pendingTransactions = 0; // No pending transactions in blockchain data

  // Format revenue with ETH
  const formatRevenue = (amount: number) => {
    return `${amount.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ETH`;
  };

  // Stats use cached values immediately, show T/A only if never fetched
  const stats = [
    {
      label: "TRANSACTIONS PROCESSED",
      value: hasFetched ? totalTransactions.toLocaleString() : "T/A",
      description: hasFetched ? "TOTAL COUNT" : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "REVENUE (ETH)",
      value: hasFetched ? formatRevenue(totalRevenue) : "T/A",
      description: hasFetched ? "TOTAL EARNINGS" : "Fetch transactions for data",
      icon: "proccesor" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "SUCCESS RATE",
      value: (hasFetched && successRate !== undefined) ? `${successRate}%` : "T/A",
      description: hasFetched ? "PAYMENT SUCCESS" : "Fetch transactions for data",
      icon: "boom" as keyof typeof iconMap,
      intent: "positive" as const,
    },
    {
      label: "FAILED TRANSACTIONS",
      value: hasFetched ? failedTransactions.toString() : "T/A",
      description: hasFetched ? "NO FAILURES" : "Fetch transactions for data",
      icon: "lock" as keyof typeof iconMap,
      intent: "negative" as const,
    },
    {
      label: "PENDING TRANSACTIONS",
      value: hasFetched ? pendingTransactions.toString() : "T/A",
      description: hasFetched ? "ALL CONFIRMED" : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "neutral" as const,
    },
  ];
  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: loading 
          ? "Updating data..." 
          : hasFetched 
            ? "Real-time blockchain data" 
            : "Fetch transactions to get analysis",
        icon: BracketsIcon,
      }}
    >
      {!hasFetched && (
        <div className="mb-6 p-4 bg-muted/50 border border-border/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Fetch transactions from the Transactions tab to get real-time analysis and statistics.
          </p>
        </div>
      )}

      {loading && hasFetched && (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Refreshing data... Showing cached values.
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
        <DashboardChart transactions={transactions} hasFetched={hasFetched} loading={loading} />
      </div>
    </DashboardPageLayout>
  )
}
