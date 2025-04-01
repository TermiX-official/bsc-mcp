import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseUnits, getContract } from "viem";
import { getEVMTokenAddress } from "../functions/getEvmTokenAddress.js";
import { bep20abi } from "../lib/bep20Abi.js";
import { client } from "../config.js";

export function registerTransferBEP20Token(server: McpServer) {
  server.tool(
    "transferBEP20Token",
    "Transfer BEP-20 token by symbol or address",
    {
      recipientAddress: z.string(),
      amount: z.string(),
      token: z.string(),
    },
    async ({ recipientAddress, amount, token }) => {
      try {
        // Get token details including address and decimals
        const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
        const tokenInfo = await getEVMTokenAddress(
          56,
          token,
          rpcUrl
        );


        const contract = getContract({
          address: tokenInfo.address,
          abi: bep20abi,
          client,
        });

        // Parse the amount based on token decimals
        const parsedAmount = parseUnits(amount, tokenInfo.decimals);

        const hash = await contract.write.transfer([
          `0x${recipientAddress.replace("0x", "")}`,
          parsedAmount,
        ], {
          gas: BigInt(50000),
        });

        return {
          content: [
            {
              type: "text",
              text: `BEP-20 token transfer sent successfully. https://bscscan.com/tx/${hash}`,
              url: `https://bscscan.com/tx/${hash}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `Transaction failed: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
