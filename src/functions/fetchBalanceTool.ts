
const BALANCE_API_URL = "https://app.termix.ai/api/bscBalanceCheck";

type BalanceData = {
  address: string;
  nativeBalance: string;
  tokenBalances: {
    token_address: string;
    symbol: string;
    name: string;
    logo: string;
    decimals: string;
    balance: string;
  }[];
};

export async function getBalance(address: string) {
  const response = await fetch(`${BALANCE_API_URL}?address=${address}`);
  if (!response.ok) {
    throw new Error(`Balance Fetch Error: ${response.statusText}`);
  }
  return await response.json() as BalanceData;
}
