"use client"

import { useState } from "react"
import { Bell, RefreshCw, Filter, Search, Shield, MapPin, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import DashboardPageLayout from "@/components/dashboard/layout"
import CreditCardIcon from "@/components/icons/credit-card"
import { useTransactions } from "@/hooks/use-transactions"
import { useWallet } from "@/hooks/use-wallet"

const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const getRiskLevel = (amount: string) => {
  const num = parseFloat(amount);
  if (num > 100) return "high";
  if (num > 50) return "medium";
  return "low";
};

export default function TransactionsPage() {
  const { transactions, loading, error, hasFetched, lastSyncedBlock, fetchTransactions, fetchFreshData, clearCache } = useTransactions();
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleRowClick = (transaction: (typeof transactions)[0]) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  return (
    <DashboardPageLayout
      header={{
        title: "Transactions",
        description: "Manage and monitor payment operations",
        icon: CreditCardIcon,
      }}
    >
      <div className="flex flex-col h-full min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 py-4 border-b border-border/40 gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">StablePay</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-primary">TRANSACTIONS</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {lastSyncedBlock && (
              <span className="text-xs text-muted-foreground">
                Last synced: Block #{lastSyncedBlock.toString()}
              </span>
            )}
            <Button variant="ghost" size="icon" className="size-8">
              <Bell className="size-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 overflow-auto">
          {/* Title Section */}
          <div className="flex flex-col lg:flex-row items-start justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-serif mb-2">Transaction Network</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {isConnected ? `Filtering by: ${formatAddress(walletAddress || '')}` : 'Connect wallet to filter transactions'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {!isConnected ? (
                <Button className="bg-primary hover:bg-primary/90" onClick={connectWallet}>
                  Connect Wallet
                </Button>
              ) : !hasFetched ? (
                <Button 
                  className="bg-primary hover:bg-primary/90" 
                  onClick={fetchTransactions} 
                  disabled={loading}
                >
                  <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Loading...' : 'Fetch Transactions'}
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={fetchFreshData} disabled={loading}>
                    <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Fetch Fresh Data'}
                  </Button>
                  <Button variant="outline" onClick={clearCache} className="text-xs">
                    Clear Cache
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Wallet Connection Notice */}
          {!isConnected && (
            <div className="mb-6 p-4 bg-muted/50 border border-border/40 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Connect your wallet</strong> to filter transactions where you are the receiver (merchant).
              </p>
            </div>
          )}

          {/* No Transactions Help */}
          {hasFetched && transactions.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-lg">
              <p className="text-sm font-medium mb-2">⚠️ No transactions found for your wallet</p>
              <p className="text-sm text-muted-foreground mb-2">If you don't have any StablePay transactions:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>Make a transaction on the merchant demo website</li>
                <li>Visit <a href="https://mordor.djed.one" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mordor.djed.one</a> to buy stablecoins</li>
                <li>Click "Fetch Fresh Data" after making a transaction</li>
              </ul>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
            <div className="bg-card border border-border/40 rounded-lg p-4 sm:p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Search transactions" className="pl-10 bg-background/50 border-border/40" />
              </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2">TOTAL TRANSACTIONS</div>
                  <div className="text-2xl sm:text-4xl font-bold">{loading ? "..." : transactions.length}</div>
                </div>
                <Shield className="size-6 sm:size-8 text-foreground" />
              </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2">FAILED</div>
                  <div className="text-2xl sm:text-4xl font-bold text-red-500">0</div>
                </div>
                <Shield className="size-6 sm:size-8 text-red-500" />
              </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2">PENDING</div>
                  <div className="text-2xl sm:text-4xl font-bold text-primary">0</div>
                </div>
                <Shield className="size-6 sm:size-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-card border border-border/40 rounded-lg overflow-hidden flex-1 flex flex-col">
            <div className="p-4 sm:p-6 border-b border-border/40">
              <h2 className="text-lg sm:text-xl font-serif">TRANSACTION ROSTER</h2>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-muted-foreground">TX ID</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-muted-foreground">BUYER</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-muted-foreground">RECEIVER</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-muted-foreground">STATUS</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-muted-foreground">BLOCK</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-muted-foreground">AMOUNT</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-muted-foreground">RISK</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-muted-foreground">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                        Loading transactions from blockchain...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-red-500">
                        Error: {error}
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                        {!isConnected 
                          ? "Connect your wallet to fetch transactions" 
                          : !hasFetched 
                            ? "Click 'Fetch Transactions' to load data" 
                            : "No transactions found for your wallet"}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx.transactionHash}
                        onClick={() => handleRowClick(tx)}
                        className="border-b border-border/40 hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 sm:px-6 py-4 font-mono text-xs sm:text-sm">{formatAddress(tx.transactionHash)}</td>
                        <td className="px-4 sm:px-6 py-4 font-mono text-xs sm:text-sm">{formatAddress(tx.buyer)}</td>
                        <td className="px-4 sm:px-6 py-4 font-mono text-xs sm:text-sm">{formatAddress(tx.receiver)}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500" />
                            <span className="uppercase text-xs sm:text-sm">completed</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <MapPin className="size-3 sm:size-4 text-muted-foreground" />
                            #{tx.blockNumber.toString()}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-mono text-xs sm:text-sm">{tx.amountSC} SC</td>
                        <td className="px-4 sm:px-6 py-4">
                          <Badge
                            variant="secondary"
                            className={`uppercase text-xs ${
                              getRiskLevel(tx.amountSC) === "high"
                                ? "bg-primary/20 text-primary border-primary/40"
                                : getRiskLevel(tx.amountSC) === "medium"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-green-500/20 text-green-500 border-green-500/40"
                            }`}
                          >
                            {getRiskLevel(tx.amountSC)}
                          </Badge>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8" 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://sepolia.etherscan.io/tx/${tx.transactionHash}`, '_blank');
                            }}
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transaction Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl bg-card border-border/40">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-display mb-2">Transaction Details</DialogTitle>
              <p className="text-muted-foreground font-mono text-xs sm:text-sm break-all">
                {selectedTransaction?.transactionHash}
              </p>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">BUYER</div>
                  <div className="font-mono text-sm break-all">{selectedTransaction?.buyer}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">RECEIVER</div>
                  <div className="font-mono text-sm break-all">{selectedTransaction?.receiver}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">AMOUNT SC</div>
                  <div className="text-2xl font-bold">{selectedTransaction?.amountSC} SC</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">AMOUNT BC (ETH)</div>
                  <div className="text-lg">{selectedTransaction?.amountBC} ETH</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">BLOCK</div>
                  <div>#{selectedTransaction?.blockNumber?.toString()}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/40">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${selectedTransaction?.transactionHash}`, '_blank')}
              >
                <ExternalLink className="size-4 mr-2" />
                View on Etherscan
              </Button>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardPageLayout>
  )
}
