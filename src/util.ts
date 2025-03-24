import { type Hex } from "viem";

import { Native, ERC20Token } from "@pancakeswap/sdk";

/**
 * Cache for PancakeSwap token list data
 */
const pancakeswapTokensCache: {
  tokens: any[];
  lastFetchTime: number;
} = {
  tokens: [],
  lastFetchTime: 0,
};

/**
 * Fetch tokens from PancakeSwap token list
 * @returns Array of token data
 */
export async function fetchPancakeswapTokens() {
  const now = Math.floor(Date.now() / 1000);
  if (
    pancakeswapTokensCache.lastFetchTime > now - 300 &&
    pancakeswapTokensCache.tokens.length > 0
  ) {
    return pancakeswapTokensCache.tokens;
  }

  try {
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

    pancakeswapTokensCache.tokens = data.tokens;
    pancakeswapTokensCache.lastFetchTime = now;
    return data.tokens;
  } catch (error) {
    console.error("Error fetching PancakeSwap tokens:", error);
    return [];
  }
}

/**
 * Resolve a token input into a currency object.
 * If the token string is "BNB" (native) or a valid address, it is handled directly.
 * Otherwise it is treated as a token symbol or name and looked up from the PancakeSwap token list.
 * @param token - The token input (address, symbol or name)
 * @param defaultChainId - The default chain id to use (e.g. 56 for BSC)
 */
export async function resolveCurrency(
  token: string,
  defaultChainId: number
): Promise<{ currency: any; chainId: number }> {
  if (token.toUpperCase() === "BNB") {
    return {
      currency: Native.onChain(defaultChainId),
      chainId: defaultChainId,
    };
  }
  // If token looks like an address (starts with "0x" and is 42 characters long)
  if (token.startsWith("0x") && token.length === 42) {
    return {
      currency: new ERC20Token(defaultChainId, token as Hex, 18, ""),
      chainId: defaultChainId,
    };
  }
  // Otherwise, assume token is a name or symbol.
  const tokens = await fetchPancakeswapTokens();
  const tokenData = tokens.find(
    (t: any) =>
      t.symbol.toLowerCase() === token.toLowerCase() ||
      t.name.toLowerCase() === token.toLowerCase()
  );
  if (!tokenData) {
    throw new Error(`Token ${token} not found in PancakeSwap token list`);
  }
  return {
    currency: new ERC20Token(
      tokenData.chainId,
      tokenData.address as Hex,
      tokenData.decimals,
      tokenData.symbol
    ),
    chainId: tokenData.chainId,
  };
}


export function bigIntReplacer(key: string, value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
}