import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBalance } from "../functions/fetchBalanceTool.js";
import { privateKeyToAccount } from "viem/accounts";

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
          const account = privateKeyToAccount(
                    process.env.BSC_WALLET_PRIVATE_KEY as `0x${string}`
                  );
          address = account.address
        }
        const balance = await getBalance(address);
        const tokensStr = balance.tokenBalances
          .map(
            (token: { symbol: string; balance: string }) =>
              `${token.symbol}: ${token.balance}`
          )
          .join("\n");
        return {
          content: [
            {
              type: "text",
              text: `Native Balance (BNB): ${balance.nativeBalance}\n\nToken Balances:\n${tokensStr}\n\nWallet Address: ${address}`,
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
