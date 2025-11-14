import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
<<<<<<< Updated upstream
import { contractAbi } from './contract';
=======

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    async fetchStableCoinPurchases(walletAddress?: string): Promise<TransactionEvent[]> {
=======
    async fetchStableCoinPurchases(merchantAddress?: string, fromBlock?: bigint): Promise<TransactionEvent[]> {
>>>>>>> Stashed changes
        try {
            const currentBlock = await this.publicClient.getBlockNumber();
            const startBlock = fromBlock || BigInt(6000000);
            const maxBlockRange = BigInt(49999);
            let allEvents: any[] = [];

            for (let block = startBlock; block <= currentBlock; block += maxBlockRange) {
                const toBlock = block + maxBlockRange > currentBlock ? currentBlock : block + maxBlockRange;

                console.log(`Fetching blocks ${block} to ${toBlock}`);

                // Use event signature instead of abi + eventName
                const purchaseEvents = await this.publicClient.getLogs({
                    address: getCurrentContractAddress() as `0x${string}`,
<<<<<<< Updated upstream
<<<<<<< Updated upstream
                    event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
=======
                    event: abi[0].abi.find(item => item.type === 'event' && item.name === 'BoughtStableCoins'),
>>>>>>> Stashed changes
                    fromBlock,
=======
                    event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                    args: merchantAddress ? {
                      receiver: merchantAddress
                    }as any:undefined,
                    fromBlock: block,
>>>>>>> Stashed changes
                    toBlock
                  });
                allEvents = [...allEvents, ...purchaseEvents];
            }

            console.log("Total events found:", allEvents.length);

            const formattedEvents: TransactionEvent[] = allEvents.map(event => {
                const rawData = event.data.slice(2);
                const amountSCHex = '0x' + rawData.slice(0, 64);
                const amountBCHex = '0x' + rawData.slice(64);

                console.log('SC hex:', amountSCHex);
                console.log('BC hex:', amountBCHex);

                return {
                    buyer: this.formatAddress(event.topics[1]),
                    receiver: this.formatAddress(event.topics[2]),
                    amountSC: (parseInt(amountSCHex, 16) / 1000000).toString(),
                    amountBC: formatUnits(BigInt(amountBCHex), 18),
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash
                };
            });

            if (walletAddress) {
                return formattedEvents.filter(event =>
                    event.buyer.toLowerCase() === walletAddress.toLowerCase() ||
                    event.receiver.toLowerCase() === walletAddress.toLowerCase()
                );
            }

            return formattedEvents;
        } catch (err) {
            console.error("Error fetching events:", err);
            console.log("Error message:", err instanceof Error ? err.message : String(err));
            throw err;
        }
    }
}

export const transactionService = new TransactionService();