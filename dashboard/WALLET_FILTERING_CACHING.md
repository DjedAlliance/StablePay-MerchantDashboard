# Wallet-Based Transaction Filtering & Persistent Caching Implementation

## Overview

This implementation provides wallet-based transaction filtering and indefinite persistent caching with incremental updates to improve dashboard performance and reduce unnecessary blockchain queries.

## Features Implemented

### ✅ Wallet-Based Filtering
- **Automatic Address Capture**: Merchant wallet address is automatically captured when wallet connects
- **Receiver Filtering**: Only fetches transactions where the connected wallet is the receiver
- **Address Validation**: Cache is wallet-specific and invalidated when switching wallets

### ✅ Persistent Caching
- **Indefinite Storage**: Transactions are stored in `localStorage` without expiration
- **Instant Load**: Cached data loads immediately on page refresh
- **Wallet-Specific**: Each wallet address has its own cache

### ✅ Incremental Fetching
- **Block Tracking**: `lastSyncedBlock` is stored to track the latest fetched block
- **Smart Updates**: "Fetch Fresh Data" only retrieves transactions after the last synced block
- **Data Preservation**: New transactions are appended to existing cache without losing previous data

## Implementation Details

### Hook: `use-transactions.ts`

#### Key Changes
```typescript
// Imports wallet connection status
import { useWallet } from './use-wallet';

// Cache structure includes merchant address and last synced block
interface CachedData {
    transactions: TransactionEvent[];
    lastSyncedBlock: string;
    merchantAddress: string; // Wallet-specific caching
}
```

#### Wallet Integration
```typescript
const { walletAddress, isConnected } = useWallet();

// Only load cache if it matches current wallet
if (merchantAddress.toLowerCase() === walletAddress.toLowerCase()) {
    // Restore cached data
}
```

#### Incremental Fetch
```typescript
// Pass last synced block for incremental fetch
const fromBlock = incremental && lastSyncedBlock ? lastSyncedBlock + 1n : undefined;
const events = await transactionService.fetchStableCoinPurchases(walletAddress, fromBlock);

// Append new transactions to existing cache
if (incremental && transactions.length > 0) {
    updatedTransactions = [...transactions, ...events];
}
```

### Service: `transaction-service.ts`

#### Method Signature
```typescript
async fetchStableCoinPurchases(
    merchantAddress?: string,  // Filter by merchant address
    fromBlock?: bigint        // Start from specific block for incremental fetch
): Promise<TransactionEvent[]>
```

#### Filtering Implementation
```typescript
const purchaseEvents = await this.publicClient.getLogs({
    address: getCurrentContractAddress(),
    event: parseAbiItem('event BoughtStableCoins(...)'),
    args: merchantAddress ? {
        receiver: merchantAddress // Filter by receiver address
    } : undefined,
    fromBlock: from,
    toBlock: to
});
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Wallet Connects                                         │
│     └─> Merchant address captured                           │
│     └─> Check localStorage for existing cache               │
│         └─> If cache exists for this wallet:                │
│             └─> Load cached transactions instantly           │
│             └─> Restore lastSyncedBlock                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. First Fetch (or Manual Refresh)                         │
│     └─> fetchTransactions(incremental = false)              │
│         └─> Fetch ALL transactions for merchant             │
│         └─> Store in cache with lastSyncedBlock             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Incremental Fetch ("Fetch Fresh Data")                  │
│     └─> fetchTransactions(incremental = true)               │
│         └─> Fetch ONLY transactions after lastSyncedBlock   │
│         └─> Append new transactions to existing cache       │
│         └─> Update lastSyncedBlock to latest                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Page Refresh                                            │
│     └─> Cache loads instantly                               │
│     └─> lastSyncedBlock is restored                         │
│     └─> Ready for next incremental update                   │
└─────────────────────────────────────────────────────────────┘
```

## Usage Example

### In Components

