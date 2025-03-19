import {
  createPublicClient,
  createWalletClient,
  Hash,
  http,
  getContract,
  Hex,
  parseUnits,
} from "viem";
import { resolveCurrency } from "../util.js";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { erc20Abi, hexToBigInt, maxUint256 } from "viem";
import {
  CurrencyAmount,
  ERC20Token,
  Percent,
  TradeType,
} from "@pancakeswap/sdk";
import {
  SmartRouter,
  SmartRouterTrade,
  SwapRouter,
} from "@pancakeswap/smart-router";
import { GraphQLClient } from "graphql-request";

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
  // Resolve both input and output tokens.
  const resolvedInput = await resolveCurrency(inputToken, 56);
  const resolvedOutput = await resolveCurrency(outputToken, 56);

  if (resolvedInput.chainId !== resolvedOutput.chainId) {
    throw new Error("Input and output tokens must be on the same chain");
  }
  const chainId = resolvedInput.chainId;

  // Set up viem clients and account.
  const rpcUrl = (process.env.BSC_RPC_URL as string) || "https://bsc-dataseed.binance.org";
  const account = privateKeyToAccount(
    process.env.WALLET_PRIVATE_KEY as `0x${string}`
  );
  const publicClient = createPublicClient({
    chain: bsc,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    chain: bsc,
    transport: http(rpcUrl),
    account: account,
  });

  // Use the resolved currencies.
  let currencyA = resolvedInput.currency;
  const currencyB = resolvedOutput.currency;

  // Determine decimals for input token.
  let inputDecimals: number;
  if ("address" in currencyA && currencyA.address) {
    const TokenContract = getContract({
      address: currencyA.address as Hex,
      abi: erc20Abi,
      client: {
        wallet: walletClient,
        public: publicClient,
      },
    });
    inputDecimals = await TokenContract.read.decimals();
    if (currencyA.decimals !== inputDecimals) {
      currencyA = new ERC20Token(
        chainId,
        currencyA.address as Hex,
        inputDecimals,
        (currencyA as any).symbol || ""
      );
    }
  } else {
    inputDecimals = 18;
  }

  const parseAmountIn = parseUnits(amount, inputDecimals);
  const amountValue = CurrencyAmount.fromRawAmount(currencyA, parseAmountIn);

  if ("address" in currencyA && currencyA.address) {
    const TokenContract = getContract({
      address: currencyA.address as Hex,
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
    // @ts-ignore
    const smartRouterAddress = SMART_ROUTER_ADDRESSES[chainId];
    const allowance = (await TokenContract.read.allowance([
      account.address,
      smartRouterAddress,
    ])) as bigint;
    if (allowance < parseAmountIn) {
      const approveResult = await TokenContract.write.approve([
        smartRouterAddress,
        maxUint256,
      ]);
      await publicClient.waitForTransactionReceipt({
        hash: approveResult,
      });
    }
  }

  const quoteProvider = SmartRouter.createQuoteProvider({
    onChainProvider: () => publicClient,
  });
  const v3SubgraphClient = new GraphQLClient(
    "https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc1"
  );
  const v2SubgraphClient = new GraphQLClient(
    "https://proxy-worker-api.pancakeswap.com/bsc-exchange1"
  );
  // @ts-ignore
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
  ]);

  const pools = [...v2Pools, ...v3Pools];
  const trade = (await SmartRouter.getBestTrade(
    amountValue,
    currencyB,
    TradeType.EXACT_INPUT,
    {
      gasPriceWei: () => publicClient.getGasPrice(),
      maxHops: 2,
      maxSplits: 2,
      poolProvider: SmartRouter.createStaticPoolProvider(pools),
      quoteProvider,
      quoterOptimization: true,
    }
  )) as SmartRouterTrade<TradeType>;

  const { value, calldata } = SwapRouter.swapCallParameters(trade, {
    recipient: account.address,
    slippageTolerance: new Percent(1),
  });
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
