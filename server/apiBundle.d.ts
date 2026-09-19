/**
 * BLACKBOX X — Auto-generated API Bundle Declarations
 */

export declare function normalizeApiPath(req: any): string;
export declare function extractQueryString(req: any): string;
export declare function parseRequestBody(req: any): Promise<any>;
export declare function handleCors(req: any, res: any): boolean;
export declare function sendResponse(res: any, statusCode: number, data: any): void;
export declare function getHealthPayload(): any;
export declare function dispatchApiRequest(req: any, res: any): Promise<any>;

export declare function handleRiskBriefRequest(body: any): Promise<any>;
export declare function handleAssistantChatRequest(body: any): Promise<any>;
export declare function handleToolExecutionRequest(body: any): Promise<any>;
export declare function handleWebSearchRequest(body: any): Promise<any>;
export declare function handleResearchRequest(body: any): Promise<any>;
export declare function handleResearchHealthRequest(): Promise<any>;
export declare function handleListResearchCases(): Promise<any>;
export declare function handleGetResearchCase(caseId: string): Promise<any>;
export declare function handleSaveResearchCase(body: any): Promise<any>;
export declare function handleSaveReplayVerification(caseId: string, body: any): Promise<any>;
