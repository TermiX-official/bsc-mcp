import {
  createPublicClient,
  createWalletClient,
  Hash,
  http,
  getContract,
  Hex,
  parseUnits,
  isAddress,
} from "viem";
import { resolveCurrency } from "../util.js";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { erc20Abi, hexToBigInt, maxUint256 } from "viem";
import {
  ChainId,
  CurrencyAmount,
  ERC20Token,
  Native,
  Percent,
  TradeType,
} from "@pancakeswap/sdk";
import {
  SMART_ROUTER_ADDRESSES,
  SmartRouter,
  SmartRouterTrade,
  SwapRouter,
} from "@pancakeswap/smart-router";
import { GraphQLClient } from "graphql-request";


const tokenList: any = {}

const getToken = async (
  token: string,
) => {
  if (token.toUpperCase() === "BNB") {
    return Native.onChain(ChainId.BSC)
  }
  let address = token.toLowerCase()
  let decimal;

  let tokens = tokenList.tokens || [];
  if (!tokenList.time || Date.now() - tokenList.time > 1000 * 60 * 5) {
    const url = "https://tokens.pancakeswap.finance/pancakeswap-extended.json";

    const resp = await fetch(url);
    const data = await resp.json();
    tokens = data.tokens
    tokenList.time = Date.now()
    tokenList.tokens = tokens;
  }

  if (!isAddress(address)) {
    const tokenInfo = tokens.find((item: any) => item.symbol.toLowerCase() === address)
    if (!tokenInfo) {
      throw new Error("Token not found");
    }
    address = tokenInfo.address
    decimal = tokenInfo.decimals
  } else {
    const tokenInfo = tokens.find((item: any) => item.address.toLowerCase() === address)
    if (!tokenInfo) {
      throw new Error("Token not found");
    }
    decimal = tokenInfo.decimals
  }
  console.log(address, decimal)
  return new ERC20Token(
    ChainId.BSC,
    address as Hex,
    decimal,
    '',
  )


}

export const pancakeSwap = async ({
  // privateKey,
  inputToken,
  outputToken,
  amount,
}: {
  // privateKey: string;
  amount: string;
  inputToken: string;
  outputToken: string;
}): Promise<Hash> => {

  const chainId = 56
  const account = privateKeyToAccount(
    process.env.WALLET_PRIVATE_KEY as `0x${string}`
  );

  const rpcUrl = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
  const publicClient = createPublicClient({
    chain: bsc,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    chain: bsc,
    transport: http(rpcUrl),
    account: account,
  });

  let currencyA = await getToken(inputToken);
  let currencyB = await getToken(outputToken);
  let amountDecimal = currencyA.decimals;

  const parseAmountIn = parseUnits(amount, amountDecimal);
  const amountValue = CurrencyAmount.fromRawAmount(currencyA, parseAmountIn)

  if (!currencyA.isNative) {
    const TokenContract = getContract({
      address: currencyA.address,
      abi: erc20Abi,
      client: {
        wallet: walletClient,
        public: publicClient,
      },
    });
    if (
      !TokenContract.write ||
      !TokenContract.write.approve ||
      !TokenContract.read.allowance
    ) {
      throw new Error("Unable to Swap Tokens");
    }

    amountDecimal = await TokenContract.read.decimals();

    const smartRouterAddress = SMART_ROUTER_ADDRESSES[56]
    const allowance = await TokenContract.read.allowance([account.address, smartRouterAddress]) as bigint
    if (allowance < parseAmountIn) {
      const approveResult = await TokenContract.write.approve([smartRouterAddress, maxUint256])

      await publicClient.waitForTransactionReceipt({
        hash: approveResult,
      });
    }

  }

  const quoteProvider = SmartRouter.createQuoteProvider({
    onChainProvider: () => publicClient,
  })
  const v3SubgraphClient = new GraphQLClient('https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc1')
  const v2SubgraphClient = new GraphQLClient('https://proxy-worker-api.pancakeswap.com/bsc-exchange1')



  const [v2Pools, v3Pools] = await Promise.all([
    SmartRouter.getV3CandidatePools({
      onChainProvider: () => publicClient,
      // @ts-ignore
      subgraphProvider: () => v3SubgraphClient,
      currencyA: currencyA,
      currencyB: currencyB,
      subgraphFallback: false,
    }),
    SmartRouter.getV2CandidatePools({
      onChainProvider: () => publicClient,
      // @ts-ignore
      v2SubgraphProvider: () => v2SubgraphClient,
      // @ts-ignore
      v3SubgraphProvider: () => v3SubgraphClient,
      currencyA: currencyA,
      currencyB: currencyB,
    }),
  ])

  const pools = [...v2Pools, ...v3Pools]
  const trade = await SmartRouter.getBestTrade(amountValue, currencyB, TradeType.EXACT_INPUT, {
    gasPriceWei: () => publicClient.getGasPrice(),
    maxHops: 2,
    maxSplits: 2,
    poolProvider: SmartRouter.createStaticPoolProvider(pools),
    quoteProvider,
    quoterOptimization: true,
  }) as SmartRouterTrade<TradeType>


  const { value, calldata } = SwapRouter.swapCallParameters(trade, {
    recipient: account.address,
    slippageTolerance: new Percent(1),
  })

  const tx = {
    account: account.address,
    // @ts-ignore
    to: SMART_ROUTER_ADDRESSES[chainId],
    data: calldata,
    value: hexToBigInt(value),
  };
  const gasEstimate = await publicClient.estimateGas(tx);

  const calculateGasMargin = (value: bigint, margin = 1000n): bigint => {
    return (value * (10000n + margin)) / 10000n;
  };


  const txHash = await walletClient.sendTransaction({
    account: account,
    chainId,
    // @ts-ignore
    to: SMART_ROUTER_ADDRESSES[chainId],
    data: calldata,
    value: hexToBigInt(value),
    gas: calculateGasMargin(gasEstimate),
  });
  return txHash;
};








