import { MultiWalletManager } from '../MultiWalletManager.js';
import { generatePrivateKey } from 'viem/accounts';

describe('MultiWalletManager (Issue #30)', () => {
  let manager: MultiWalletManager;

  beforeEach(() => {
    manager = new MultiWalletManager();
  });

  it('should register and switch between multiple raw wallets', () => {
    const pk1 = generatePrivateKey();
    const pk2 = generatePrivateKey();

    const w1 = manager.registerRawWallet('agent_alpha', pk1);
    const w2 = manager.registerRawWallet('agent_beta', pk2);

    expect(manager.listAliases()).toContain('agent_alpha');
    expect(manager.listAliases()).toContain('agent_beta');

    const acc1 = manager.getAccount('agent_alpha');
    const acc2 = manager.getAccount('agent_beta');

    expect(acc1.address).toBe(w1.address);
    expect(acc2.address).toBe(w2.address);
    expect(acc1.address).not.toBe(acc2.address);
  });

  it('should support dynamic retrieval by wallet address', () => {
    const pk = generatePrivateKey();
    const w = manager.registerRawWallet('treasury', pk);

    const acc = manager.getAccount(w.address);
    expect(acc.address).toBe(w.address);
  });

  it('should throw error when accessing unregistered wallet', () => {
    expect(() => {
      manager.getAccount('non_existent_wallet');
    }).toThrow(/is not registered/);
  });

  it('should correctly set and get active wallet', () => {
    const pk = generatePrivateKey();
    manager.registerRawWallet('primary', pk);
    manager.setActiveWallet('primary');

    expect(manager.getActiveAlias()).toBe('primary');
    const defaultAcc = manager.getAccount();
    expect(defaultAcc).toBeDefined();
  });
});
