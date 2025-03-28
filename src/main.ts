import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

// Load environment variables
dotenv.config();

// Import tool registrations
import { registerTransferNativeToken } from "./tools/transferNativeToken.js";
import { registerTransferBEP20Token } from "./tools/transferBEP20Token.js";
import { registerPancakeSwap } from "./tools/pancakeSwap.js";
import { registerGetWalletInfo } from "./tools/getWalletInfo.js";
import { registerCreateMemeToken } from "./tools/createFourMeme.js";
import { registerCreateBEP20Token } from "./tools/createBEP20Token.js";
import { registerBuyMemeToken } from "./tools/buyMemeToken.js";
import { registerSellMemeToken } from "./tools/sellMemeToken.js";
import { registerPancakeAddLiquidity } from "./tools/pancakeAddLiquidity.js";
import { registerPancakeMyPosition } from "./tools/pancakeMyPosition.js";
import { registerPancakeRemovePosition } from "./tools/pancakeRemovePosition.js";
import { registerGoplusSecurityCheck } from "./tools/goplusSecurityCheck.js";

// Main server entry
export async function main() {
    const server = new McpServer({
        name: "bsc-mcp",
        version: "1.0.0",
    });

    // Register all tools
    registerTransferNativeToken(server);
    registerTransferBEP20Token(server);
    registerPancakeSwap(server);
    registerGetWalletInfo(server);
    registerCreateMemeToken(server);
    registerCreateBEP20Token(server);
    registerBuyMemeToken(server);
    registerSellMemeToken(server);
    registerPancakeAddLiquidity(server);
    registerPancakeMyPosition(server);
    registerPancakeRemovePosition(server);
    registerGoplusSecurityCheck(server);

    const transport = new StdioServerTransport();

    transport.onmessage = (message /** @type {JSONRPCMessage} */) => {
        console.log("📩 Received message:", JSON.stringify(message, null, 2));
    };

    transport.onerror = (error) => {
        console.error("🚨 Transport error:", error);
    };

    await server.connect(transport);
}
