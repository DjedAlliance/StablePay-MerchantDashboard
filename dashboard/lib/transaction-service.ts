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

    async fetchStableCoinPurchases(merchantAddress?: string, fromBlock?: bigint): Promise<TransactionEvent[]> {
        try {
            const currentBlock = await this.publicClient.getBlockNumber();
            const startBlock = fromBlock || BigInt(6000000); // Use provided fromBlock or default to 6000000
            const maxBlockRange = BigInt(49999);
            let allEvents: any[] = [];

            for (let currentFromBlock = startBlock; currentFromBlock <= currentBlock; currentFromBlock += maxBlockRange) {
                const toBlock = currentFromBlock + maxBlockRange > currentBlock ? currentBlock : currentFromBlock + maxBlockRange;

                console.log(`Fetching blocks ${currentFromBlock} to ${toBlock}`);

                const purchaseEvents = await this.publicClient.getLogs({
                    address: getCurrentContractAddress() as `0x${string}`,
                    event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                    args: merchantAddress ? {
                        receiver: merchantAddress
                    } as any : undefined,
                    fromBlock: currentFromBlock,
                    toBlock
                });
                allEvents = [...allEvents, ...purchaseEvents];
            }

            console.log("Total events found:", allEvents.length);

            const formattedEvents: TransactionEvent[] = allEvents.map(event => {
                // Split the data (remove 0x prefix first)
                const rawData = event.data.slice(2); // Remove '0x'
                const amountSCHex = '0x' + rawData.slice(0, 64);  // First 32 bytes
                const amountBCHex = '0x' + rawData.slice(64);     // Second 32 bytes

                // Debug
                console.log('SC hex:', amountSCHex);  // Should be like 0x000...03e8
                console.log('BC hex:', amountBCHex);  // Should be like 0x000...79cf

                return {
                    buyer: this.formatAddress(event.topics[1]),
                    receiver: this.formatAddress(event.topics[2]),
                    amountSC: (parseInt(amountSCHex, 16) / 1000000).toString(),  // Convert to SC
                    amountBC: formatUnits(BigInt(amountBCHex), 18),             // Convert to ETH
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash
                };
            });

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