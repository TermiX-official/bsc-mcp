import {
  http,
  getContract,
  isAddress,
  createPublicClient,
  type Address,
} from "viem";
import { bsc } from "viem/chains";

//  BEP-20ABI - minimal version with just the transfer function
export const bep20abi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

// Token cache to avoid repeated API calls
const pancakeswapTokensCache: {
  lastFetchTime: number;
  tokens: Array<{
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
  }>;
} = {
  lastFetchTime: 0,
  tokens: [],
};

/**
 * Fetch tokens from PancakeSwap token list
 * @returns Array of token data
 */
export async function fetchPancakeswapTokens() {
  // Use cached data if it's less than 5 minutes old
  const now = Math.floor(Date.now() / 1000);
  if (
    pancakeswapTokensCache.lastFetchTime > now - 300 &&
    pancakeswapTokensCache.tokens.length > 0
  ) {
    return pancakeswapTokensCache.tokens;
  }

  try {
    // Fetch token list from PancakeSwap
    const response = await fetch(
      "https://tokens.pancakeswap.finance/pancakeswap-extended.json"
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch token list: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data || !data.tokens || !Array.isArray(data.tokens)) {
      throw new Error("Invalid token list format");
    }

    // Update cache
    pancakeswapTokensCache.tokens = data.tokens;
    pancakeswapTokensCache.lastFetchTime = now;

    console.log(`Fetched ${data.tokens.length} tokens from PancakeSwap`);
    return data.tokens;
  } catch (error) {
    console.error("Error fetching PancakeSwap tokens:", error);
    // Return empty array if fetch fails
    return [];
  }
}

interface TokenInfo {
  address: Address;
  decimals: number;
  symbol?: string;
  name?: string;
}

/**
 * Get token address and information from symbol or address
 * @param chainId - Chain ID (e.g., 56 for BSC)
 * @param token - Token symbol or address
 * @param rpcUrl - RPC URL for the chain
 * @returns TokenInfo object with address and decimals
 */
export async function getEVMTokenAddress(
  chainId: number,
  token: string,
  rpcUrl: string = "https://bsc-dataseed.binance.org"
): Promise<TokenInfo> {
  // Check if the input is an address
  if (isAddress(token)) {
    // If it's an address, first try to find it in the PancakeSwap token list
    try {
      const tokenList = await fetchPancakeswapTokens();
      const foundToken = tokenList.find(
        (t: { chainId: number; address: string }) =>
          t.chainId === chainId &&
          t.address.toLowerCase() === token.toLowerCase()
      );

      if (foundToken) {
        return {
          address: foundToken.address as Address,
          decimals: foundToken.decimals,
          symbol: foundToken.symbol,
          name: foundToken.name,
        };
      }
    } catch (error) {
      console.warn("Error searching PancakeSwap token list:", error);
      // Continue to on-chain lookup if PancakeSwap lookup fails
    }

    // If not found in token list, fetch token info directly from the blockchain
    const publicClient = createPublicClient({
      chain: bsc, // This should ideally be dynamic based on chainId
      transport: http(rpcUrl),
    });

    const contract = getContract({
      address: token as Address,
      abi: bep20abi,
      client: {
        public: publicClient,
      },
    });

    try {
      // Get token details from the contract
      const decimals = await contract.read.decimals();
      const symbol = await contract.read.symbol();
      const name = await contract.read.name();

      return {
        address: token as Address,
        decimals,
        symbol,
        name,
      };
    } catch (error) {
      console.error("Error fetching token info from contract:", error);
      throw new Error(`Could not fetch info for token at address ${token}`);
    }
  } else {
    // If it's a symbol, try to find it in the PancakeSwap token list
    try {
      const tokenList = await fetchPancakeswapTokens();
      const uppercaseSymbol = token.toUpperCase();
      const foundToken = tokenList.find(
        (t: { chainId: number; symbol: string }) =>
          t.chainId === chainId && t.symbol.toUpperCase() === uppercaseSymbol
      );

      if (foundToken) {
        return {
          address: foundToken.address as Address,
          decimals: foundToken.decimals,
          symbol: foundToken.symbol,
          name: foundToken.name,
        };
      }
    } catch (error) {
      console.error("Error searching PancakeSwap token list:", error);
    }

    // If not found, throw an error
    throw new Error(
      `Token with symbol ${token} not found in PancakeSwap token list.`
    );
  }
}
