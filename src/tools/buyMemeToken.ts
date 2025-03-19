
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


export function registerBuyMemeToken(server: McpServer) {

    server.tool(
        "buyMemeToken",
        "buy meme token",
        {
            token: z.string(),
            tokenValue: z.string().default("0"),
            bnbValue: z.string().default("0"),
        },
        async ({ token, tokenValue, bnbValue }) => {

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

                const [,,estimatedAmount,,,amountMsgValue,,] = await client.readContract({
                        address: '0xF251F83e40a78868FcfA3FA4599Dad6494E46034',
                        abi: [
                            {
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
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "funds",
                                        "type": "uint256"
                                    }
                                ],
                                "name": "tryBuy",
                                "outputs": [
                                    {
                                        "internalType": "address",
                                        "name": "tokenManager",
                                        "type": "address"
                                    },
                                    {
                                        "internalType": "address",
                                        "name": "quote",
                                        "type": "address"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "estimatedAmount",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "estimatedCost",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "estimatedFee",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "amountMsgValue",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "amountApproval",
                                        "type": "uint256"
                                    },
                                    {
                                        "internalType": "uint256",
                                        "name": "amountFunds",
                                        "type": "uint256"
                                    }
                                ],
                                "stateMutability": "view",
                                "type": "function"
                            }],
                        functionName: 'tryBuy',
                        args: [token as Hex, parseUnits(tokenValue, 18), parseUnits(bnbValue, 18)],
                    });

                let outputAmount;
                let inputAmount;
                if (tokenValue == "0") {
                    outputAmount = (BigInt(estimatedAmount) * BigInt(100 - 20)) / 100n
                    inputAmount = amountMsgValue
                } else {
                    outputAmount = estimatedAmount;
                    inputAmount =  (BigInt(amountMsgValue) * BigInt(100 + 5)) / 100n
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
                                "name": "funds",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "minAmount",
                                "type": "uint256"
                            }
                        ],
                        "name": "buyTokenAMAP",
                        "outputs": [],
                        "stateMutability": "payable",
                        "type": "function"
                    }],
                    functionName: 'buyTokenAMAP',
                    args: [token as Hex, BigInt(inputAmount), outputAmount],
                    value: BigInt(inputAmount),
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