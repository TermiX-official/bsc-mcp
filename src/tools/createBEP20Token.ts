
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
  publicActions,
  getEventSelector,
  AbiEvent,
  toEventSelector,
  decodeEventLog,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const createTokenABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "symbol",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "totalSupply",
				"type": "uint256"
			}
		],
		"name": "createToken",
		"outputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "creater",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "createrNonce",
				"type": "uint256"
			}
		],
		"name": "CreateTokenEvent",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "createrNonce",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

export function registerCreateBEP20Token(server: McpServer) {

    server.tool(
        "createBEP20Token",
        "create a token",
        {
            name: z.string(),
            symbol: z.string(),
            totalSupply: z.string(),
        },
        async ({ name, symbol, totalSupply }) => {
            
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

                const contract = "0xad9e6346E87Dfb4c08a47CBDFDF715A700C03918";
                const hash = await client.writeContract({
                    account,
                    address: contract,
                    abi: createTokenABI,
                    functionName: 'createToken',
                    args: [name, symbol, parseUnits(totalSupply, 18)],
                });
                
                const transaction = await client.waitForTransactionReceipt({
                    hash: hash,
                    retryCount: 300,
                    retryDelay: 100,
                });

                if (transaction.status != "success") {
                    console.log("Transaction failed", transaction)
                    throw new Error("Transaction failed");
                }

                const targetTopic = toEventSelector({
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": false,
                            "internalType": "address",
                            "name": "creater",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "address",
                            "name": "token",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "createrNonce",
                            "type": "uint256"
                        }
                    ],
                    "name": "CreateTokenEvent",
                    "type": "event"
                });

                const logData = transaction.logs.find((log) => (log.topics as string[]).includes(targetTopic));
                if (!logData) {
                    throw new Error("Log not found");
                }
                
                const decodedLog = decodeEventLog({
                    abi: [{
                        "anonymous": false,
                        "inputs": [
                            {
                                "indexed": false,
                                "internalType": "address",
                                "name": "creater",
                                "type": "address"
                            },
                            {
                                "indexed": false,
                                "internalType": "address",
                                "name": "token",
                                "type": "address"
                            },
                            {
                                "indexed": false,
                                "internalType": "uint256",
                                "name": "createrNonce",
                                "type": "uint256"
                            }
                        ],
                        "name": "CreateTokenEvent",
                        "type": "event"
                    }],
                    data: logData.data,
                    topics: logData.topics,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Create token successfully. Hash: https://bscscan.com/tx/${hash}, Token Address: ${decodedLog.args.token}`,
                            url: `https://bscscan.com/tx/${hash}`,
                        },
                    ],
                };
            } catch (error) {
                console.error("Native token transfer failed:", error);
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