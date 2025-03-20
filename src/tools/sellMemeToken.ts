
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { bsc } from "viem/chains";
import {
    createWalletClient,
    http,
    parseEther,
    parseUnits,
    type Hex,
    publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const tokenAbi = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },

]

export function registerSellMemeToken(server: McpServer) {

    server.tool(
        "sellMemeToken",
        "sell meme token",
        {
            token: z.string(),
            tokenValue: z.string(),
        },
        async ({ token, tokenValue }) => {

            try {
                // Create account from private key
                const account = privateKeyToAccount(
                    process.env.WALLET_PRIVATE_KEY as Hex
                );

                const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
                // Create wallet client
                const client = createWalletClient({
                    account,
                    chain: bsc,
                    transport: http(rpcUrl),
                }).extend(publicActions);

                const allowanceAmount = await client.readContract({
                    address: token as Hex,
                    abi: tokenAbi,
                    functionName: 'allowance',
                    args: [account.address, '0x5c952063c7fc8610FFDB798152D69F0B9550762b'],
                }) as bigint;
                if (allowanceAmount < parseUnits(tokenValue, 18)) {

                    const hash = await client.writeContract({
                        account,
                        address: token as Hex,
                        abi: tokenAbi,
                        functionName: 'approve',
                        args: ['0x5c952063c7fc8610FFDB798152D69F0B9550762b', parseUnits(tokenValue, 18)],
                    });

                    await client.waitForTransactionReceipt({
                        hash: hash,
                        retryCount: 300,
                        retryDelay: 100,
                    });
                }


                const hash = await client.writeContract({
                    account,
                    address: "0x5c952063c7fc8610FFDB798152D69F0B9550762b",
                    abi: [{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "token",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "amount",
                                "type": "uint256"
                            }
                        ],
                        "name": "sellToken",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }],
                    functionName: 'sellToken',
                    args: [token as Hex, parseUnits(tokenValue, 18)],
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Create token successfully. https://bscscan.com/tx/${hash}`,
                            url: `https://bscscan.com/tx/${hash}`,
                        },
                    ],
                };
            } catch (error) {
                console.error("buy meme token failed:", error);
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