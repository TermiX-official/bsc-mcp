import { ERC8004TemplateResolver } from '../lib/erc8004Template.js';

describe('ERC8004TemplateResolver (Issue #32)', () => {
  it('should substitute {agentId} correctly in URI templates', () => {
    const template = 'https://api.termix.live/v1/agents/{agentId}/metadata';
    const resolved = ERC8004TemplateResolver.resolveTemplate(template, { agentId: 42 });
    expect(resolved).toBe('https://api.termix.live/v1/agents/42/metadata');
  });

  it('should substitute multiple placeholders ({agentId}, {walletAddress}, {chainId})', () => {
    const template = 'https://aacp.termix.live/{chainId}/agent/{agentId}?owner={walletAddress}';
    const resolved = ERC8004TemplateResolver.resolveTemplate(template, {
      agentId: 'alpha-agent-01',
      walletAddress: '0x1234567890123456789012345678901234567890',
      chainId: 56,
    });

    expect(resolved).toBe('https://aacp.termix.live/56/agent/alpha-agent-01?owner=0x1234567890123456789012345678901234567890');
  });

  it('should detect unresolved placeholders with validateNoRemainingPlaceholders', () => {
    const brokenTemplate = 'https://api.termix.live/{unknownField}/agent/123';
    const validation = ERC8004TemplateResolver.validateNoRemainingPlaceholders(brokenTemplate);
    expect(validation.isValid).toBe(false);
    expect(validation.remainingPlaceholders).toContain('{unknownField}');
  });

  it('should build agent metadata URL cleanly', () => {
    const url = ERC8004TemplateResolver.buildAgentMetadataUrl(
      'https://aacp.termix.live/api/v1/agents/{agentId}',
      '888'
    );
    expect(url).toBe('https://aacp.termix.live/api/v1/agents/888');
  });
});
