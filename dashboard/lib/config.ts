// Blockchain configuration for multiple networks and contracts
export interface NetworkConfig {
    name: string;
    rpcUrl: string;
    chainId: number;
    explorerUrl?: string;
}

export interface ContractConfig {
    address: string;
    name: string;
    network: string;
    abi?: any[];
}

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
    ethereum: {
        name: "Ethereum Mainnet",
        rpcUrl: "https://ethereum.publicnode.com",
        chainId: 1,
        explorerUrl: "https://etherscan.io"
    },
    sepolia: {
        name: "Ethereum Sepolia",
        rpcUrl: "https://ethereum-sepolia.publicnode.com",
        chainId: 11155111,
        explorerUrl: "https://sepolia.etherscan.io"
    },
    polygon: {
        name: "Polygon Mainnet",
        rpcUrl: "https://polygon.publicnode.com",
        chainId: 137,
        explorerUrl: "https://polygonscan.com"
    },
    polygonMumbai: {
        name: "Polygon Mumbai",
        rpcUrl: "https://polygon-mumbai.publicnode.com",
        chainId: 80001,
        explorerUrl: "https://mumbai.polygonscan.com"
    },
    "ethereum-classic": {
        name: "Ethereum Classic",
        rpcUrl: "https://etc.rivet.link",
        chainId: 61,
        explorerUrl: "https://blockscout.com/etc/mainnet"
    },
    mordor: {
        name: "Mordor Testnet",
        rpcUrl: "https://rpc.mordor.etccooperative.org",
        chainId: 63,
        explorerUrl: "https://blockscout.com/etc/mordor"
    }
};

// Contract configurations
export const CONTRACTS: Record<string, ContractConfig> = {
    stablepay: {
        address: "0x624FcD0a1F9B5820c950FefD48087531d38387f4",
        name: "StablePay",
        network: "sepolia"
    },
    "stablepay-etc": {
        address: "0xCc3664d7021FD36B1Fe2b136e2324710c8442cCf",
        name: "StablePay",
        network: "ethereum-classic"
    },
    "stablepay-mordor": {
        address: "0xD4548F4b6d08852B56cdabC6be7Fd90953179d68",
        name: "StablePay",
        network: "mordor"
    }
};

// Deployment block numbers for event fetching
export const DEPLOYMENT_BLOCKS: Record<string, bigint> = {
    sepolia: BigInt(6000000),
    "ethereum-classic": BigInt(20410397),
    mordor: BigInt(11501796)
};

// Get current network configuration
export function getCurrentNetwork(): NetworkConfig {
    return NETWORKS.sepolia; // Default to Sepolia
}

// Get current contract configuration
export function getCurrentContract(): ContractConfig {
    return CONTRACTS.stablepay; // Default to StablePay on Sepolia
}

// Get RPC URL for current network
export function getCurrentRpcUrl(): string {
    return getCurrentNetwork().rpcUrl;
}

// Get contract address for current network
export function getCurrentContractAddress(): string {
    return getCurrentContract().address;
}



