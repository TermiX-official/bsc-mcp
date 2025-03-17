import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { configDotenv } from "dotenv";
configDotenv();

import transferERC20Token from "./tools/transferERC20Token.js";
import transferNativeToken from "./tools/transferNativeToken.js";

// Create server instance
const server = new McpServer({
  name: "bsc-mcp",
  version: "1.0.0",
});

// Register weather tools
transferERC20Token(server);
transferNativeToken(server);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BSC MCP server started");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
