/**
 * BLACKBOX X — Server API: Direct Tool Execution Endpoint
 * 
 * Endpoint: POST /api/ai/tool
 * Executes a single verified BLACKBOX tool and returns output.
 */

import { executeBlackboxTool } from '../../../src/core/aiTools';

export async function handleToolExecutionRequest(body: { tool?: string; args?: any }): Promise<{ success: boolean; data?: any; error?: string }> {
  const tool = body?.tool;
  const args = body?.args || {};

  if (!tool) {
    return { success: false, error: 'Tool name is required.' };
  }

  return await executeBlackboxTool(tool, args);
}
