import Moralis from "moralis";
import { formatEther, formatUnits } from "viem";

const ensureApiKey = () => {
  if (!process.env.MORALIS_API_KEY) {
    throw new Error(
      "MORALIS_API_KEY is not set in the environment. Please set your API key in your environment variables. If you don't have one, please get an API key from https://docs.moralis.com/web3-data-api/evm/get-your-api-key."
    );
  }
};

const formatTokenDigits = (
  value: bigint,
  tokenDecimal: number,
  decimal: number
) => {
  const newValue = formatUnits(value, tokenDecimal).toString();
  const [integerPart, decimalPart] = newValue.split(".");
  if (!decimalPart) {
    return `${integerPart}.${"0".repeat(decimal)}`;
  }
  const truncatedDecimalPart = decimalPart.slice(0, decimal);
  return `${integerPart}.${truncatedDecimalPart.padEnd(decimal, "0")}`;
};

const formatNativeDigits = (value: string, decimal: number) => {
  if (decimal === 0) {
    return value;
  }
  const [integerPart, decimalPart] = value.split(".");
  if (!decimalPart) {
    return `${integerPart}.${"0".repeat(decimal)}`;
  }
  const truncatedDecimalPart = decimalPart.slice(0, decimal);
  return `${integerPart}.${truncatedDecimalPart.padEnd(decimal, "0")}`;
};

const getBSCBalance = async (address: string) => {
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.NEXT_PUBLIC_MORALIS_API,
      });
    }
    const chain = "0x38";
    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      chain,
      address,
    });
    const tokenBalance = response.raw.filter(
      (token: any) => token.possible_spam === false
    );
    return tokenBalance
      .filter((item: any) => item.verified_contract)
      .map((item: any) => ({
        token_address: item.token_address,
        symbol: item.symbol,
        name: item.name,
        logo: item.logo,
        decimals: item.decimals,
        balance: formatTokenDigits(item.balance, item.decimals, 5),
      }));
  } catch (error) {
    console.error("Detailed error:", error);
    throw error;
  }
};

const getBNBNativeBalance = async (address: string) => {
  ensureApiKey();
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
    }
    const chain = "0x38";
    const response = await Moralis.EvmApi.balance.getNativeBalance({
      chain,
      address,
    });
    const balance = BigInt(response.raw.balance);
    return formatNativeDigits(formatEther(balance), 4);
  } catch (error) {
    console.error("Error fetching BNB balance:", error);
    return "0";
  }
};

export const getBalance = async (address: string) => {
  const bscBalance = await getBSCBalance(address);
  const bnbBalance = await getBNBNativeBalance(address);
  return {
    nativeBalance: bnbBalance,
    tokenBalances: bscBalance,
  };
};
