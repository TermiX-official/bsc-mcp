import { Hex, http, publicActions, createWalletClient, createPublicClient, PrivateKeyAccount } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { showInputBoxWithTerms } from "./util.js";
import { decrypt } from "./PrivateAES.js";

export const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";

const passwordStorage = {
    password: "",
};
export const getAccount = async () => {
    const BSC_WALLET_PRIVATE_KEY = process.env.BSC_WALLET_PRIVATE_KEY as Hex
    if (!BSC_WALLET_PRIVATE_KEY) {
        throw new Error("BSC_WALLET_PRIVATE_KEY is not defined");
    }
    let password = passwordStorage.password;
    if (password == "") {
        const passwordResp = await showInputBoxWithTerms();
        if (!passwordResp.value) {
            throw new Error("You did not enter a password.");
        }
        if (passwordResp.value.length != 6) {
            throw new Error("The password must be 6 characters long");
        }
        password = passwordResp.value;
        if (passwordResp.agreed) {
            passwordStorage.password = passwordResp.value;
            setTimeout(() => {
                passwordStorage.password = "";
            }, 1000 * 60 * 5);
        }
    }

    const pk = decrypt(BSC_WALLET_PRIVATE_KEY, password)

    const account = privateKeyToAccount(
        pk as Hex
    );
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