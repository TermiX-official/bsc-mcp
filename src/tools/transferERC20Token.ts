
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
import { getEVMTokenAddress } from "../functions/getEvmTokenAddress.js";
import { bep20abi } from "../lib/bep20Abi.js";


export default function (server: McpServer) {

    server.tool(
        "transferERC20Token",
        "Transfer ERC-20 token by symbol or address",
        {
            recipientAddress: z.string(),
            amount: z.string(),
            token: z.string(),
        },
        async ({ recipientAddress, amount, token }) => {
            try {
                // Get token info (address and decimals)
                const tokenInfo = await getEVMTokenAddress(
                    56,
                    token,
                    "https://bsc-dataseed.binance.org"
                );

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

                // Get contract instance
                const contract = getContract({
                    address: tokenInfo.address,
                    abi: bep20abi,
                    client,
                });

                // Parse amount with proper decimals
                const parsedAmount = parseUnits(amount, tokenInfo.decimals);

                // Transfer tokens
                const hash = await contract.write.transfer([
                    `0x${recipientAddress.replace("0x", "")}`,
                    parsedAmount,
                ]);

                return {
                    content: [
                        {
                            type: "text",
                            text: `ERC-20 token transfer sent successfully.`,
                            url: `https://bscscan.com/tx/${hash}`,
                        },
                    ],
                };
            } catch (error) {
                console.error("ERC-20 token transfer failed:", error);
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