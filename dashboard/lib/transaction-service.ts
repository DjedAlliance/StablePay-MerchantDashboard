import { createPublicClient, http, fallback, formatUnits, defineChain, type PublicClient } from 'viem';
import { sepolia } from 'viem/chains';

import { NETWORKS, CONTRACTS, DEPLOYMENT_BLOCKS, PROTOCOLS, DEFAULT_PROTOCOL } from './config';
import type { NetworkConfig, Protocol, ProtocolConfig, ProtocolDeployment } from './config';
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

const TECTONIC_MINTED_EVENT = parseAbiItem(
    'event Minted(address indexed minter, address indexed receiver, uint256 amountSC, uint256 amountBC)'
);

const createTransport = (network: NetworkConfig) => {
    const fallbackUrls = network.fallbackRpcUrls ?? [];
    if (fallbackUrls.length === 0) return http(network.rpcUrl);
    return fallback([network.rpcUrl, ...fallbackUrls].map(url => http(url)));
};

export class TransactionService {
    private sepoliaClient: PublicClient;
    private etcClient: PublicClient;
    private mordorClient: PublicClient;

    constructor() {
        this.sepoliaClient = createPublicClient({
            chain: sepolia,
            transport: createTransport(NETWORKS.sepolia),
        });
        this.etcClient = createPublicClient({
            chain: etcMainnet,
            transport: createTransport(NETWORKS['ethereum-classic']),
        });
        this.mordorClient = createPublicClient({
            chain: mordor,
            transport: createTransport(NETWORKS.mordor),
        });
    }

