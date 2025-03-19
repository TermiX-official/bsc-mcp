import { Abi, AbiFunction, isAddress, PublicActions, WalletClient } from "viem";

/**
 * Call a contract's function with a given wallet and arguments.
 *
 * @param wallet - The wallet client instance.
 * @param args - The arguments for the contract call.
 * @param args.abi - The contract ABI as a JSON string.
 * @param args.contractAddress - The contract address.
 * @param args.functionName - The name of the function to call.
 * @param args.functionArgs - The function arguments as a JSON string.
 * @param args.value - The transaction value.
 * @returns The result of the contract call or transaction hash.
 */
export async function callContractHandler(
  wallet: WalletClient & PublicActions,
  args: {
    abi: string;
    contractAddress: string;
    functionName: string;
    functionArgs: string;
    value: number;
  }
): Promise<string> {
  let abi: Abi;
  try {
    abi = JSON.parse(args.abi) as Abi;
  } catch (error) {
    throw new Error(`Invalid ABI: ${error}`);
  }

  if (!isAddress(args.contractAddress, { strict: false })) {
    throw new Error(`Invalid contract address: ${args.contractAddress}`);
  }
  let functionAbi: AbiFunction | undefined;

  try {
    functionAbi = abi.find(
      (item) => "name" in item && item.name === args.functionName
    ) as AbiFunction;
  } catch (error) {
    throw new Error(`Invalid function name: ${args.functionName}`);
  }
  let functionArgs: any;
  try {
    functionArgs = JSON.parse(args.functionArgs);
  } catch (error) {
    throw new Error(`Invalid function arguments: ${args.functionArgs}`);
  }

  if (
    functionAbi.stateMutability === "view" ||
    functionAbi.stateMutability === "pure"
  ) {
    const tx = await wallet.readContract({
      address: args.contractAddress,
      abi,
      functionName: args.functionName,
      args: functionArgs,
    });
    return String(tx);
  }

  const tx = await wallet.simulateContract({
    account: wallet.account,
    abi,
    address: args.contractAddress,
    functionName: args.functionName,
    value: BigInt(args.value ?? 0),
    args: functionArgs,
  });

  const txHash = await wallet.writeContract(tx.request);

  return txHash;
}
