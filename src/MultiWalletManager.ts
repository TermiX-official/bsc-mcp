/**
 * MultiWalletManager for bsc-mcp
 * Resolves Issue #30: Multi-wallet architecture support
 * Allows AI agents to manage and switch between multiple wallets dynamically.
 */

import { Hex, PrivateKeyAccount, createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import { rpcUrl } from "./config.js";
import { decryptPrivateKey } from "./PrivateAES.js";

export interface WalletEntry {
  alias: string;
  address: `0x${string}`;
  encryptedKey?: string;
  rawKey?: Hex;
  createdAt: number;
}

export class MultiWalletManager {
  private wallets: Map<string, WalletEntry> = new Map();
  private activeAlias: string = 'default';
  private unlockedAccounts: Map<string, PrivateKeyAccount> = new Map();

  constructor() {
    const defaultEnvKey = process.env.BSC_WALLET_PRIVATE_KEY as Hex;
    const defaultAddress = process.env.BSC_WALLET_ADDRESS as `0x${string}`;

    if (defaultEnvKey) {
      try {
        const isHexKey = defaultEnvKey.startsWith('0x') && defaultEnvKey.length === 66;
        if (isHexKey) {
          const account = privateKeyToAccount(defaultEnvKey);
          this.registerRawWallet('default', defaultEnvKey, account.address);
        } else {
          this.wallets.set('default', {
            alias: 'default',
            address: defaultAddress || '0x0000000000000000000000000000000000000000',
            encryptedKey: defaultEnvKey,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        // Fallback for encrypted key
      }
    }
  }

  /**
   * Register a raw private key in memory under an alias
   */
  public registerRawWallet(alias: string, privateKey: Hex, address?: `0x${string}`): WalletEntry {
    const cleanKey = privateKey.startsWith('0x') ? privateKey : (`0x${privateKey}` as Hex);
    const account = privateKeyToAccount(cleanKey);
    const walletAddress = address || account.address;

    const entry: WalletEntry = {
      alias: alias.toLowerCase(),
      address: walletAddress,
      rawKey: cleanKey,
      createdAt: Date.now(),
    };

    this.wallets.set(alias.toLowerCase(), entry);
    this.unlockedAccounts.set(alias.toLowerCase(), account);
    this.unlockedAccounts.set(walletAddress.toLowerCase(), account);

    return entry;
  }

  /**
   * Register an encrypted private key under an alias
   */
  public registerEncryptedWallet(alias: string, encryptedKey: string, address: `0x${string}`): WalletEntry {
    const entry: WalletEntry = {
      alias: alias.toLowerCase(),
      address,
      encryptedKey,
      createdAt: Date.now(),
    };

    this.wallets.set(alias.toLowerCase(), entry);
    return entry;
  }

  /**
   * Unlock an encrypted wallet with password
   */
  public async unlockWallet(aliasOrAddress: string, password: string): Promise<PrivateKeyAccount> {
    const key = aliasOrAddress.toLowerCase();
    const entry = this.getWalletEntry(key);

    if (!entry) {
      throw new Error(`Wallet '${aliasOrAddress}' not found in MultiWalletManager`);
    }

    if (entry.rawKey) {
      const account = privateKeyToAccount(entry.rawKey);
      this.unlockedAccounts.set(entry.alias, account);
      this.unlockedAccounts.set(entry.address.toLowerCase(), account);
      return account;
    }

    if (!entry.encryptedKey) {
      throw new Error(`No private key or encrypted key available for wallet '${aliasOrAddress}'`);
    }

    const decryptedKey = await decryptPrivateKey(entry.encryptedKey, password);
    const hexKey = (decryptedKey.startsWith('0x') ? decryptedKey : `0x${decryptedKey}`) as Hex;
    const account = privateKeyToAccount(hexKey);

    this.unlockedAccounts.set(entry.alias, account);
    this.unlockedAccounts.set(entry.address.toLowerCase(), account);

    return account;
  }

  /**
   * Get an account by alias or address
   */
  public getAccount(aliasOrAddress?: string): PrivateKeyAccount {
    const target = (aliasOrAddress || this.activeAlias).toLowerCase();
    
    const cached = this.unlockedAccounts.get(target);
    if (cached) {
      return cached;
    }

    const entry = this.getWalletEntry(target);
    if (!entry) {
      throw new Error(`Wallet '${target}' is not registered. Available wallets: ${this.listAliases().join(', ')}`);
    }

    if (entry.rawKey) {
      const account = privateKeyToAccount(entry.rawKey);
      this.unlockedAccounts.set(entry.alias, account);
      return account;
    }

    throw new Error(`Wallet '${target}' is locked or requires password decryption.`);
  }

  /**
   * Get dedicated WalletClient for a specific wallet
   */
  public getWalletClient(aliasOrAddress?: string) {
    const account = this.getAccount(aliasOrAddress);
    return createWalletClient({
      account,
      chain: bsc,
      transport: http(rpcUrl),
    }).extend(publicActions);
  }

  /**
   * Set active default wallet alias
   */
  public setActiveWallet(alias: string): void {
    const normalized = alias.toLowerCase();
    if (!this.wallets.has(normalized)) {
      throw new Error(`Cannot set active wallet: '${alias}' does not exist.`);
    }
    this.activeAlias = normalized;
  }

  public getActiveAlias(): string {
    return this.activeAlias;
  }

  public listWallets(): Array<{ alias: string; address: string; isUnlocked: boolean; isActive: boolean }> {
    const result: Array<{ alias: string; address: string; isUnlocked: boolean; isActive: boolean }> = [];
    for (const [alias, entry] of this.wallets.entries()) {
      result.push({
        alias: entry.alias,
        address: entry.address,
        isUnlocked: this.unlockedAccounts.has(alias) || Boolean(entry.rawKey),
        isActive: alias === this.activeAlias,
      });
    }
    return result;
  }

  public listAliases(): string[] {
    return Array.from(this.wallets.keys());
  }

  private getWalletEntry(aliasOrAddress: string): WalletEntry | undefined {
    const normalized = aliasOrAddress.toLowerCase();
    if (this.wallets.has(normalized)) {
      return this.wallets.get(normalized);
    }
    for (const entry of this.wallets.values()) {
      if (entry.address.toLowerCase() === normalized) {
        return entry;
      }
    }
    return undefined;
  }
}

export const defaultWalletManager = new MultiWalletManager();
