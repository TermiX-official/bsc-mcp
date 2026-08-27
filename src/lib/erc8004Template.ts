/**
 * ERC-8004 Agent Registration URI and Parameter Resolver
 * Resolves Issue #32: Unsubstituted {agentId} template parameter
 */

export interface AgentTemplateContext {
  agentId: string | number;
  walletAddress?: string;
  chainId?: number;
  metadataUri?: string;
}

export class ERC8004TemplateResolver {
  /**
   * Replace all placeholders (e.g. {agentId}, {walletAddress}, {chainId}) in template string or URL
   */
  public static resolveTemplate(templateStr: string, context: AgentTemplateContext): string {
    if (!templateStr || typeof templateStr !== 'string') {
      return '';
    }

    let resolved = templateStr;

    if (context.agentId !== undefined && context.agentId !== null) {
      const cleanId = encodeURIComponent(context.agentId.toString());
      resolved = resolved
        .replace(/\{agentId\}/gi, cleanId)
        .replace(/\{agent_id\}/gi, cleanId)
        .replace(/\{id\}/gi, cleanId)
        .replace(/\{tokenId\}/gi, cleanId);
    }

    if (context.walletAddress) {
      const cleanAddr = encodeURIComponent(context.walletAddress);
      resolved = resolved
        .replace(/\{walletAddress\}/gi, cleanAddr)
        .replace(/\{wallet_address\}/gi, cleanAddr)
        .replace(/\{address\}/gi, cleanAddr);
    }

    if (context.chainId !== undefined) {
      resolved = resolved.replace(/\{chainId\}/gi, context.chainId.toString());
    }

    if (context.metadataUri) {
      resolved = resolved.replace(/\{metadataUri\}/gi, context.metadataUri);
    }

    return resolved;
  }

  /**
   * Validate that all required placeholders have been successfully resolved
   */
  public static validateNoRemainingPlaceholders(resolvedStr: string): { isValid: boolean; remainingPlaceholders: string[] } {
    const regex = /\{([a-zA-Z0-9_]+)\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(resolvedStr)) !== null) {
      matches.push(match[0]);
    }

    return {
      isValid: matches.length === 0,
      remainingPlaceholders: matches,
    };
  }

  /**
   * Build complete ERC-8004 metadata URL for an agent
   */
  public static buildAgentMetadataUrl(baseTemplate: string, agentId: string | number, defaultBaseUrl = 'https://aacp-backend.termix.live/api/v1/agents/{agentId}'): string {
    const template = baseTemplate || defaultBaseUrl;
    const resolved = this.resolveTemplate(template, { agentId });
    const validation = this.validateNoRemainingPlaceholders(resolved);

    if (!validation.isValid) {
      throw new Error(`Unresolved placeholders in ERC-8004 URL: ${validation.remainingPlaceholders.join(', ')}`);
    }

    return resolved;
  }
}
