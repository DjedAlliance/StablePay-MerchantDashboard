import { createPublicClient, http, formatUnits, defineChain, type PublicClient } from 'viem';
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

export interface NetworkCursorResult {
    cursor: string;   // block number as string; '0' means fully scanned
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

const STABLEPAY_EVENT = parseAbiItem(
    'event BoughtStableCoins(address indexed buyer, address indexed receiver, uint256 amountSC, uint256 amountBC)'
);

export class TransactionService {
    private sepoliaClient: PublicClient;
    private etcClient: PublicClient;
    private mordorClient: PublicClient;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRawEvent(event: any, network: { chainId: number; name: string }): TransactionEvent {
        const rawData = event.data.slice(2);
        const amountSCHex = '0x' + rawData.slice(0, 64);
        const amountBCHex = '0x' + rawData.slice(64);

        return {
            buyer: this.formatAddress(event.topics[1]),
            receiver: this.formatAddress(event.topics[2]),
            amountSC: formatUnits(BigInt(amountSCHex), 6),
            amountBC: formatUnits(BigInt(amountBCHex), 18),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            chainId: network.chainId,
            networkName: network.name,
        };
    }

    private getClientByChainId(chainId: number): PublicClient | null {
        switch (chainId) {
            case 11155111: return this.sepoliaClient;   // Sepolia
            case 61:       return this.etcClient;        // ETC Mainnet
            case 63:       return this.mordorClient;     // Mordor Testnet
            default:       return null;
        }
    }

    private async fetchEventsFromNetwork(
        client: PublicClient,
        contractAddress: string,
        networkKey: string,
        merchantAddress?: string
    ): Promise<TransactionEvent[]> {
        try {
            const currentBlock = await client.getBlockNumber();
            const startBlock = DEPLOYMENT_BLOCKS[networkKey] || BigInt(0);
            const maxBlockRange = BigInt(49999);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let allEvents: any[] = [];

            let fromBlock = startBlock;
            while (fromBlock <= currentBlock) {
                const toBlock = fromBlock + maxBlockRange > currentBlock ? currentBlock : fromBlock + maxBlockRange;

                const purchaseEvents = await client.getLogs({
                    address: contractAddress as `0x${string}`,
                    event: STABLEPAY_EVENT,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    args: merchantAddress ? { receiver: merchantAddress } as any : undefined,
                    fromBlock,
                    toBlock
                });
                allEvents = [...allEvents, ...purchaseEvents];
                
                fromBlock = toBlock + BigInt(1);
            }

            const network = NETWORKS[networkKey];
            return allEvents.map(event => this.mapRawEvent(event, network));
        } catch (err) {
            console.error(`Error fetching events from ${networkKey}:`, err);
            return [];
        }
    }

    /**
     * Fetch events from a single network in reverse block order (newest first).
     * Calls `onChunk` with each batch of events as they arrive.
     * Respects `AbortSignal` to stop early (e.g. when event cap is reached).
     *
     * @param resumeFromBlock - If provided, start scanning from this block downward
     *   (exclusive upper bound for resume). Used by "Fetch More".
     */
    private async fetchEventsFromNetworkReverse(
        client: PublicClient,
        contractAddress: string,
        networkKey: string,
        merchantAddress: string | undefined,
        onChunk: (events: TransactionEvent[]) => void,
        options?: {
            signal?: AbortSignal;
            resumeFromBlock?: bigint;
        }
    ): Promise<NetworkCursorResult> {
        const deploymentBlock = DEPLOYMENT_BLOCKS[networkKey] || BigInt(0);
        const maxBlockRange = BigInt(49999);
        const network = NETWORKS[networkKey];
        let toBlock = BigInt(0);

        try {
            toBlock = options?.resumeFromBlock ?? await client.getBlockNumber();

            while (toBlock >= deploymentBlock) {
                if (options?.signal?.aborted) {
                    return { cursor: toBlock.toString(), hasMore: true };
                }

                const fromBlock = toBlock - maxBlockRange < deploymentBlock
                    ? deploymentBlock
                    : toBlock - maxBlockRange;

                const purchaseEvents = await client.getLogs({
                    address: contractAddress as `0x${string}`,
                    event: STABLEPAY_EVENT,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    args: merchantAddress ? { receiver: merchantAddress } as any : undefined,
                    fromBlock,
                    toBlock,
                });

                if (purchaseEvents.length > 0) {
                    // Logs from getLogs are ascending (oldest first). For "newest first", we reverse them.
                    const events = purchaseEvents
                        .map(event => this.mapRawEvent(event, network))
                        .reverse();
                    onChunk(events);
                }

                const nextToBlock = fromBlock - BigInt(1);
                if (nextToBlock < deploymentBlock) {
                    // Fully scanned this network
                    return { cursor: '0', hasMore: false };
                }
                toBlock = nextToBlock;
            }

            return { cursor: '0', hasMore: false };
        } catch (err) {
            // If aborted mid-RPC-call, return cursor so "Fetch More" can resume
            if (options?.signal?.aborted) {
                return { cursor: toBlock.toString(), hasMore: true };
            }
            console.error(`Error fetching events from ${networkKey}:`, err);
            return { cursor: toBlock.toString(), hasMore: true };
        }
    }

