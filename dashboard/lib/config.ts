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
    }
};

// Contract configurations
export const CONTRACTS: Record<string, ContractConfig> = {
    stablepay: {
        address: "0x624FcD0a1F9B5820c950FefD48087531d38387f4",
        name: "StablePay",
        network: "sepolia"
    },
    // Add more contracts as needed
    // stablepayMainnet: {
    //   address: "0x...",
    //   name: "StablePay Mainnet",
    //   network: "ethereum"
    // }
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



