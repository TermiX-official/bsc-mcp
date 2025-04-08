import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pancakeSwap } from "../functions/pancakeSwapTool.js";
import { getAccount, publicClient } from "../config.js";

export function registerPancakeSwap(server: McpServer) {
  server.tool("PancakeSwap_Token_Exchange", "💱Exchange tokens on BNBChain using PancakeSwap DEX", {
      inputToken: z.string(),
      outputToken: z.string(),
      amount: z.string(),
    },
    async ({ inputToken, outputToken, amount }) => {
      try {
        const account = await getAccount();
        const txHash = await pancakeSwap({
          account,
          inputToken,
          outputToken,
          amount,
        });
        const txUrl = `https://bscscan.com/tx/${txHash}`;
        
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
          retryCount: 300,
          retryDelay: 100,
      });


        let status = "successfully";
        if (txReceipt.status !== "success") {
          status = "error"
        } 
        return {
          content: [
            {
              type: "text",
              text: `PancakeSwap transaction sent ${status}. ${txUrl}`,
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
