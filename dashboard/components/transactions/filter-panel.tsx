"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransactionFilters } from "@/hooks/use-transactions";
import { RotateCcw } from "lucide-react";

interface FilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TransactionFilters;
  onApplyFilters: (filters: TransactionFilters) => void;
  onClearFilters: () => void;
}

export function FilterPanel({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  onClearFilters,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<TransactionFilters>(filters);

  // Sync local filters when sheet opens or filters change externally
  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    onClearFilters();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] pl-4 overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/40">
          <SheetTitle className="text-2xl font-serif">Filter Transactions</SheetTitle>
          <SheetDescription>
            Refine your transaction roster by applying multiple filters.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Addresses</h3>
            <div className="grid gap-2">
              <Label htmlFor="buyer">Buyer Address</Label>
              <Input
                id="buyer"
                placeholder="0x..."
                value={localFilters.buyer}
                onChange={(e) => setLocalFilters({ ...localFilters, buyer: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="receiver">Receiver Address</Label>
              <Input
                id="receiver"
                placeholder="0x..."
                value={localFilters.receiver}
                onChange={(e) => setLocalFilters({ ...localFilters, receiver: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Network & Block</h3>
            <div className="grid gap-2">
              <Label htmlFor="blockchain">Blockchain</Label>
              <select
                id="blockchain"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={localFilters.blockchain}
                onChange={(e) => setLocalFilters({ ...localFilters, blockchain: e.target.value })}
              >
                <option value="">All Networks</option>
                <option value="Sepolia">Sepolia</option>
                <option value="Ethereum Classic">Ethereum Classic</option>
                <option value="Mordor Testnet">Mordor Testnet</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="blockMin">Min Block</Label>
                <Input
                  id="blockMin"
                  type="number"
                  placeholder="0"
                  value={localFilters.blockMin}
                  onChange={(e) => setLocalFilters({ ...localFilters, blockMin: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blockMax">Max Block</Label>
                <Input
                  id="blockMax"
                  type="number"
                  placeholder="9999999"
                  value={localFilters.blockMax}
                  onChange={(e) => setLocalFilters({ ...localFilters, blockMax: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Amounts</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amountSCMin">Min SC</Label>
                <Input
                  id="amountSCMin"
                  type="number"
                  placeholder="0.0"
                  value={localFilters.amountSCMin}
                  onChange={(e) => setLocalFilters({ ...localFilters, amountSCMin: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amountSCMax">Max SC</Label>
                <Input
                  id="amountSCMax"
                  type="number"
                  placeholder="1000.0"
                  value={localFilters.amountSCMax}
                  onChange={(e) => setLocalFilters({ ...localFilters, amountSCMax: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amountBCMin">Min BC</Label>
                <Input
                  id="amountBCMin"
                  type="number"
                  placeholder="0.0"
                  value={localFilters.amountBCMin}
                  onChange={(e) => setLocalFilters({ ...localFilters, amountBCMin: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amountBCMax">Max BC</Label>
                <Input
                  id="amountBCMax"
                  type="number"
                  placeholder="100.0"
                  value={localFilters.amountBCMax}
                  onChange={(e) => setLocalFilters({ ...localFilters, amountBCMax: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Other</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="risk">Risk Level</Label>
                <select
                  id="risk"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={localFilters.risk}
                  onChange={(e) => setLocalFilters({ ...localFilters, risk: e.target.value })}
                >
                  <option value="">All Risks</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={localFilters.status}
                  onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="timestampStart">Start Date</Label>
                <Input
                  id="timestampStart"
                  type="date"
                  value={localFilters.timestampStart}
                  onChange={(e) => setLocalFilters({ ...localFilters, timestampStart: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timestampEnd">End Date</Label>
                <Input
                  id="timestampEnd"
                  type="date"
                  value={localFilters.timestampEnd}
                  onChange={(e) => setLocalFilters({ ...localFilters, timestampEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-between gap-3 pt-4 border-t border-border/40 sm:justify-between pb-8">
          <Button variant="outline" onClick={handleClear} className="w-full sm:w-auto">
            <RotateCcw className="size-4 mr-2" />
            Clear
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="secondary" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none">
              Apply Filters
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
