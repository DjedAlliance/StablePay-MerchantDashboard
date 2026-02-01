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

export type Cursors = Record<string, bigint>;

export interface FetchState {
    cursors: Cursors;
    buffers: Record<string, TransactionEvent[]>;
    hasMore: boolean;
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

    private async getBlockTimestamp(client: any, blockNumber: bigint): Promise<Date> {
        try {
            const block = await client.getBlock({ blockNumber });
            return new Date(Number(block.timestamp) * 1000);
        } catch (error) {
            console.error(`Error fetching timestamp for block ${blockNumber}`, error);
            return new Date();
        }
    }

    // Fetch events scanning backwards from `fromBlock`
    private async fetchBatchEvents(
        client: any,
        contractAddress: string,
        networkKey: string,
        fromBlock: bigint,
        deploymentBlock: bigint,
        minCount: number,
        merchantAddress?: string
    ): Promise<{ events: TransactionEvent[], nextCursor: bigint | null }> {
        const CHUNK_SIZE = BigInt(50000); // Increased chunk size
        let currentEnd = fromBlock;
        let collectedEvents: any[] = [];
        let iterations = 0;
        const MAX_ITERATIONS = 20; // Increased iterations to scan deeper

        try {
            while (collectedEvents.length < minCount && currentEnd >= deploymentBlock && iterations < MAX_ITERATIONS) {
                let currentStart = currentEnd - CHUNK_SIZE;
                if (currentStart < deploymentBlock) currentStart = deploymentBlock;

                try {
                    const events = await client.getLogs({
                        address: contractAddress as `0x${string}`,
                        event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                        args: merchantAddress ? {
                            receiver: merchantAddress
                        } as any : undefined,
                        fromBlock: currentStart,
                        toBlock: currentEnd
                    });

                    // Events are returned in ascending order (oldest first). 
                    // We want to accumulate them. Since we process chunks backwards (Newest Chunk -> Oldest Chunk),
                    // and inside a chunk we want Newest -> Oldest, we reverse the chunk events.
                    // And we append them to the end of our growing list (which is Newest Blocks -> Oldest Blocks).
                    collectedEvents = [...collectedEvents, ...events.reverse()];
                } catch (e) {
                    console.warn(`Failed to fetch logs for ${networkKey} range ${currentStart}-${currentEnd}`, e);
                }
                
                if (currentStart === deploymentBlock) {
                    currentEnd = BigInt(-1); // Signal end of chain
                    break;
                }

                currentEnd = currentStart - BigInt(1);
                iterations++;
            }
        } catch (err) {
            console.error(`Error fetching batch from ${networkKey}:`, err);
        }

        const network = NETWORKS[networkKey];
        const formattedEvents: TransactionEvent[] = await Promise.all(collectedEvents.map(async (event) => {
            const rawData = event.data.slice(2);
            const amountSCHex = '0x' + rawData.slice(0, 64);
            const amountBCHex = '0x' + rawData.slice(64);
            // Fetch timestamp (optimized: could batch this)
            const timestamp = await this.getBlockTimestamp(client, event.blockNumber);

            return {
                buyer: this.formatAddress(event.topics[1]),
                receiver: this.formatAddress(event.topics[2]),
                amountSC: formatUnits(BigInt(amountSCHex), 6),
                amountBC: formatUnits(BigInt(amountBCHex), 18),
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                chainId: network.chainId,
                networkName: network.name,
                timestamp
            };
        }));

        // If we exhausted the chain (currentEnd == -1) return null cursor for this chain (unless we still have a valid block to start next time? No, -1 means done)
        const nextCursor = currentEnd < deploymentBlock ? (formattedEvents.length > 0 ? deploymentBlock - BigInt(1) : null) : currentEnd;

        return {
            events: formattedEvents,
            nextCursor: nextCursor !== null && nextCursor < deploymentBlock ? null : nextCursor
        };
    }

