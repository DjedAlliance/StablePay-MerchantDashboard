"use client"

import { useState, useMemo } from "react"
import { Bell, RefreshCw, Filter, Search, Shield, MapPin, Clock, MoreVertical, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Copy, Check, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import DashboardPageLayout from "@/components/dashboard/layout"
import CreditCardIcon from "@/components/icons/credit-card"
import { useTransactions, getRiskLevel } from "@/hooks/use-transactions"
import type { PageSize, SortBy, SortDirection } from "@/hooks/use-transactions"
import { NETWORKS } from "@/lib/config"
import { FilterPanel } from "@/components/transactions/filter-panel"
import { ExportDialog } from "@/components/transactions/export-dialog"

// Helper function to format address
const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to get explorer URL for a transaction
const getExplorerUrl = (chainId: number, txHash: string): string => {
  const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
  if (network?.explorerUrl) {
    return `${network.explorerUrl}/tx/${txHash}`;
  }
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};

// Helper function to get risk level based on amount
type RiskLevel = "high" | "medium" | "low"

const riskStyles: Record<RiskLevel, string> = {
  high: "bg-primary/20 text-primary border-primary/40",
  medium: "bg-muted text-muted-foreground",
  low: "bg-green-500/20 text-green-500 border-green-500/40",
}

/**
 * Compute which page numbers to display in the pagination bar.
 * Always shows first page, last page, and a window around current page.
 * Gaps are represented by -1 (rendered as ellipsis).
 */
function getPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: number[] = [];
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  pages.push(1);

  if (windowStart > 2) {
    pages.push(-1); // ellipsis
  }

  for (let i = windowStart; i <= windowEnd; i++) {
    pages.push(i);
  }

  if (windowEnd < totalPages - 1) {
    pages.push(-1); // ellipsis
  }

  pages.push(totalPages);

  return pages;
}

