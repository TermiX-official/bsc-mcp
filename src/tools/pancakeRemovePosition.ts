
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bsc } from "viem/chains";
import {
    createWalletClient,
    http,
    publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { removeLiquidityV3 } from "../functions/pancakeRemoveLiquidityTool.js";

export function registerPancakeRemovePosition(server: McpServer) {

    server.tool(
        "pancakeRemovePosition",
        "remove liquidity position on panceke",
        {
            positionId: z.string(),
            percent: z.number().max(100).min(1),
        },
        async ({ positionId, percent }) => {

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

                const hash = await removeLiquidityV3(client, BigInt(positionId), percent);
                return {
                    content: [
                        {
                            type: "text",
                            text: `remove liquidity position on panceke successfully. https://bscscan.com/tx/${hash}`,
                            url: `https://bscscan.com/tx/${hash}`,
                        },
                    ],
                };
            } catch (error) {
                console.error("remove liquidity position on panceke failed:", error);
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