    private formatAddress = (address: string): string => {
        const cleanAddress = address.replace('0x', '').slice(-40);
        return `0x${cleanAddress}`;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapRawEvent(event: any, network: { chainId: number; name: string }, protocolConfig: ProtocolConfig): TransactionEvent {
        const rawData = event.data.slice(2);
        const amountSCHex = '0x' + rawData.slice(0, 64);
        const amountBCHex = '0x' + rawData.slice(64);

        return {
            buyer: this.formatAddress(event.topics[1]),
            receiver: this.formatAddress(event.topics[2]),
            amountSC: formatUnits(BigInt(amountSCHex), protocolConfig.scDecimals),
            amountBC: formatUnits(BigInt(amountBCHex), protocolConfig.bcDecimals),
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

    private resolveDeployment(deployment: ProtocolDeployment): {
        client: PublicClient | null;
        contractAddress: string;
        network: NetworkConfig;
        deploymentBlock: bigint;
    } {
        const network = NETWORKS[deployment.networkKey];
        return {
            client: this.getClientByChainId(network.chainId),
            contractAddress: CONTRACTS[deployment.contractKey].address,
            network,
            deploymentBlock: DEPLOYMENT_BLOCKS[deployment.key] || BigInt(0),
        };
    }

    private getProtocolLogs(
        client: PublicClient,
        protocol: Protocol,
        contractAddress: string,
        merchantAddresses: string[] | undefined,
        fromBlock: bigint,
        toBlock: bigint
    ) {
        const address = contractAddress as `0x${string}`;
        const args = merchantAddresses && merchantAddresses.length > 0
            ? { receiver: merchantAddresses as `0x${string}`[] }
            : undefined;

        if (protocol === 'tectonic') {
            return client.getLogs({ address, event: TECTONIC_MINTED_EVENT, args, fromBlock, toBlock });
        }
        return client.getLogs({ address, event: STABLEPAY_EVENT, args, fromBlock, toBlock });
    }

    private async fetchEventsFromNetwork(
        protocol: Protocol,
        deployment: ProtocolDeployment,
        merchantAddresses?: string[]
    ): Promise<TransactionEvent[]> {
        try {
            const { client, contractAddress, network, deploymentBlock } = this.resolveDeployment(deployment);
            if (!client) return [];
            const currentBlock = await client.getBlockNumber();
            const maxBlockRange = BigInt(49999);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let allEvents: any[] = [];

            let fromBlock = deploymentBlock;
            while (fromBlock <= currentBlock) {
                const toBlock = fromBlock + maxBlockRange > currentBlock ? currentBlock : fromBlock + maxBlockRange;

                const purchaseEvents = await this.getProtocolLogs(
                    client,
                    protocol,
                    contractAddress,
                    merchantAddresses,
                    fromBlock,
                    toBlock
                );
                allEvents = [...allEvents, ...purchaseEvents];
                
                fromBlock = toBlock + BigInt(1);
            }

            return allEvents.map(event => this.mapRawEvent(event, network, PROTOCOLS[protocol]));
        } catch (err) {
            console.error(`Error fetching ${protocol} events from ${deployment.key}:`, err);
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
        protocol: Protocol,
        deployment: ProtocolDeployment,
        merchantAddresses: string[] | undefined,
        onChunk: (events: TransactionEvent[]) => void,
        options?: {
            signal?: AbortSignal;
            resumeFromBlock?: bigint;
        }
    ): Promise<NetworkCursorResult> {
        const { client, contractAddress, network, deploymentBlock } = this.resolveDeployment(deployment);
        const protocolConfig = PROTOCOLS[protocol];
        const maxBlockRange = BigInt(49999);
        let toBlock = BigInt(0);

        if (!client) {
            console.error(`No RPC client configured for ${deployment.networkKey}`);
            return { cursor: '0', hasMore: false };
        }

        try {
            toBlock = options?.resumeFromBlock ?? await client.getBlockNumber();

            while (toBlock >= deploymentBlock) {
                if (options?.signal?.aborted) {
                    return { cursor: toBlock.toString(), hasMore: true };
                }

                const fromBlock = toBlock - maxBlockRange < deploymentBlock
                    ? deploymentBlock
                    : toBlock - maxBlockRange;

                const purchaseEvents = await this.getProtocolLogs(
                    client,
                    protocol,
                    contractAddress,
                    merchantAddresses,
                    fromBlock,
                    toBlock
                );

                if (purchaseEvents.length > 0) {
                    // Logs from getLogs are ascending (oldest first). For "newest first", we reverse them.
                    const events = purchaseEvents
                        .map(event => this.mapRawEvent(event, network, protocolConfig))
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
            console.error(`Error fetching ${protocol} events from ${deployment.key}:`, err);
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

    async fetchStableCoinPurchases(merchantAddresses?: string[], protocol: Protocol = DEFAULT_PROTOCOL): Promise<TransactionEvent[]> {
        try {
            const deployments = PROTOCOLS[protocol].deployments;
            const eventsPerDeployment = await Promise.all(
                deployments.map(deployment => this.fetchEventsFromNetwork(protocol, deployment, merchantAddresses))
            );

            const allEvents = eventsPerDeployment.flat();
            const breakdown = deployments
                .map((deployment, i) => `${deployment.key}: ${eventsPerDeployment[i].length}`)
                .join(', ');
            console.log(`Total ${protocol} events found: ${allEvents.length} (${breakdown})`);

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
     * All deployments of the selected protocol are scanned in parallel for speed.
     *
     * @param protocol - Which protocol's deployments to scan (Djed or Tectonic)
     * @param merchantAddress - Filter events by merchant/receiver address
     * @param onChunk - Called with each batch of events as they arrive
     * @param options.signal - AbortSignal to cancel the fetch (e.g. when cap is reached)
     * @param options.cursors - Resume cursors from a previous fetch (from "Fetch More")
     * @returns Per-network cursor results for resuming later
     */
    async fetchStableCoinPurchasesProgressive(
        protocol: Protocol,
        merchantAddresses: string[] | undefined,
        onChunk: (events: TransactionEvent[]) => void,
        options?: {
            signal?: AbortSignal;
            cursors?: Record<string, string>;
        }
    ): Promise<Record<string, NetworkCursorResult>> {
        const results = await Promise.all(
            PROTOCOLS[protocol].deployments.map(async (deployment) => {
                const { key } = deployment;
                // Skip networks that are already fully scanned
                const cursorStr = options?.cursors?.[key];
                if (cursorStr === '0') {
                    return { key, cursor: '0', hasMore: false };
                }

                const resumeFromBlock = cursorStr ? BigInt(cursorStr) : undefined;

                const result = await this.fetchEventsFromNetworkReverse(
                    protocol,
                    deployment,
                    merchantAddresses,
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