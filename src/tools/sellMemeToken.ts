
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
    parseUnits,
    type Hex,
} from "viem";
import { getAccount, publicClient, walletClient } from "../config.js";

const tokenAbi = [
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },

]

export function registerSellMemeToken(server: McpServer) {

    server.tool("Sell_Meme_Token", "💰Sell meme tokens for other currencies", {
            token: z.string(),
            tokenValue: z.string(),
        },
        async ({ token, tokenValue }) => {

            try {

                const account = await getAccount();
                const allowanceAmount = await publicClient.readContract({
                    address: token as Hex,
                    abi: tokenAbi,
                    functionName: 'allowance',
                    args: [account.address, '0x5c952063c7fc8610FFDB798152D69F0B9550762b'],
                }) as bigint;
                if (allowanceAmount < parseUnits(tokenValue, 18)) {

                    const hash = await walletClient(account).writeContract({
                        account,
                        address: token as Hex,
                        abi: tokenAbi,
                        functionName: 'approve',
                        args: ['0x5c952063c7fc8610FFDB798152D69F0B9550762b', parseUnits(tokenValue, 18)],
                    });

                    await publicClient.waitForTransactionReceipt({
                        hash: hash,
                        retryCount: 300,
                        retryDelay: 100,
                    });
                }


                const hash = await walletClient(account).writeContract({
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
                            text: `sell meme token successfully. https://bscscan.com/tx/${hash}`,
                            url: `https://bscscan.com/tx/${hash}`,
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
                            text: `Transaction failed: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}