    async fetchTransactions({
        limit = 25,
        state,
        merchantAddress
    }: {
        limit?: number,
        state?: FetchState,
        merchantAddress?: string
    }): Promise<{ events: TransactionEvent[], nextState: FetchState }> {
        // Initialize state if not provided
        let cursors = state?.cursors;
        let buffers = state?.buffers || { sepolia: [], 'ethereum-classic': [], mordor: [] };
        
        if (!cursors) {
            // Initial load of latest blocks
            try {
                const [sepoliaBlock, etcBlock, mordorBlock] = await Promise.all([
                    this.sepoliaClient.getBlockNumber(),
                    this.etcClient.getBlockNumber(),
                    this.mordorClient.getBlockNumber()
                ]);
                cursors = {
                    sepolia: sepoliaBlock,
                    'ethereum-classic': etcBlock,
                    mordor: mordorBlock
                };
            } catch (err) {
                console.error("Failed to fetch initial block numbers", err);
                throw err;
            }
        }

        // Fill buffers if they are low
        // We want to ensure we have enough events to pick top 'limit'
        // Strategy: Try to fetch 'limit' events from each chain if buffer is empty
        
        const networks = [
            { key: 'sepolia', client: this.sepoliaClient, contract: CONTRACTS.stablepay.address },
            { key: 'ethereum-classic', client: this.etcClient, contract: CONTRACTS['stablepay-etc'].address },
            { key: 'mordor', client: this.mordorClient, contract: CONTRACTS['stablepay-mordor'].address }
        ];

        for (const net of networks) {
            const cursor = cursors[net.key];
            // Check if cursor is valid and not marked as finished (-1)
            if (cursor !== undefined && cursor !== BigInt(-1) && buffers[net.key].length < limit) {
                const fetchResult = await this.fetchBatchEvents(
                    net.client,
                    net.contract,
                    net.key,
                    BigInt(cursor),
                    // @ts-ignore
                    DEPLOYMENT_BLOCKS[net.key],
                    limit, 
                    merchantAddress
                );
                
                buffers[net.key] = [...buffers[net.key], ...fetchResult.events];
                
                if (fetchResult.nextCursor !== null) {
                    cursors[net.key] = fetchResult.nextCursor;
                    // If nextCursor is less than deployment block, we are done
                    // @ts-ignore
                    if (fetchResult.nextCursor < DEPLOYMENT_BLOCKS[net.key]) {
                        cursors[net.key] = BigInt(-1);
                    }
                } else {
                     cursors[net.key] = BigInt(-1);
                }
            }
        }

        // Merge all buffers
        let allCandidates: TransactionEvent[] = [];
        for (const key of Object.keys(buffers)) {
            allCandidates = [...allCandidates, ...buffers[key]];
        }

        // Sort by timestamp descending
        allCandidates.sort((a, b) => {
            const timeA = a.timestamp?.getTime() || 0;
            const timeB = b.timestamp?.getTime() || 0;
            return timeB - timeA;
        });

        // Slice top 'limit'
        // Ideally we should be careful: what if we picked an event from Sepolia (Time 100)
        // but ETC buffer was empty and we stopped scanning ETC at Time 105 (no events found)?
        // Then we might have missed an ETC event at Time 99.
        // Assuming fetchBatchEvents tries hard to find events.
        
        const resultEvents = allCandidates.slice(0, limit);
        
        // Remove used events from buffers
        // This is tricky because we merged them. We need to know which ones we took.
        // We can rebuild buffers from the remaining candidates.
        
        const remainingCandidates = allCandidates.slice(limit);
        
        // Re-bucket remaining candidates
        const nextBuffers: Record<string, TransactionEvent[]> = { sepolia: [], 'ethereum-classic': [], mordor: [] };
        for (const event of remainingCandidates) {
            const netKey = Object.keys(NETWORKS).find(k => NETWORKS[k].name === event.networkName);
            // networkName in event comes from config NETWORKS[key].name
            // We can map back or store key in event.
            // Using networkName:
            if (event.networkName === 'Ethereum Sepolia') nextBuffers.sepolia.push(event);
            else if (event.networkName === 'Ethereum Classic') nextBuffers['ethereum-classic'].push(event);
            else if (event.networkName === 'Mordor Testnet') nextBuffers.mordor.push(event);
        }

        const hasMore = Object.values(cursors).some(c => c !== BigInt(-1)) || Object.values(nextBuffers).some(b => b.length > 0);

        return {
            events: resultEvents,
            nextState: {
                cursors,
                buffers: nextBuffers,
                hasMore
            }
        };
    }

    async fetchStableCoinPurchases(merchantAddress: string): Promise<TransactionEvent[]> {
        const networks = [
            { key: 'sepolia', client: this.sepoliaClient, contract: CONTRACTS.stablepay.address },
            { key: 'ethereum-classic', client: this.etcClient, contract: CONTRACTS['stablepay-etc'].address },
            { key: 'mordor', client: this.mordorClient, contract: CONTRACTS['stablepay-mordor'].address }
        ];

        let allEvents: TransactionEvent[] = [];

        for (const net of networks) {
            try {
                // @ts-ignore
                const deploymentBlock = DEPLOYMENT_BLOCKS[net.key];
                const currentBlock = await net.client.getBlockNumber();
                const CHUNK_SIZE = BigInt(50000); 

                for (let start = deploymentBlock; start <= currentBlock; start += CHUNK_SIZE) {
                    let end = start + CHUNK_SIZE - BigInt(1);
                    if (end > currentBlock) end = currentBlock;

                    const events = await net.client.getLogs({
                        address: net.contract as `0x${string}`,
                        event: parseAbiItem('event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'),
                        args: merchantAddress ? { receiver: merchantAddress } as any : undefined,
                        fromBlock: start,
                        toBlock: end
                    });
                    
                    // @ts-ignore
                    const networkConfig = NETWORKS[net.key];
                    
                    const formatted = await Promise.all(events.map(async (e) => {
                         const rawData = e.data.slice(2);
                         const amountSCHex = '0x' + rawData.slice(0, 64);
                         const amountBCHex = '0x' + rawData.slice(64);
                         const timestamp = await this.getBlockTimestamp(net.client, e.blockNumber);
                         
                         return {
                            buyer: this.formatAddress(e.topics[1]!),
                            receiver: this.formatAddress(e.topics[2]!),
                            amountSC: formatUnits(BigInt(amountSCHex), 6),
                            amountBC: formatUnits(BigInt(amountBCHex), 18),
                            blockNumber: e.blockNumber,
                            transactionHash: e.transactionHash,
                            chainId: networkConfig.chainId,
                            networkName: networkConfig.name,
                            timestamp
                         };
                    }));
                    
                    allEvents = [...allEvents, ...formatted];
                }
            } catch (err) {
                console.error(`Error fetching for ${net.key}`, err);
            }
        }
        
        return allEvents.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    }
}

// Export singleton instance
export const transactionService = new TransactionService();