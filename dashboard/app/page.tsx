"use client"

import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import DashboardChart from "@/components/dashboard/chart"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import { useTransactions } from "@/hooks/use-transactions"
import { useWallet } from "@/hooks/use-wallet"

const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

export default function DashboardOverview() {
  const { transactions, hasFetched } = useTransactions();
  const { isConnected } = useWallet();

  const totalTransactions = transactions.length;
  const successRate = totalTransactions > 0 ? 100 : 0;

  const stats = [
    {
      label: "TRANSACTIONS PROCESSED",
      value: hasFetched ? totalTransactions.toString() : "T/A",
      description: hasFetched ? "THIS WEEK" : "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "REVENUE GENERATED", 
      value: "T/A",
      description: "Fetch transactions for data",
      icon: "proccesor" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "SUCCESS RATE",
      value: hasFetched ? `${successRate}%` : "T/A", 
      description: hasFetched ? "PAYMENT SUCCESS" : "Fetch transactions for data",
      icon: "boom" as keyof typeof iconMap,
      intent: "positive" as const,
    },
    {
      label: "FAILED TRANSACTIONS",
      value: "0",
      description: "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "negative" as const,
    },
    {
      label: "PENDING TRANSACTIONS", 
      value: "0",
      description: "Fetch transactions for data",
      icon: "gear" as keyof typeof iconMap,
      intent: "neutral" as const,
    }
  ];

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: hasFetched ? "Real-time blockchain data" : "Connect wallet & fetch transactions",
        icon: BracketsIcon,
      }}
    >
      {!isConnected && (
        <div className="mb-6 p-4 bg-muted/50 border border-border/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Connect your wallet</strong> and fetch transactions from the Transactions tab to see real-time statistics.
          </p>
        </div>
      )}

      {hasFetched && totalTransactions === 0 && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-lg">
          <p className="text-sm font-medium mb-2">⚠️ No transactions found for your wallet</p>
          <p className="text-sm text-muted-foreground">
            Visit <a href="https://mordor.djed.one" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mordor.djed.one</a> to buy stablecoins, then return and click "Fetch Fresh Data".
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