    /**
     * Fetch block timestamps for a list of transaction events.
     * Groups by (chainId, blockNumber) to minimize RPC calls — each unique block
     * is fetched only once even if multiple transactions share it.
     */
    async fetchTimestampsForEvents(events: TransactionEvent[]): Promise<TransactionEvent[]> {
        // Group unique blocks by chainId
        const blocksByChain = new Map<number, Set<string>>();
        for (const event of events) {
            if (event.timestamp) continue; // Already has timestamp
            const chainId = event.chainId;
            if (!blocksByChain.has(chainId)) {
                blocksByChain.set(chainId, new Set());
            }
            blocksByChain.get(chainId)!.add(event.blockNumber.toString());
        }

        // Fetch block timestamps keyed by "chainId-blockNumber"
        const timestampMap = new Map<string, Date>();

        for (const [chainId, blockNumbers] of blocksByChain) {
            const client = this.getClientByChainId(chainId);
            if (!client) continue;

            // Fetch blocks in parallel per chain (bounded concurrency)
            const blocks = Array.from(blockNumbers);
            const batchSize = 10;
            for (let i = 0; i < blocks.length; i += batchSize) {
                const batch = blocks.slice(i, i + batchSize);
                const results = await Promise.all(
                    batch.map(async (blockNumStr) => {
                        try {
                            const block = await client.getBlock({ blockNumber: BigInt(blockNumStr) });
                            return { blockNumStr, timestamp: Number(block.timestamp) };
                        } catch (err) {
                            console.warn(`Failed to fetch block ${blockNumStr} on chain ${chainId}:`, err);
                            return null;
                        }
                    })
                );
                for (const result of results) {
                    if (result) {
                        const key = `${chainId}-${result.blockNumStr}`;
                        timestampMap.set(key, new Date(result.timestamp * 1000));
                    }
                }
            }
        }

        // Assign timestamps to events
        return events.map(event => {
            if (event.timestamp) return event;
            const key = `${event.chainId}-${event.blockNumber.toString()}`;
            const ts = timestampMap.get(key);
            return ts ? { ...event, timestamp: ts } : event;
        });
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

    /**
     * Progressively fetch events from all networks (newest first).
     * Calls `onChunk` as events arrive from each network.
     * All 3 networks are scanned in parallel for speed.
     *
     * @param merchantAddress - Filter events by merchant/receiver address
     * @param onChunk - Called with each batch of events as they arrive
     * @param options.signal - AbortSignal to cancel the fetch (e.g. when cap is reached)
     * @param options.cursors - Resume cursors from a previous fetch (from "Fetch More")
     * @returns Per-network cursor results for resuming later
     */
    async fetchStableCoinPurchasesProgressive(
        merchantAddress: string | undefined,
        onChunk: (events: TransactionEvent[]) => void,
        options?: {
            signal?: AbortSignal;
            cursors?: Record<string, string>;
        }
    ): Promise<Record<string, NetworkCursorResult>> {
        const networkConfigs = [
            { client: this.sepoliaClient, contract: CONTRACTS.stablepay.address, key: 'sepolia' },
            { client: this.etcClient, contract: CONTRACTS['stablepay-etc'].address, key: 'ethereum-classic' },
            { client: this.mordorClient, contract: CONTRACTS['stablepay-mordor'].address, key: 'mordor' },
        ];

        const results = await Promise.all(
            networkConfigs.map(async ({ client, contract, key }) => {
                // Skip networks that are already fully scanned
                const cursorStr = options?.cursors?.[key];
                if (cursorStr === '0') {
                    return { key, cursor: '0', hasMore: false };
                }

                const resumeFromBlock = cursorStr ? BigInt(cursorStr) : undefined;

                const result = await this.fetchEventsFromNetworkReverse(
                    client,
                    contract,
                    key,
                    merchantAddress,
                    onChunk,
                    { signal: options?.signal, resumeFromBlock }
                );

                return { key, ...result };
            })
        );

        const resultMap: Record<string, NetworkCursorResult> = {};
        for (const r of results) {
            resultMap[r.key] = { cursor: r.cursor, hasMore: r.hasMore };
        }
        return resultMap;
    }
}

// Export singleton instance
export const transactionService = new TransactionService();