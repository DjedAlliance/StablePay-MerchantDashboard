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

const DEFAULT_START_BLOCK = BigInt(6000000);
const MAX_BLOCK_RANGE = BigInt(49999);

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
     * Fetch StableCoin purchase events from blockchain
     * @param merchantAddress - Filter by receiver (merchant) address
     * @param startFromBlock - Start block for incremental fetching
     */
    async fetchStableCoinPurchases(
        merchantAddress?: string,
        startFromBlock?: bigint
    ): Promise<TransactionEvent[]> {
        try {
            const currentBlock = await this.publicClient.getBlockNumber();
            const startBlock = startFromBlock || DEFAULT_START_BLOCK;
            const allEvents: any[] = [];

            for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += MAX_BLOCK_RANGE) {
                const toBlock = fromBlock + MAX_BLOCK_RANGE > currentBlock 
                    ? currentBlock 
                    : fromBlock + MAX_BLOCK_RANGE;

                const purchaseEvents = await this.publicClient.getLogs({
                    address: getCurrentContractAddress() as `0x${string}`,
                    event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                    args: merchantAddress ? {
                        receiver: merchantAddress as `0x${string}`
                    } : undefined,
                    fromBlock,
                    toBlock
                });
                
                allEvents.push(...purchaseEvents);
            }

            return allEvents.map(event => {
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
        } catch (err) {
            console.error("Error fetching events:", err);
            throw err;
        }
    }
}

export const transactionService = new TransactionService();