```typescript
import { useTransactions } from '@/hooks/use-transactions';

function TransactionsComponent() {
    const { 
        transactions,
        loading,
        error,
        hasFetched,
        lastSyncedBlock,
        merchantAddress,
        fetchTransactions,
        clearCache 
    } = useTransactions();

    // Initial fetch (full)
    const handleInitialFetch = () => {
        fetchTransactions(false);
    };

    // Incremental fetch (only new transactions)
    const handleRefresh = () => {
        fetchTransactions(true);
    };

    return (
        <div>
            <p>Merchant: {merchantAddress}</p>
            <p>Last Synced Block: {lastSyncedBlock?.toString()}</p>
            <p>Transactions: {transactions.length}</p>
            
            {!hasFetched && (
                <button onClick={handleInitialFetch}>Fetch Transactions</button>
            )}
            
            {hasFetched && (
                <button onClick={handleRefresh}>Fetch Fresh Data</button>
            )}
            
            <button onClick={clearCache}>Clear Cache</button>
        </div>
    );
}
```

## Cache Structure

### LocalStorage Keys
- `stablepay_transactions`: Main cache containing all transaction data
- Structure:
  ```json
  {
    "transactions": [...],
    "lastSyncedBlock": "7845123",
    "merchantAddress": "0x1234...5678"
  }
  ```

## Benefits

### Performance
- ✅ **Instant Load**: Cached data appears immediately on page load
- ✅ **Reduced API Calls**: Only fetches new transactions, not entire history
- ✅ **Bandwidth Savings**: Incremental fetches use minimal data

### User Experience
- ✅ **No Data Loss**: Previously fetched transactions never disappear
- ✅ **Smooth Updates**: New data appends without UI flicker
- ✅ **Wallet-Specific**: Each wallet maintains its own transaction history

### Reliability
- ✅ **Persistent Storage**: Data survives page refreshes and browser restarts
- ✅ **Error Recovery**: Failed fetches don't clear existing cache
- ✅ **Wallet Switching**: Automatically loads correct cache for connected wallet

## Testing Checklist

### Wallet Connection
- [ ] Connect wallet and verify address is captured
- [ ] Check if existing cache loads for connected wallet
- [ ] Switch wallets and verify cache switches

### Initial Fetch
- [ ] Click "Fetch Transactions" when no cache exists
- [ ] Verify transactions are filtered by merchant address
- [ ] Confirm `lastSyncedBlock` is stored
- [ ] Check localStorage contains cached data

### Incremental Fetch
- [ ] After initial fetch, click "Fetch Fresh Data"
- [ ] Verify only new transactions are fetched
- [ ] Confirm new transactions are appended, not replaced
- [ ] Check `lastSyncedBlock` updates to latest

### Persistence
- [ ] Refresh page (F5)
- [ ] Verify transactions load instantly from cache
- [ ] Confirm transaction count matches before refresh
- [ ] Check `lastSyncedBlock` is restored

### Cache Invalidation
- [ ] Disconnect wallet
- [ ] Connect different wallet
- [ ] Verify cache is cleared or replaced
- [ ] Fetch transactions for new wallet
- [ ] Confirm new cache is wallet-specific

## Known Limitations

1. **Cache Size**: Large transaction histories may exceed localStorage limits (~5-10MB)
2. **No Deduplication**: Duplicate transactions (same hash) are not filtered
3. **No Expiration**: Cache never expires automatically
4. **Single Device**: Cache is browser-specific, not synced across devices

## Future Enhancements

- [ ] Add transaction deduplication by hash
- [ ] Implement cache size monitoring and cleanup
- [ ] Add optional cache expiration for data freshness
- [ ] Support for multiple wallet addresses simultaneously
- [ ] Export/import cache functionality
- [ ] Server-side caching for cross-device sync

## Implementation Date

**December 13, 2025**

## Status

✅ **Ready for Testing and Review**
