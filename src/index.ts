import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

// Import tool registrations
import { registerTransferNativeToken } from "./tools/transferNativeToken.js";
import { registerTransferBEP20Token } from "./tools/transferBEP20Token.js";
import { registerPancakeSwap } from "./tools/pancakeSwap.js";
import { registerGetBalance } from "./tools/getBalance.js";
import { registerCallContractFunction } from "./tools/callContractFunction.js";
import { registerReceiveImage } from "./tools/registerReceiveImage.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { registerCreateMemeToken } from "./tools/createFourMeme.js";

// Load environment variables
dotenv.config();

// Create MCP server instance
const server = new McpServer({
  name: "bsc-mcp",
  version: "1.0.0",
});

// Register all tools
registerTransferNativeToken(server);
registerTransferBEP20Token(server);
registerPancakeSwap(server);
registerGetBalance(server);
registerCallContractFunction(server);
registerReceiveImage(server);
registerCreateMemeToken(server);

// demo upload image

// async function main() {
//   const transport = new StdioServerTransport();
//   await server.connect(transport);
// }

// Start the server
async function main() {
  const transport = new StdioServerTransport();

  // Add event listeners for incoming messages
  transport.onmessage = (message: JSONRPCMessage) => {
    console.log("Received message:", JSON.stringify(message, null, 2));
  };

  transport.onerror = (error: any) => {
    console.error("Transport error:", error);
  };

  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  process.exit(1);
});
