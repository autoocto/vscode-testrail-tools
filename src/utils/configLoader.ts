export interface TestRailConfig {
    baseUrl: string;
    email: string;
    apiKey: string;
}

/**
 * Load TestRail configuration from VS Code settings or environment variables
 */
export function loadTestRailConfig(): TestRailConfig | null {
    let testrailBaseUrl = '';
    let testrailEmail = '';
    let testrailApiKey = '';

    // Try to load from VS Code settings first (if running in VS Code)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const vscode = require('vscode');
        const config = vscode.workspace.getConfiguration('testrailTools');
        
        testrailBaseUrl = config.get('testrailBaseUrl') || '';
        testrailEmail = config.get('testrailEmail') || '';
        testrailApiKey = config.get('testrailApiKey') || '';
    } catch {
        // Not in VS Code context, ignore
    }

    // Fall back to environment variables
    testrailBaseUrl = testrailBaseUrl || process.env.TESTRAIL_BASE_URL || '';
    testrailEmail = testrailEmail || process.env.TESTRAIL_EMAIL || '';
    testrailApiKey = testrailApiKey || process.env.TESTRAIL_API_KEY || '';
    
    if (!testrailBaseUrl || !testrailEmail || !testrailApiKey) {
        return null;
    }

    return {
        baseUrl: testrailBaseUrl,
        email: testrailEmail,
        apiKey: testrailApiKey
    };
}

/**
 * Validate TestRail configuration
 */
export function validateTestRailConfig(config: TestRailConfig | null): boolean {
    if (!config) {
        return false;
    }

    if (!config.baseUrl || !config.email || !config.apiKey) {
        return false;
    }

    return true;
}
