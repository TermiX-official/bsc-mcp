
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bsc } from "viem/chains";
import {
    createWalletClient,
    http,
    publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { myPosition } from "../functions/pancakeSwapPosition.js";
import { bigIntReplacer } from "../util.js";

export function registerPancakeMyPosition(server: McpServer) {

    server.tool(
        "pancakeMyPosition",
        "check my liquidity position on panceke",
        {
        },
        async ({}) => {

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
            
                const positions = await myPosition(client);
                return {
                    content: [
                        {
                            type: "text",
                            text: `get user potitions successfully. ${JSON.stringify(positions, bigIntReplacer)}`
                        },
                    ],
                };
            } catch (error) {
                console.error("get user potitions failed:", error);
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