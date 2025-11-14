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
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"

const mockData = mockDataJson as MockData

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

export default function DashboardOverview() {
  const { walletAddress } = useWallet()
  const { transactions, hasFetched } = useTransactions(walletAddress);

  // Calculate real stats from transactions
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(tx.amountBC), 0);
  const successRate = totalTransactions > 0 ? 100 : 0; // All transactions are successful in blockchain
  const failedTransactions = 0; // No failed transactions in blockchain data
  const pendingTransactions = 0; // No pending transactions in blockchain data

  // Use real data if available, otherwise show T/A
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
        description: hasFetched ? "Last updated: Real-time blockchain data" : "Fetch transactions to get analysis",
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
