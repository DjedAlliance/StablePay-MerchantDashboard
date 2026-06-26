"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, X, Download } from "lucide-react"
import type { TransactionEvent } from "@/lib/transaction-service"
import { getRiskLevel, sortTransactions, SortBy, SortDirection } from "@/hooks/use-transactions"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: TransactionEvent[]
  filteredTransactions: TransactionEvent[]
  fetchTimestampsForExport: (txs: TransactionEvent[]) => Promise<TransactionEvent[]>
  hasActiveFilters: boolean
  sortBy: SortBy
  sortDirection: SortDirection
}

const COLUMNS = [
  { id: 'transactionHash', label: 'Transaction ID' },
  { id: 'buyer', label: 'Buyer' },
  { id: 'receiver', label: 'Receiver' },
  { id: 'status', label: 'Status' },
  { id: 'blockNumber', label: 'Block Number' },
  { id: 'networkName', label: 'Blockchain' },
  { id: 'chainId', label: 'Chain ID' },
  { id: 'amountSC', label: 'Amount SC' },
  { id: 'amountBC', label: 'Amount BC' },
  { id: 'riskLevel', label: 'Risk Level' },
  { id: 'timestamp', label: 'Timestamp' }
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

function escapeCsvCell(cell: string | number | undefined | null) {
  if (cell === null || cell === undefined) return '';
  const cellStr = String(cell);
  if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
    return `"${cellStr.replace(/"/g, '""')}"`;
  }
  return cellStr;
}

export function ExportDialog({
  open,
  onOpenChange,
  transactions,
  filteredTransactions,
  fetchTimestampsForExport,
  hasActiveFilters,
  sortBy,
  sortDirection
}: ExportDialogProps) {
  const [useFilters, setUseFilters] = useState(false)
  const [exportAllColumns, setExportAllColumns] = useState(true)
  const [excludedColumns, setExcludedColumns] = useState<Set<ColumnId>>(new Set())
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!hasActiveFilters) {
      setUseFilters(false);
    }
  }, [hasActiveFilters]);

  const handleToggleColumn = (id: ColumnId) => {
    setExcludedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const targetTransactions = useFilters ? filteredTransactions : transactions;

      if (targetTransactions.length === 0) {
        alert("No transactions to export.");
        return;
      }

      // Determine which columns to export
      const columnsToExport = exportAllColumns
        ? COLUMNS
        : COLUMNS.filter(c => !excludedColumns.has(c.id));

      if (columnsToExport.length === 0) {
        alert("Please select at least one column to export.");
        setIsExporting(false);
        return;
      }

      let dataToExport = sortTransactions(targetTransactions, sortBy, sortDirection);

      // Check if timestamp column is included and we need to fetch timestamps
      const includeTimestamp = columnsToExport.some(c => c.id === 'timestamp');
      if (includeTimestamp) {
        // Find which ones need timestamps
        const missingTimestamps = dataToExport.filter(tx => !tx.timestamp);
        if (missingTimestamps.length > 0) {
          // Fetch missing
          const fetchedWithTimestamps = await fetchTimestampsForExport(missingTimestamps);

          // Merge back
          const fetchedMap = new Map(fetchedWithTimestamps.map(tx => [tx.transactionHash, tx]));
          dataToExport = dataToExport.map(tx => {
            const fetched = fetchedMap.get(tx.transactionHash);
            return fetched && fetched.timestamp ? { ...tx, timestamp: fetched.timestamp } : tx;
          });
        }
      }

      // Generate CSV content
      const headers = ['"S. No."', ...columnsToExport.map(c => escapeCsvCell(c.label))].join(',');

      const rows = dataToExport.map((tx, index) => {
        const rowData = columnsToExport.map(col => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let val: any = '';
          switch (col.id) {
            case 'transactionHash': val = tx.transactionHash; break;
            case 'buyer': val = tx.buyer; break;
            case 'receiver': val = tx.receiver; break;
            case 'status': val = 'Completed'; break;
            case 'blockNumber': val = tx.blockNumber.toString(); break;
            case 'networkName': val = tx.networkName || 'Unknown'; break;
            case 'chainId': val = tx.chainId; break;
            case 'amountSC': val = tx.amountSC; break;
            case 'amountBC': val = tx.amountBC; break;
            case 'riskLevel': val = getRiskLevel(tx.amountSC); break;
            case 'timestamp':
              val = tx.timestamp ? tx.timestamp.toISOString() : 'N/A';
              break;
          }
          return escapeCsvCell(val);
        });
        return [index + 1, ...rowData].join(',');
      });

      const csvContent = [headers, ...rows].join('\n');

      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Export failed", error);
      alert("An error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isExporting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset state on close
        setTimeout(() => {
          setUseFilters(false);
          setExportAllColumns(true);
          setExcludedColumns(new Set());
        }, 300);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
          <DialogDescription>
            Download your transactions data as a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="filters-applied"
              checked={useFilters}
              onChange={(e) => setUseFilters(e.target.checked)}
              disabled={!hasActiveFilters}
              className="size-4 rounded border-border/50 text-primary focus:ring-primary/50 accent-primary disabled:opacity-50"
            />
            <label
              htmlFor="filters-applied"
              className={`text-sm font-medium leading-none ${!hasActiveFilters ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            >
              Filters
            </label>
            <span className="text-xs text-muted-foreground ml-2">
              ({useFilters ? filteredTransactions.length : transactions.length} transactions)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="export-all-columns"
              checked={exportAllColumns}
              onChange={(e) => setExportAllColumns(e.target.checked)}
              className="size-4 rounded border-border/50 text-primary focus:ring-primary/50 accent-primary"
            />
            <label
              htmlFor="export-all-columns"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Export all columns
            </label>
          </div>

          {!exportAllColumns && (
            <div className="mt-2 space-y-3 p-4 bg-muted/50 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground mb-2">
                Click on a column to exclude or include it in the export.
              </p>
              <div className="flex flex-wrap gap-2">
                {COLUMNS.map((col) => {
                  const isExcluded = excludedColumns.has(col.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => handleToggleColumn(col.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isExcluded
                          ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                        }`}
                    >
                      {col.label}
                      {isExcluded ? (
                        <div className="bg-red-500/20 rounded-full p-0.5">
                          <X className="size-3" />
                        </div>
                      ) : (
                        <div className="bg-green-500/20 rounded-full p-0.5">
                          <X className="size-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Preparing Export...
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
