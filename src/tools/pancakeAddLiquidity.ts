
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    parseUnits,
} from "viem";
import { addLiquidityV3 } from "../functions/pancakeAddLiquidityTool.js";
import { CurrencyAmount, } from "@pancakeswap/sdk";
import {
    FeeAmount
} from '@pancakeswap/v3-sdk';
import { getToken } from "../functions/pancakeSwapTool.js";
import { getAccount, } from "../config.js";

export function registerPancakeAddLiquidity(server: McpServer) {

    server.tool("Add_PancakeSwap_Liquidity", "💧Provide liquidity to PancakeSwap trading pairs", {
            token0: z.string(),
            token1: z.string(),
            token0Amount: z.string(),
            token1Amount: z.string(),
        },
        async ({ token0, token1, token0Amount, token1Amount }) => {

            try {
            
                // Define tokens
                const tokenA = await getToken(token0);
                const tokenB = await getToken(token1);
            
                // Amounts to add
                const amountTokenA = CurrencyAmount.fromRawAmount(tokenA, parseUnits(token0Amount, tokenA.decimals).toString());
                const amountTokenB = CurrencyAmount.fromRawAmount(tokenB, parseUnits(token1Amount, tokenB.decimals).toString());
            
                const account = await getAccount();

                const hash = await addLiquidityV3(
                    tokenA,
                    tokenB,
                    FeeAmount.MEDIUM, // 0.3%
                    amountTokenA,
                    amountTokenB,
                    account,
                );

                return {
                    content: [
                        {
                            type: "text",
                            text: `add liquidity to pancake successfully. https://bscscan.com/tx/${hash}`,
                            url: `https://bscscan.com/tx/${hash}`,
                        },
                    ],
                };
            } catch (error) {
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