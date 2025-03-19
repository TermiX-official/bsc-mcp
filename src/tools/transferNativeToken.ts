import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createWalletClient, http, parseEther } from "viem";
import { bsc } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

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
        const account = privateKeyToAccount(
          process.env.WALLET_PRIVATE_KEY as `0x${string}`
        );

        const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
        const client = createWalletClient({
          account,
          chain: bsc,
          transport: http(rpcUrl),
        });

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
