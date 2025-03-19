import {
  Address,
  createPublicClient,
  getContract,
  http,
  isAddress,
} from "viem";
import { TokenInfo } from "../types/types.js";
import { fetchPancakeswapTokens } from "../util.js";
import { bsc } from "viem/chains";
import { bep20abi } from "../lib/bep20Abi.js";


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
  rpcUrl: string = (process.env.BSC_RPC_URL as string) || "https://bsc-dataseed.binance.org"
): Promise<TokenInfo> {
  if (isAddress(token)) {
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
    }

    const publicClient = createPublicClient({
      chain: bsc,
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
    throw new Error(
      `Token with symbol ${token} not found in PancakeSwap token list.`
    );
  }
}
