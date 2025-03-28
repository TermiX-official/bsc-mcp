
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
            
                const positions = await myPosition();
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