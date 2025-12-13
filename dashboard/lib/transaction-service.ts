import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import { getCurrentContractAddress } from './config';

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

    
    async fetchStableCoinPurchases(merchantAddress?: string, fromBlockOverride?: bigint): Promise<TransactionEvent[]> {
        try {
            const currentBlock = await this.publicClient.getBlockNumber();
            
            
            const startBlock = fromBlockOverride || BigInt(6000000);
            
            const maxBlockRange = BigInt(49999);
            let allEvents: any[] = [];

            
            if (startBlock > currentBlock) {
                return [];
            }

            for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += maxBlockRange) {
                const toBlock = fromBlock + maxBlockRange > currentBlock ? currentBlock : fromBlock + maxBlockRange;

                console.log(`Fetching blocks ${fromBlock} to ${toBlock}`);

                const purchaseEvents = await this.publicClient.getLogs({
                    address: getCurrentContractAddress() as `0x${string}`,
                    event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                    args: merchantAddress ? {
                      receiver: merchantAddress
                    } as any : undefined,
                    fromBlock,
                    toBlock
                  });
                allEvents = [...allEvents, ...purchaseEvents];
            }

            console.log("Total events found:", allEvents.length);

            const formattedEvents: TransactionEvent[] = allEvents.map(event => {
                const rawData = event.data.slice(2); 
                const amountSCHex = '0x' + rawData.slice(0, 64);
                const amountBCHex = '0x' + rawData.slice(64);    

                return {
                    buyer: this.formatAddress(event.topics[1]),
                    receiver: this.formatAddress(event.topics[2]),
                    amountSC: (parseInt(amountSCHex, 16) / 1000000).toString(),
                    amountBC: formatUnits(BigInt(amountBCHex), 18),
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash
                };
            });

            return formattedEvents;
        } catch (err) {
            console.error("Error fetching events:", err);
            throw err;
        }
    }
}

export const transactionService = new TransactionService();