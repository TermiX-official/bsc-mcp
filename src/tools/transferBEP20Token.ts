import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseUnits, getContract, Address, publicActions } from "viem"; 
import { bep20abi } from "../lib/bep20Abi.js";
import { getAccount, walletClient } from "../config.js";

export function registerTransferBEP20Token(server: McpServer) {
  server.tool("Send_BEP20_Token", "📤Send any BEP-20 token to another wallet (requires wallet check first)", {
      recipientAddress: z.string(),
      amount: z.string(),
      address: z.string(),
    },
    async ({ recipientAddress, amount, address }) => {
      try {
        // Get token details including address and decimals

        const account = await getAccount();
        const client = walletClient(account).extend(publicActions)

        const contract = getContract({
          address: address as Address,
          abi: bep20abi,
          client,
        });

        const decimals = await contract.read.decimals();
        // Parse the amount based on token decimals
        const parsedAmount = parseUnits(amount, decimals);

        const hash = await contract.write.transfer([
          `0x${recipientAddress.replace("0x", "")}`,
          parsedAmount,
        ], {
          gas: BigInt(100000),
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
