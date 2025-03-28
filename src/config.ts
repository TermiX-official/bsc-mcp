import { Hex, http, publicActions, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

const BSC_WALLET_PRIVATE_KEY = process.env.BSC_WALLET_PRIVATE_KEY as Hex
if (!BSC_WALLET_PRIVATE_KEY) {
    throw new Error("BSC_WALLET_PRIVATE_KEY is not defined");
}

export const account = privateKeyToAccount(
    process.env.BSC_WALLET_PRIVATE_KEY as Hex
);

const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";

// Create wallet client
export const client = createWalletClient({
    account,
    chain: bsc,
    transport: http(rpcUrl),
}).extend(publicActions);