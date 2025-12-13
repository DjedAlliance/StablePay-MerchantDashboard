"use client"

import { useEffect, useState } from "react"
import DashboardPageLayout from "@/components/dashboard/layout"
import DashboardStat from "@/components/dashboard/stat"
import DashboardChart from "@/components/dashboard/chart"
import BracketsIcon from "@/components/icons/brackets"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"
import LockIcon from "@/components/icons/lock"
import { useTransactions } from "@/hooks/use-transactions"
import { RefreshCw } from "lucide-react"

// Icon mapping
const iconMap = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
  lock: LockIcon,
}

interface DashboardStats {
  totalTransactions: number
  totalRevenue: number
  successRate: number
  failedTransactions: number
  pendingTransactions: number
  timestamp: number
}

const STATS_CACHE_KEY = 'stablepay_overview_stats'

// Calculate stats from transactions
function calculateStats(transactions: any[]): DashboardStats {
  const totalTransactions = transactions.length
  const totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(tx.amountBC || '0'), 0)
  
  // All blockchain transactions are successful by nature
  const successRate = totalTransactions > 0 ? 100 : 0
  const failedTransactions = 0
  const pendingTransactions = 0

  return {
    totalTransactions,
    totalRevenue,
    successRate,
    failedTransactions,
    pendingTransactions,
    timestamp: Date.now(),
  }
}

export default function DashboardOverview() {
  const { transactions, loading, hasFetched, error } = useTransactions()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Load cached stats on mount
  useEffect(() => {
    const cached = localStorage.getItem(STATS_CACHE_KEY)
    if (cached) {
      try {
        const cachedStats: DashboardStats = JSON.parse(cached)
        setStats(cachedStats)
      } catch (err) {
        console.warn('Failed to parse cached stats:', err)
      }
    }
  }, [])

  // Update stats when transactions change
  useEffect(() => {
    if (hasFetched && transactions.length > 0) {
      setIsUpdating(true)
      const newStats = calculateStats(transactions)
      setStats(newStats)
      localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(newStats))
      // Small delay to show loading indicator
      setTimeout(() => setIsUpdating(false), 300)
    }
  }, [transactions, hasFetched])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Determine what to display
  const displayStats = [
    {
      label: "TRANSACTIONS PROCESSED",
      value: stats ? stats.totalTransactions.toLocaleString() : "T/A",
      description: stats ? "TOTAL RECORDED" : "Awaiting data fetch",
      icon: "gear" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "REVENUE GENERATED",
      value: stats ? formatCurrency(stats.totalRevenue) : "T/A",
      description: stats ? "TOTAL EARNINGS" : "Awaiting data fetch",
      icon: "proccesor" as keyof typeof iconMap,
      intent: "positive" as const,
      direction: "up" as const,
    },
    {
      label: "SUCCESS RATE",
      value: stats ? `${stats.successRate.toFixed(1)}%` : "T/A",
      description: stats ? "PAYMENT SUCCESS" : "Awaiting data fetch",
      icon: "boom" as keyof typeof iconMap,
      intent: "positive" as const,
    },
    {
      label: "FAILED TRANSACTIONS",
      value: stats ? stats.failedTransactions.toString() : "T/A",
      description: stats ? "BLOCKED PAYMENTS" : "Awaiting data fetch",
      icon: "lock" as keyof typeof iconMap,
      intent: stats && stats.failedTransactions > 0 ? "negative" as const : "neutral" as const,
    },
    {
      label: "PENDING TRANSACTIONS",
      value: stats ? stats.pendingTransactions.toString() : "T/A",
      description: stats ? "IN PROCESSING" : "Awaiting data fetch",
      icon: "gear" as keyof typeof iconMap,
      intent: "neutral" as const,
    },
  ]

  // Show update indicator when fetching fresh data
  const showLoadingIndicator = loading || isUpdating

  return (
    <DashboardPageLayout
      header={{
        title: "Overview",
        description: stats 
          ? `Last updated: ${new Date(stats.timestamp).toLocaleString()}`
          : "Fetch transactions to view analytics",
        icon: BracketsIcon,
      }}
    >
      {error && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive font-medium">
            Refresh failed: {error}. Showing cached analytics.
          </p>
        </div>
      )}
      {!stats && !hasFetched && (
        <div className="mb-6 p-4 bg-muted/50 border border-border/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Note:</strong> Navigate to the Transactions tab and click "See Transactions" to fetch real-time blockchain data and view analytics.
          </p>
        </div>
      )}

      {showLoadingIndicator && stats && (
        <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
          <RefreshCw className="size-4 animate-spin text-primary" />
          <p className="text-sm text-primary font-medium">
            Updating stats with latest transaction data...
          </p>
        </div>
      )}

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

      <div className="mb-6">
        <DashboardChart transactions={transactions} hasFetched={hasFetched} />
      </div>
    </DashboardPageLayout>
  )
}