function CopyableCell({ value, displayValue }: { value: string; displayValue?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex items-center w-full h-full min-h-[1.5rem]">
      <div className="pr-6">{displayValue ?? value}</div>
      <button
        onClick={handleCopy}
        className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background hover:bg-muted p-1 rounded-md z-10"
        title="Copy"
      >
        {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function TransactionsPage() {
  const {
    transactions,
    paginatedTransactions,
    loading,
    error,
    hasFetched,
    fetchTransactions,
    clearCache,
    currentPage,
    pageSize,
    totalPages,
    totalCount,
    goToPage,
    changePageSize,
    pageSizeOptions,
    // Sorting
    sortBy,
    sortDirection,
    changeSortBy,
    changeSortDirection,
    fetchTimestampsForExport,
    fetchingTimestamps,
    sortByOptions,
    sortByLabels,
    sortDirectionOptions,
    isAllTransactionsFetched,
    loadingMore,
    fetchMore,
    // Filters
    filters,
    filteredTransactions,
    applyFilters,
    clearFilters,
  } = useTransactions();

  const [selectedTransaction, setSelectedTransaction] = useState<(typeof transactions)[number] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const selectedRiskLevel = selectedTransaction
    ? getRiskLevel(selectedTransaction.amountSC)
    : null

  const transactionStats = useMemo(() => {
    return {
      total: totalCount,
    };
  }, [totalCount]);

  const handleRowClick = (transaction: (typeof transactions)[0]) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  // Compute pagination display info
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

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
      <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border/40">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">StablePay</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-primary">TRANSACTIONS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground hidden md:inline">
            LAST UPDATE:{" "}
            {new Date().toLocaleString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "UTC",
            })}{" "}
            UTC
          </span>
          <Button variant="ghost" size="icon" className="size-8">
            <Bell className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-8 py-8 overflow-auto">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-4 md:gap-0">
          <div>
            <h1 className="text-4xl font-serif mb-2">Transaction Network</h1>
            <p className="text-muted-foreground">Manage and monitor payment operations</p>
          </div>
          <div className="flex gap-3">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground relative"
              onClick={() => setIsExportOpen(true)}
            >
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground relative"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="size-4 mr-2" />
              Filter
              {Object.values(filters).some(v => v !== '') && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-background"></span>
                </span>
              )}
            </Button>
            {!hasFetched ? (
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                onClick={fetchTransactions} 
                disabled={loading}
              >
                <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'See Transactions'}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={fetchTransactions} 
                  disabled={loading}
                >
                  <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Loading...' : 'Refresh Data'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearCache}
                  className="text-xs"
                >
                  Clear Cache
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Search Card */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search transactions" className="pl-10 bg-background/50 border-border/40" />
            </div>
          </div>

          {/* Active Transactions */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-2">TOTAL TRANSACTIONS</div>
                <div className="text-4xl font-bold">
                  {loading && transactionStats.total === 0 ? "..." : (!isAllTransactionsFetched && transactionStats.total !== 0 ? `${transactionStats.total}+` : transactionStats.total)}
                </div>
                {!isAllTransactionsFetched && transactionStats.total >= 1000 && !loading && (
                  <div className="text-xs text-muted-foreground mt-1 text-primary font-medium">1k+ limit reached</div>
                )}
              </div>
              <Shield className="size-8 text-foreground" />
            </div>
          </div>

          {/* Failed */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-2">FAILED</div>
                <div className="text-4xl font-bold text-red-500">0</div>
              </div>
              <Shield className="size-8 text-red-500" />
            </div>
          </div>

          {/* Pending */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-2">PENDING</div>
                <div className="text-4xl font-bold text-primary">0</div>
              </div>
              <Shield className="size-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-card border border-border/40 rounded-lg overflow-hidden flex-1 flex flex-col">
          <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-serif">TRANSACTION ROSTER</h2>
              {/* Fetching timestamps indicator */}
              {hasFetched && fetchingTimestamps && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Fetching timestamps…</span>
                </div>
              )}
            </div>
            {hasFetched && totalCount > 0 && (
              <div className="flex items-center gap-4 flex-wrap">
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="size-4 text-muted-foreground" />
                  <label htmlFor="sort-by-select" className="text-sm text-muted-foreground">Sort by:</label>
                  <select
                    id="sort-by-select"
                    value={sortBy}
                    onChange={(e) => changeSortBy(e.target.value as SortBy)}
                    className="bg-background border border-border/40 rounded-md px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  >
                    {sortByOptions.map((option) => (
                      <option key={option} value={option}>
                        {sortByLabels[option]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Direction */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-sm h-8 px-2"
                  onClick={() =>
                    changeSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                  }
                  title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUp className="size-4" />
                  ) : (
                    <ArrowDown className="size-4" />
                  )}
                  {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                </Button>

                {/* Divider */}
                <div className="h-6 w-px bg-border/40 hidden sm:block" />

                {/* Rows per page */}
                <div className="flex items-center gap-2">
                  <label htmlFor="page-size-select" className="text-sm text-muted-foreground">
                    Rows per page:
                  </label>
                  <select
                    id="page-size-select"
                    value={pageSize}
                    onChange={(e) => changePageSize(Number(e.target.value) as PageSize)}
                    className="bg-background border border-border/40 rounded-md px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-full h-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-32">TRANSACTION ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-40">BUYER</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-40">RECEIVER</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-24">STATUS</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-32">{sortBy === 'timestamp' ? 'TIMESTAMP' : 'BLOCK'}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-28">BLOCKCHAIN</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-24">{sortBy === 'amountBC' ? 'AMOUNT BC' : 'AMOUNT SC'}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-24">RISK</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-20">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && transactionStats.total === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                      Loading transactions from blockchain...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-red-500">
                      Error: {error}
                    </td>
                  </tr>
                ) : transactionStats.total === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                      {!hasFetched ? "Click 'See Transactions' to load blockchain data" : "No StableCoin purchase events found"}
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction, index) => {
                    const riskLevel = getRiskLevel(transaction.amountSC)
                    return (
                    <tr
                      key={transaction.transactionHash}
                      onClick={() => handleRowClick(transaction)}
                      className="border-b border-border/40 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-mono whitespace-nowrap">
                        <CopyableCell value={transaction.transactionHash} displayValue={formatAddress(transaction.transactionHash)} />
                      </td>
                      <td className="px-6 py-4 font-mono whitespace-nowrap">
                        <CopyableCell value={transaction.buyer} displayValue={formatAddress(transaction.buyer)} />
                      </td>
                      <td className="px-6 py-4 font-mono whitespace-nowrap">
                        <CopyableCell value={transaction.receiver} displayValue={formatAddress(transaction.receiver)} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-green-500" />
                          <span className="uppercase text-sm">completed</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <CopyableCell 
                          value={sortBy === 'timestamp' ? (transaction.timestamp?.toISOString() || "") : transaction.blockNumber.toString()}
                          displayValue={
                            sortBy === 'timestamp' ? (
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <Clock className="size-4 text-muted-foreground" />
                                {transaction.timestamp
                                  ? transaction.timestamp.toLocaleString('en-US', {
                                      month: 'short',
                                      day: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '—'}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <MapPin className="size-4 text-muted-foreground" />
                                #{transaction.blockNumber.toString()}
                              </div>
                            )
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-foreground">
                        {transaction.networkName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-mono whitespace-nowrap">
                        <CopyableCell 
                          value={sortBy === 'amountBC' ? transaction.amountBC : transaction.amountSC}
                          displayValue={sortBy === 'amountBC' ? `${transaction.amountBC} BC` : `${transaction.amountSC} SC`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className={`uppercase ${riskStyles[riskLevel]}`}
                        >
                          {riskLevel}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const explorerUrl = getExplorerUrl(transaction.chainId, transaction.transactionHash);
                            window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink className="size-4" />
                        </Button>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {hasFetched && totalCount > 0 && (
            <div className="px-6 py-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Showing X-Y of Z */}
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startItem}</span>–<span className="font-medium text-foreground">{endItem}</span> of{" "}
                <span className="font-medium text-foreground">{!isAllTransactionsFetched && totalCount !== 0 ? `${totalCount}+` : totalCount}</span> transactions
              </div>

              {!isAllTransactionsFetched && totalCount !== 0 ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchMore} 
                  disabled={loadingMore || loading}
                  className="mx-auto border-primary/20 hover:bg-primary/10 text-primary"
                >
                  {loadingMore ? (
                    <><Loader2 className="size-4 mr-2 animate-spin" /> Fetching More...</>
                  ) : (
                    'Fetch More Transactions'
                  )}
                </Button>
              ) : isAllTransactionsFetched ? (
                <div className="mx-auto text-sm text-muted-foreground font-medium">No more transactions</div>
              ) : null}

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                {/* First page */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  aria-label="First page"
                >
                  <ChevronsLeft className="size-4" />
                </Button>

                {/* Previous page */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {/* Page number buttons */}
                {pageNumbers.map((pageNum, idx) =>
                  pageNum === -1 ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-muted-foreground select-none"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "ghost"}
                      size="icon"
                      className={`size-8 text-xs font-medium ${
                        pageNum === currentPage
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                      }`}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                )}

                {/* Next page */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </Button>

                {/* Last page */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  aria-label="Last page"
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/40">
          <DialogHeader className="relative">
            <DialogTitle className="text-3xl font-display mb-2">{selectedTransaction ? formatAddress(selectedTransaction.buyer) : ''}</DialogTitle>
            <div className="flex items-center gap-2 text-muted-foreground font-mono">
               <span className="break-all">{selectedTransaction?.transactionHash}</span>
               {selectedTransaction && (
                  <Button variant="ghost" size="icon" className="size-6" onClick={(e) => {
                     e.stopPropagation();
                     navigator.clipboard.writeText(selectedTransaction.transactionHash);
                  }}>
                    <Copy className="size-3" />
                  </Button>
               )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            <div className="space-y-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">STATUS</div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-500" />
                  <span className="uppercase text-lg">COMPLETED</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">STABLECOIN (SC)</div>
                <div className="text-2xl font-bold">{selectedTransaction?.amountSC} SC</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">BASECOIN (BC)</div>
                <div className="text-2xl font-bold">{selectedTransaction?.amountBC} BC</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-2">TIMESTAMP</div>
                <div className="text-lg">
                  {selectedTransaction?.timestamp 
                    ? selectedTransaction.timestamp.toLocaleString()
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">NETWORK</div>
                <div className="text-lg">{selectedTransaction?.networkName}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">BLOCK NUMBER</div>
                <div className="text-lg">#{selectedTransaction?.blockNumber.toString()}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">RISK LEVEL</div>
                <Badge
                  variant="secondary"
                  className={`uppercase text-sm px-3 py-1 ${selectedRiskLevel ? riskStyles[selectedRiskLevel] : ""}`}
                >
                  {selectedRiskLevel}
                </Badge>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">ADDRESSES</div>
                <div className="space-y-2">
                   <div className="flex flex-col gap-1">
                     <span className="text-xs text-muted-foreground">Buyer</span>
                     <div className="flex items-center gap-2">
                       <span className="font-mono text-sm">{selectedTransaction ? formatAddress(selectedTransaction.buyer) : ''}</span>
                       <Button variant="ghost" size="icon" className="size-5" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(selectedTransaction?.buyer || ''); }}>
                         <Copy className="size-3" />
                       </Button>
                     </div>
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-xs text-muted-foreground">Receiver</span>
                     <div className="flex items-center gap-2">
                       <span className="font-mono text-sm">{selectedTransaction ? formatAddress(selectedTransaction.receiver) : ''}</span>
                       <Button variant="ghost" size="icon" className="size-5" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(selectedTransaction?.receiver || ''); }}>
                         <Copy className="size-3" />
                       </Button>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/40 justify-end">
            <Button variant="outline" className="border-border/40 bg-transparent" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <a href={selectedTransaction ? getExplorerUrl(selectedTransaction.chainId, selectedTransaction.transactionHash) : '#'} target="_blank" rel="noreferrer">
                    View on Explorer
                </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <FilterPanel 
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onApplyFilters={applyFilters}
        onClearFilters={clearFilters}
      />
      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        transactions={transactions}
        filteredTransactions={filteredTransactions}
        fetchTimestampsForExport={fetchTimestampsForExport}
        hasActiveFilters={Object.values(filters).some(v => v !== '')}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
      </div>
    </DashboardPageLayout>
  )
}
