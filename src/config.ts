import { Hex, http, publicActions, createWalletClient, createPublicClient, PrivateKeyAccount } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { getPassword, } from "./util.js";
import { decrypt, } from "./PrivateAES.js";

export const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";

let account: PrivateKeyAccount | null = null;
export const getAccount = async () => {
    const BSC_WALLET_PRIVATE_KEY = process.env.BSC_WALLET_PRIVATE_KEY as Hex
    if (!BSC_WALLET_PRIVATE_KEY) {
        throw new Error("BSC_WALLET_PRIVATE_KEY is not defined");
    }
    if (account) {
        return account;
    }

    const {agreed, value: password} = await getPassword()
    if (!password) {
        throw new Error("You did not enter a password.");
    }

    const pk = decrypt(BSC_WALLET_PRIVATE_KEY, password)

    account = privateKeyToAccount(
        pk as Hex
    );
    if (agreed) {
        setTimeout(() => {
            account = null;
        }, 1000 * 60 * 5);
    }
    return account;
};

export const getClient = async () => {
    const account = await getAccount()
    const client = createWalletClient({
        account,
        chain: bsc,
        transport: http(rpcUrl),
    }).extend(publicActions);

    return client;
};

export const publicClient = createPublicClient({
  chain: bsc,
  transport: http(rpcUrl),
});

export const walletClient = (account: PrivateKeyAccount) => createWalletClient({
    chain: bsc,
    transport: http(rpcUrl),
    account: account,
  });