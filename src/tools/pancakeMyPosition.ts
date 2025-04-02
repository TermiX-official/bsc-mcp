
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { myPosition } from "../functions/pancakeSwapPosition.js";
import { bigIntReplacer } from "../util.js";
import { getAccount } from "../config.js";

export function registerPancakeMyPosition(server: McpServer) {

    server.tool(
        "pancakeMyPosition",
        "check my liquidity position on panceke",
        {
        },
        async ({}) => {

            try {
            
                const account = await getAccount();
                const positions = await myPosition(account.address);
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