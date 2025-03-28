import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseEther } from "viem";
import { client } from "../config.js";

export function registerTransferNativeToken(server: McpServer) {
  server.tool(
    "transferNativeToken",
    "Transfer native token (BNB)",
    {
      recipientAddress: z.string(),
      amount: z.string(),
    },
    async ({ recipientAddress, amount }) => {
      try {

        const hash = await client.sendTransaction({
          to: recipientAddress as `0x${string}`,
          value: parseEther(amount),
        });

        return {
          content: [
            {
              type: "text",
              text: `Transaction sent successfully. https://bscscan.com/tx/${hash}`,
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
