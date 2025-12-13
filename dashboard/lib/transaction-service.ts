import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';

import { getCurrentContractAddress } from './config';
import { parseAbiItem } from 'viem';

export interface TransactionEvent {
    buyer: string;
    receiver: string;
    amountSC: string;
    amountBC: string;
    blockNumber: bigint;
    transactionHash: string;
    timestamp?: Date;
}

export class TransactionService {
    private publicClient;

    constructor() {
        this.publicClient = createPublicClient({
            chain: sepolia,
            transport: http('https://ethereum-sepolia.publicnode.com'),
        });
    }

    private formatAddress = (address: string): string => {
        const cleanAddress = address.replace('0x', '').slice(-40);
        return `0x${cleanAddress}`;
    };

    /**
     * Fetch stablecoin purchase transactions filtered by merchant address
     * @param merchantAddress - The merchant's wallet address to filter transactions (receiver)
     * @param fromBlock - Optional starting block for incremental fetching
     * @returns Array of transaction events
     */
    async fetchStableCoinPurchases(
        merchantAddress?: string,
        fromBlock?: bigint
    ): Promise<TransactionEvent[]> {
        try {
            const currentBlock = await this.publicClient.getBlockNumber();
            
            // Start from provided block or default starting block
            const startBlock = fromBlock || BigInt(6000000);
            const maxBlockRange = BigInt(49999);
            let allEvents: any[] = [];

            console.log(`Fetching from block ${startBlock} to ${currentBlock}`);
            if (merchantAddress) {
                console.log(`Filtering for merchant address: ${merchantAddress}`);
            }

            for (let from = startBlock; from <= currentBlock; from += maxBlockRange) {
                const to = from + maxBlockRange > currentBlock ? currentBlock : from + maxBlockRange;

                console.log(`Fetching blocks ${from} to ${to}`);

                const purchaseEvents = await this.publicClient.getLogs({
                    address: getCurrentContractAddress() as `0x${string}`,
                    event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                    args: merchantAddress ? {
                        receiver: merchantAddress as `0x${string}`
                    } as any : undefined,
                    fromBlock: from,
                    toBlock: to
                });
                
                allEvents = [...allEvents, ...purchaseEvents];
                console.log(`Found ${purchaseEvents.length} events in this range (total: ${allEvents.length})`);
            }

            console.log("Total events found:", allEvents.length);

            const formattedEvents: TransactionEvent[] = allEvents.map(event => {
                // Split the data (remove 0x prefix first)
                const rawData = event.data.slice(2); // Remove '0x'
                const amountSCHex = '0x' + rawData.slice(0, 64);  // First 32 bytes
                const amountBCHex = '0x' + rawData.slice(64);     // Second 32 bytes

                return {
                    buyer: this.formatAddress(event.topics[1]),
                    receiver: this.formatAddress(event.topics[2]),
                    amountSC: (parseInt(amountSCHex, 16) / 1000000).toString(),  // Convert to SC
                    amountBC: formatUnits(BigInt(amountBCHex), 18),             // Convert to ETH
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash
                };
            });

            // Sort by block number (oldest first)
            formattedEvents.sort((a, b) => 
                a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0
            );

            return formattedEvents;
        } catch (err) {
            console.error("Error fetching events:", err);
            console.log("Error message:", err instanceof Error ? err.message : String(err));
            throw err;
        }
    }
}

// Export singleton instance
export const transactionService = new TransactionService();
