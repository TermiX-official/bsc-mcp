//@ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  parseEther,
  type Hex,
  decodeEventLog,
} from "viem";
import { PrivateKeyAccount } from "viem/accounts";
import { getAccount, publicClient, } from "../config.js";
import { AddressConfig } from "../addressConfig.js";

export const CreateFourMemeSchema = z.object({
  name: z.string().describe("name"),
  shortName: z.string().describe("short name"),
  imgUrl: z.string().describe("image url"),
  preSale: z.string().describe("pre sale value"),
  desc: z.string().describe("description"),
  twitterUrl: z.string().optional().describe("twitterUrl"),
  telegramUrl: z.string().optional().describe("telegramUrl"),
  webUrl: z.string().optional().describe("webUrl"),
});

const fourMemeToken = {
  token: "",
  time: 0,
};

const loginFourMeme = async (account: PrivateKeyAccount): Promise<string> => {
  if (Date.now() - fourMemeToken.time < 1000 * 60 * 10) {
    return fourMemeToken.token;
  }

  if (Date.now() - fourMemeToken.time < 1000 * 60 * 15) {
    const resp = await fetch(
      "https://four.meme/meme-api/v1/private/user/info",
      {
        headers: {
          "meme-web-access": fourMemeToken.token,
        },
        method: "GET",
      }
    );
    if (resp.status === 200) {
      const userInfo = await resp.json();
      if (userInfo.msg === "success") {
        fourMemeToken.time = Date.now();
        return fourMemeToken.token;
      }
    }
  }

  const generateResp = await fetch(
    `https://four.meme/meme-api/v1/private/user/nonce/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        accountAddress: account.address,
        verifyType: "LOGIN",
        networkCode: "BSC",
      }),
    }
  );
  if (generateResp.status !== 200) {
    throw new Error("service error");
  }
  const generateJson = await generateResp.json();

  const data = `You are sign in Meme ${generateJson.data}`;
  const signature = await account.signMessage({
    message: data,
  });

  const loginResp = await fetch(
    `https://four.meme/meme-api/v1/private/user/login/dex`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        region: "WEB",
        langType: "EN",
        loginIp: "",
        inviteCode: "",
        verifyInfo: {
          address: account.address,
          networkCode: "BSC",
          signature: signature,
          verifyType: "LOGIN",
        },
        walletName: "MetaMask",
      }),
    }
  );
  if (loginResp.status !== 200) {
    throw new Error("service error");
  }
  const loginJson = await loginResp.json();

  fourMemeToken.token = loginJson.data;
  fourMemeToken.time = Date.now();
  return fourMemeToken.token;
};

const createMemeTokenData = async (data: any, token: string) => {
  const createResp = await fetch(
    `https://four.meme/meme-api/v1/private/token/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "meme-web-access": token,
      },
      body: JSON.stringify({
        ...data,
        totalSupply: 1000000000,
        raisedAmount: 24,
        saleRate: 0.8,
        reserveRate: 0,
        raisedToken: {
          symbol: "BNB",
          nativeSymbol: "BNB",
          symbolAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
          deployCost: "0",
          buyFee: "0.01",
          sellFee: "0.01",
          minTradeFee: "0",
          b0Amount: "8",
          totalBAmount: "24",
          totalAmount: "1000000000",
          logoUrl:
            "https://static.four.meme/market/68b871b6-96f7-408c-b8d0-388d804b34275092658264263839640.png",
          tradeLevel: ["0.1", "0.5", "1"],
          status: "PUBLISH",
          buyTokenLink: "https://pancakeswap.finance/swap",
          reservedNumber: 10,
          saleRate: "0.8",
          networkCode: "BSC",
          platform: "MEME",
        },
        launchTime: Date.now(),
        funGroup: false,
        clickFun: false,
        symbol: "BNB",
        label: "Meme",
        lpTradingFee: 0.0025,
      }),
    }
  );

  const createJson = await createResp.json();
  if (createJson.msg !== "success") {
    throw new Error(`create token data error ${createJson.msg}`);
  }

  const preSaleNum = (parseEther(data.preSale) * BigInt(101)) / BigInt(100);
  return {
    createArg: createJson.data.createArg,
    signature: createJson.data.signature,
    value: preSaleNum,
  };
};

export function registerCreateMemeToken(server: McpServer) {
  server.tool("Create_FourMeme_Token", "🎭Launch a new meme token on four.meme platform",
    CreateFourMemeSchema.shape,

    async (args_: any) => {
      try {
        const { twitterUrl, telegramUrl, webUrl, ...data } = args_
        const args: any = data;
        if (twitterUrl !== '') {
          args.twitterUrl = twitterUrl;
        }
        if (telegramUrl !== '') {
          args.telegramUrl = telegramUrl;
        }
        if (webUrl !== '') {
          args.webUrl = webUrl;
        }

        const account = await getAccount();

        const loginToken = await loginFourMeme(account);
        const transactionData = await createMemeTokenData(args, loginToken);

        const contract = AddressConfig.FourMemeCreateTokenContract;
        const hash = await walletClient(account).writeContract({
          account,
          address: contract,
          abi: [
            {
              inputs: [
                {
                  internalType: "bytes",
                  name: "args",
                  type: "bytes",
                },
                {
                  internalType: "bytes",
                  name: "signature",
                  type: "bytes",
                },
              ],
              name: "createToken",
              outputs: [],
              stateMutability: "payable",
              type: "function",
            },
          ],
          functionName: "createToken",
          args: [
            transactionData.createArg as Hex,
            transactionData.signature as Hex,
          ],
          value: transactionData.value,
        });

        const transaction = await publicClient.waitForTransactionReceipt({
          hash: hash,
          retryCount: 300,
          retryDelay: 1000,
        });

        if (transaction.status != "success") {
          throw new Error("Transaction failed");
        }

        const logData = transaction.logs.find(
          (log) =>
            log.topics.length != 0 &&
            (log.topics as string[]).includes(
              "0x396d5e902b675b032348d3d2e9517ee8f0c4a926603fbc075d3d282ff00cad20"
            )
        );
        if (!logData) {
          throw new Error("Log not found");
        }

        const decodedLog = decodeEventLog({
          abi: [
            {
              anonymous: false,
              inputs: [
                {
                  indexed: false,
                  internalType: "address",
                  name: "creator",
                  type: "address",
                },
                {
                  indexed: false,
                  internalType: "address",
                  name: "token",
                  type: "address",
                },
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "requestId",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "string",
                  name: "name",
                  type: "string",
                },
                {
                  indexed: false,
                  internalType: "string",
                  name: "symbol",
                  type: "string",
                },
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "totalSupply",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "launchTime",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "launchFee",
                  type: "uint256",
                },
              ],
              name: "TokenCreate",
              type: "event",
            },
          ],
          data: logData.data,
          topics: logData.topics,
        });

        const address = decodedLog.args.token;

        return {
          content: [
            {
              type: "text",
              text: `create token on four.meme successfully. https://four.meme/token/${address} `,
              url: ` https://four.meme/token/${address}`,
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
