

const BALANCE_API_URL = "https://app.termix.ai/api/bscBalanceCheck";

export async function getBalance(address: string) {
  const response = await fetch(`${BALANCE_API_URL}?address=${address}`);
  if (!response.ok) {
    throw new Error(`Balance Fetch Error: ${response.statusText}`);
  }
  return response.json();
}
