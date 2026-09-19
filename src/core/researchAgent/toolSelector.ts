/**
 * BLACKBOX X — Tool Selector & Validation Guard
 * 
 * Inspects and validates tool requests before deterministic execution:
 * 1. Confirms membership in the strict 12-tool allowlist.
 * 2. Normalizes aliases.
 * 3. Applies Zod schema validation to ensure typesafe arguments.
 * 4. Guards against unauthorized actions or arbitrary code.
 */

import { AllowedResearchToolName, normalizeToolName, isToolAllowed, validateToolArguments } from './researchPolicy';

export interface ValidatedToolInvocation {
  isValid: boolean;
  toolName: AllowedResearchToolName | null;
  validatedArguments?: Record<string, any>;
  rejectionReason?: string;
}

/**
 * Validates a proposed tool execution against the strict allowlist and Zod schemas.
 */
export function selectAndValidateTool(
  rawToolName: string,
  rawArguments: Record<string, any>
): ValidatedToolInvocation {
  const canonicalName = normalizeToolName(rawToolName);

  if (!canonicalName || !isToolAllowed(canonicalName)) {
    return {
      isValid: false,
      toolName: null,
      rejectionReason: `Tool execution rejected: '${rawToolName}' is not in the BLACKBOX quantitative tool allowlist. The autonomous agent is strictly bounded to registered quantitative calculations.`,
    };
  }

  const validation = validateToolArguments(canonicalName, rawArguments);
  if (!validation.valid) {
    return {
      isValid: false,
      toolName: canonicalName,
      rejectionReason: validation.error || `Schema validation failed for tool '${canonicalName}'.`,
    };
  }

  return {
    isValid: true,
    toolName: canonicalName,
    validatedArguments: validation.parsedArgs,
  };
}
