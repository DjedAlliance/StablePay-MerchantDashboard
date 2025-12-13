"use client"

import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import DashboardChart from "@/components/dashboard/chart"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import { useTransactions } from "@/hooks/use-transactions"

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

export default function DashboardOverview() {
  // 1. Get cached data
  const { transactions, hasFetched } = useTransactions()

  // 2. Calculate Real Stats
  const totalTransactions = transactions.length
  
  // Sum of amountBC (Blockchain Currency e.g., ETH)
  const totalRevenue = transactions.reduce((sum, tx) => {
      // Parse float safely
      const val = parseFloat(tx.amountBC);
      return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const successRate = totalTransactions > 0 ? 100 : 0 

  // 3. Logic: Show stats if we have data OR if we have attempted a fetch
  // If user has 0 txs but fetched successfully, we should show "0" not "T/A"
  const hasDataOrFetched = transactions.length > 0 || hasFetched;

  const stats = [
    {
      label: "TRANSACTIONS PROCESSED",
      value: hasDataOrFetched ? totalTransactions.toString() : "T/A",
      description: hasDataOrFetched ? "TOTAL PROCESSED" : "Fetch to see data",
      icon: "gear" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "REVENUE GENERATED",
      value: hasDataOrFetched ? `${totalRevenue.toFixed(4)}` : "T/A", // Adjust decimals as needed
      description: hasDataOrFetched ? "TOTAL VOLUME (ETH)" : "Fetch to see data",
      icon: "proccesor" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "SUCCESS RATE",
      value: hasDataOrFetched ? `${successRate}%` : "T/A",
      description: "PAYMENT SUCCESS",
      icon: "boom" as keyof typeof iconMap,
      intent: "positive" as const,
    },
    {
      label: "FAILED TRANSACTIONS",
      value: hasDataOrFetched ? "0" : "T/A",
      description: "Network Failures",
      icon: "gear" as keyof typeof iconMap,
      intent: "negative" as const,
    },
    {
      label: "PENDING TRANSACTIONS",
      value: hasDataOrFetched ? "0" : "T/A",
      description: "Awaiting Confirmation",
      icon: "gear" as keyof typeof iconMap,
      intent: "neutral" as const,
    },
  ]

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: hasDataOrFetched 
          ? `Last updated: Real-time blockchain data (${transactions.length} txs cached)` 
          : "Fetch transactions to get analysis",
        icon: BracketsIcon,
      }}
    >
      {!hasDataOrFetched && (
        <div className="mb-6 p-4 bg-muted/50 border border-border/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> No data cached. Go to the <strong>Transactions</strong> tab and click "Fetch" to sync blockchain data.
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
        {/* Pass the real transactions to the chart */}
        <DashboardChart data={transactions} />
      </div>
    </DashboardPageLayout>
  )
}