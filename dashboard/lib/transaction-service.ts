import { createPublicClient, http, formatUnits, defineChain } from 'viem';
import { sepolia } from 'viem/chains';

import { NETWORKS, CONTRACTS, DEPLOYMENT_BLOCKS } from './config';
import { parseAbiItem } from 'viem';

export interface TransactionEvent {
    buyer: string;
    receiver: string;
    amountSC: string;
    amountBC: string;
    blockNumber: bigint;
    transactionHash: string;
    timestamp?: Date;
    chainId: number;
    networkName: string;
}

const etcMainnet = defineChain({
    id: 61,
    name: 'Ethereum Classic',
    network: 'etc',
    nativeCurrency: {
        decimals: 18,
        name: 'Ethereum Classic',
        symbol: 'ETC',
    },
    rpcUrls: {
        default: {
            http: ['https://etc.rivet.link'],
        },
    },
    blockExplorers: {
        default: { name: 'Blockscout', url: 'https://blockscout.com/etc/mainnet' },
    },
    testnet: false,
});

const mordor = defineChain({
    id: 63,
    name: 'Mordor Testnet',
    network: 'mordor',
    nativeCurrency: {
        decimals: 18,
        name: 'Mordor Ether',
        symbol: 'METC',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.mordor.etccooperative.org'],
        },
    },
    blockExplorers: {
        default: { name: 'BlockScout', url: 'https://blockscout.com/etc/mordor' },
    },
    testnet: true,
});

export class TransactionService {
    private sepoliaClient;
    private etcClient;
    private mordorClient;

    constructor() {
        this.sepoliaClient = createPublicClient({
            chain: sepolia,
            transport: http(NETWORKS.sepolia.rpcUrl),
        });
        this.etcClient = createPublicClient({
            chain: etcMainnet,
            transport: http(NETWORKS['ethereum-classic'].rpcUrl),
        });
        this.mordorClient = createPublicClient({
            chain: mordor,
            transport: http(NETWORKS.mordor.rpcUrl),
        });
    }

    private formatAddress = (address: string): string => {
        const cleanAddress = address.replace('0x', '').slice(-40);
        return `0x${cleanAddress}`;
    };

    private async fetchEventsFromNetwork(
        client: any,
        contractAddress: string,
        networkKey: string,
        merchantAddress?: string
    ): Promise<TransactionEvent[]> {
        try {
            const currentBlock = await client.getBlockNumber();
            const startBlock = DEPLOYMENT_BLOCKS[networkKey] || BigInt(0);
            const maxBlockRange = BigInt(49999);
            let allEvents: any[] = [];

            let fromBlock = startBlock;
            while (fromBlock <= currentBlock) {
                const toBlock = fromBlock + maxBlockRange > currentBlock ? currentBlock : fromBlock + maxBlockRange;

                console.log(`Fetching blocks ${fromBlock} to ${toBlock}`);

                if (merchantAddress) {
                    const [receiverEvents, buyerEvents] = await Promise.all([
                        this.publicClient.getLogs({
                            address: getCurrentContractAddress() as `0x${string}`,
                            event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                            args: { receiver: merchantAddress } as any,
                            fromBlock,
                            toBlock
                        }),
                        this.publicClient.getLogs({
                            address: getCurrentContractAddress() as `0x${string}`,
                            event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                            args: { buyer: merchantAddress } as any,
                            fromBlock,
                            toBlock
                        })
                    ]);
                    allEvents = [...allEvents, ...receiverEvents, ...buyerEvents];
                } else {
                    const purchaseEvents = await this.publicClient.getLogs({
                        address: getCurrentContractAddress() as `0x${string}`,
                        event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                        fromBlock,
                        toBlock
                    });
                    allEvents = [...allEvents, ...purchaseEvents];
                }
            }

            console.log("Total events found:", allEvents.length);

            // Deduplicate events based on transaction hash and log index
            const uniqueEvents = Array.from(new Map(allEvents.map(event => 
                [`${event.transactionHash}-${event.logIndex}`, event]
            )).values());

            const formattedEvents: TransactionEvent[] = uniqueEvents.map(event => {
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
                    amountSC: formatUnits(BigInt(amountSCHex), 6),
                    amountBC: formatUnits(BigInt(amountBCHex), 18),
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash,
                    chainId: network.chainId,
                    networkName: network.name
                };
            });
        } catch (err) {
            console.error(`Error fetching events from ${networkKey}:`, err);
            return [];
        }
    }

    async fetchStableCoinPurchases(merchantAddress?: string): Promise<TransactionEvent[]> {
        try {
            const [sepoliaEvents, etcEvents, mordorEvents] = await Promise.all([
                this.fetchEventsFromNetwork(
                    this.sepoliaClient,
                    CONTRACTS.stablepay.address,
                    'sepolia',
                    merchantAddress
                ),
                this.fetchEventsFromNetwork(
                    this.etcClient,
                    CONTRACTS['stablepay-etc'].address,
                    'ethereum-classic',
                    merchantAddress
                ),
                this.fetchEventsFromNetwork(
                    this.mordorClient,
                    CONTRACTS['stablepay-mordor'].address,
                    'mordor',
                    merchantAddress
                )
            ]);

            const allEvents = [...sepoliaEvents, ...etcEvents, ...mordorEvents];
            console.log(`Total events found: ${allEvents.length} (Sepolia: ${sepoliaEvents.length}, ETC: ${etcEvents.length}, Mordor: ${mordorEvents.length})`);

            return allEvents;
        } catch (err) {
            console.error("Error fetching events:", err);
            console.log("Error message:", err instanceof Error ? err.message : String(err));
            throw err;
        }
    }
}

// Export singleton instance
export const transactionService = new TransactionService();