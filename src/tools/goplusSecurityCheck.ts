// @ts-ignore
import { GoPlus, ErrorCode } from "@goplus/sdk-node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerGoplusSecurityCheck(server: McpServer) {
  server.tool("Token_Security_Check", "🔒Analyze BNBChain tokens for potential security risks powered by GoPlus", {
      tokenAddress: z.string(),
    },
    async ({ tokenAddress }) => {
      try {
        const chainId = "56"; // BSC chain ID
        const addresses = [tokenAddress];

        // Call GoPlus API to check token security
        let res = await (GoPlus as any).tokenSecurity(chainId, addresses, 30);

        if (res.code !== (ErrorCode as any).SUCCESS) {
          return {
            content: [
              {
                type: "text",
                text: `Security check failed: ${res.message}`,
              },
            ],
            isError: true,
          };
        }

        const securityData = res.result[tokenAddress] || {};

        return {
          content: [
            {
              type: "text",
              text: `Security check successful for ${tokenAddress}: ${JSON.stringify(
                securityData,
                null,
                2
              )}`,
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
              text: `Security check failed: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
