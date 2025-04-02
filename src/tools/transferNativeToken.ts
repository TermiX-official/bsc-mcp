import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseEther } from "viem";
import { getAccount, walletClient } from "../config.js";

export function registerTransferNativeToken(server: McpServer) {
  server.tool("Send_BNB", "💎Transfer native token (BNB), Before execution, check the wallet information first", {
      recipientAddress: z.string(),
      amount: z.string(),
    },
    async ({ recipientAddress, amount }) => {
      try {

        const account = await getAccount();
        const hash = await walletClient(account).sendTransaction({
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
