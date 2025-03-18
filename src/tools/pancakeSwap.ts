import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pancakeSwap } from "../functions/pancakeSwapTool.js";

export function registerPancakeSwap(server: McpServer) {
  server.tool(
    "pancakeSwap",
    "Swap tokens in BSC chain via PancakeSwap",
    {
      inputToken: z.string(),
      outputToken: z.string(),
      amount: z.string(),
    },
    async ({ inputToken, outputToken, amount }) => {
      try {
        const txHash = await pancakeSwap({
          inputToken,
          outputToken,
          amount,
        });
        const txUrl = `https://bscscan.com/tx/${txHash}`;
        return {
          content: [
            {
              type: "text",
              text: `PancakeSwap transaction sent successfully. Hash: ${txHash}`,
              hash: txHash,
              url: txUrl,
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
              text: `PancakeSwap transaction failed: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
