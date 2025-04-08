
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  parseUnits,
  toEventSelector,
  decodeEventLog,
} from "viem";
import { getAccount, publicClient, walletClient } from "../config.js";
import { AddressConfig } from "../addressConfig.js";

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

    server.tool("Create_BEP20_Token", "🔨Create a new BEP20 standard token", {
            name: z.string(),
            symbol: z.string(),
            totalSupply: z.string(),
        },
        async ({ name, symbol, totalSupply }) => {
            
            try {
                
                const account = await getAccount();
                
                const contract = AddressConfig.CreateBEP20TokenContract;
                const hash = await walletClient(account).writeContract({
                    account,
                    address: contract,
                    abi: createTokenABI,
                    functionName: 'createToken',
                    args: [name, symbol, parseUnits(totalSupply, 18)],
                });
                
                const transaction = await publicClient.waitForTransactionReceipt({
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
                            text: `Create token successfully. https://bscscan.com/tx/${hash}, Token Address: ${decodedLog.args.token}`,
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