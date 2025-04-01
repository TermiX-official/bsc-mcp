import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBalance } from "../functions/fetchBalanceTool.js";
import { account } from "../config.js";

export function registerGetWalletInfo(server: McpServer) {
  server.tool(
    "getWalletInfo",
    "Get wallet info for an address",
    {
      address: z.string().optional(),
    },
    async ({ address }) => {
      try {
        if (address === '' || !address) {
          address = account.address
        }
        const balance = await getBalance(address);
        
        return {
          content: [
            {
              type: "text",
              text: `Native Balance (BNB): ${balance.nativeBalance}\n\nToken Balances:\n${JSON.stringify(balance.tokenBalances)}\n\nWallet Address: ${address}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `Failed to fetch balance: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
