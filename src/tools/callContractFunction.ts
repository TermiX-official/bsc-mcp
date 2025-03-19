import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createWalletClient, http, publicActions } from "viem";
import { bsc } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { callContractHandler } from "../functions/callContractHandler.js";

export function registerCallContractFunction(server: McpServer) {
  server.tool(
    "callContractFunction",
    "Call a contract function using wallet client",
    {
      abi: z.string(),
      contractAddress: z.string(),
      functionName: z.string(),
      functionArgs: z.string(),
      value: z.string(), // Provided as a string; converted to a number
    },
    async ({ abi, contractAddress, functionName, functionArgs, value }) => {
      try {
        const account = privateKeyToAccount(
          process.env.WALLET_PRIVATE_KEY as `0x${string}`
        );
        const client = createWalletClient({
          account,
          chain: bsc,
          transport: http((process.env.BSC_RPC_URL as string) || "https://bsc-dataseed.binance.org"),
        }).extend(publicActions);

        const result = await callContractHandler(client, {
          abi,
          contractAddress,
          functionName,
          functionArgs,
          value: Number(value),
        });

        return {
          content: [
            { type: "text", text: `Contract call successful: ${result}` },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Contract call failed: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
