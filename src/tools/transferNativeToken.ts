
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bsc } from "viem/chains";
import {
  createWalletClient,
  http,
  parseEther,
  parseUnits,
  getContract,
  isAddress,
  createPublicClient,
  type Hash,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export default function (server: McpServer) {

    server.tool(
        "transferNativeToken",
        "Transfer native token (BNB)",
        {
            recipientAddress: z.string(),
            amount: z.string(),
        },
        async ({ recipientAddress, amount }) => {
            try {
                // Create account from private key
                const account = privateKeyToAccount(
                    process.env.WALLET_PRIVATE_KEY as Hex
                );

                // Create wallet client
                const client = createWalletClient({
                    account,
                    chain: bsc,
                    transport: http("https://bsc-dataseed.binance.org"),
                });

                // Send BNB
                const hash = await client.sendTransaction({
                    to: recipientAddress as Hex,
                    value: parseEther(amount),
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Transaction sent successfully. Hash: ${hash}`,
                            url: `https://bscscan.com/tx/${hash}`,
                        },
                    ],
                };
            } catch (error) {
                console.error("Native token transfer failed:", error);
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