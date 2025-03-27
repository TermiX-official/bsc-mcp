
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bsc } from "viem/chains";
import {
    createWalletClient,
    http,
    parseUnits,
    type Hex,
    publicActions,
    Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { addLiquidityV3 } from "../functions/pancakeAddLiquidityTool.js";
import { CurrencyAmount, } from "@pancakeswap/sdk";
import {
    FeeAmount
} from '@pancakeswap/v3-sdk';
import { getToken } from "../functions/pancakeSwapTool.js";

export function registerPancakeAddLiquidity(server: McpServer) {

    server.tool(
        "pancakeAddLiquidity",
        "add liquidity to pancake",
        {
            token0: z.string(),
            token1: z.string(),
            token0Amount: z.string(),
            token1Amount: z.string(),
        },
        async ({ token0, token1, token0Amount, token1Amount }) => {

            try {
                const account = privateKeyToAccount(
                  process.env.BSC_WALLET_PRIVATE_KEY as `0x${string}`
                );
                const rpcUrl = process.env.BSC_RPC_URL as string || "";
                const client = createWalletClient({
                    account: account,
                    chain: bsc,
                    transport: http(rpcUrl)
                }).extend(publicActions);
            
                // Define tokens
                const tokenA = await getToken(token0);
                const tokenB = await getToken(token1);
            
                // Amounts to add
                const amountTokenA = CurrencyAmount.fromRawAmount(tokenA, parseUnits(token0Amount, tokenA.decimals).toString());
                const amountTokenB = CurrencyAmount.fromRawAmount(tokenB, parseUnits(token1Amount, tokenB.decimals).toString());
            
                const hash = await addLiquidityV3(
                    client,
                    tokenA,
                    tokenB,
                    FeeAmount.MEDIUM, // 0.3%
                    amountTokenA,
                    amountTokenB,
                    client.account?.address as Address
                );

                return {
                    content: [
                        {
                            type: "text",
                            text: `Create token successfully. https://bscscan.com/tx/${hash}`,
                            url: `https://bscscan.com/tx/${hash}`,
                        },
                    ],
                };
            } catch (error) {
                console.error("add liquidity to pancake failed:", error);
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Transaction failed: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}