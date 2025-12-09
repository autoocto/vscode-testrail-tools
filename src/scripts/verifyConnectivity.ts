/**
 * Verify connectivity to TestRail service
 * 
 * Usage: 
 *   npm run verify
 *   npx ts-node src/scripts/verifyConnectivity.ts
 */

import * as dotenv from 'dotenv';
import { loadTestRailConfig, TestRailConfig } from '../utils/configLoader';
import { TestRailHelper } from '../helpers/testrailHelper';

// Load environment variables from .env file
dotenv.config();

/**
 * Verify TestRail connectivity
 */
async function verifyTestRail(config: TestRailConfig): Promise<void> {
    if (config && config.baseUrl) {
        console.log('\n🔌 Testing TestRail connection...');
        const testrail = new TestRailHelper(config);

        try {
            // Try to get projects as a connectivity test
            const projects = await testrail.getProjects();
            console.log(`✅ Connected to TestRail: ${config.baseUrl}`);
            console.log(`👤 Logged in as: ${config.email}`);
            console.log(`📁 Found ${projects.length} accessible projects`);
            
            if (projects.length > 0) {
                console.log('\nSample projects:');
                projects.slice(0, 5).forEach((p: any) => {
                    console.log(`   - ${p.name} (ID: ${p.id})`);
                });
            }
        } catch (error: any) {
            console.error(`❌ TestRail connection error: ${error.message}`);
            if (error.message.includes('401')) {
                console.error('\n💡 Hint: Check your email and API key are correct');
            } else if (error.message.includes('404')) {
                console.error('\n💡 Hint: Check your TestRail base URL is correct');
            } else if (error.message.includes('ENOTFOUND')) {
                console.error('\n💡 Hint: Check your TestRail base URL and network connection');
            }
        }
    } else {
        console.log('\n⚠️  TestRail configuration not found');
    }
}

async function main() {
    console.log('🔍 Verifying TestRail connectivity...\n');

    // Load configuration
    let config: TestRailConfig | null;
    try {
        config = loadTestRailConfig();
        if (!config) {
            console.error('❌ Configuration error: Failed to load configuration');
            console.error('\nPlease set the following environment variables or VS Code settings:');
            console.error('  - TESTRAIL_BASE_URL (e.g., https://yourcompany.testrail.io)');
            console.error('  - TESTRAIL_EMAIL (your TestRail email)');
            console.error('  - TESTRAIL_API_KEY (generate from My Settings in TestRail)');
            console.error('\nAlternatively, configure in VS Code:');
            console.error('  Settings > TestRail Tools > TestRail Base URL/Email/API Key');
            process.exit(1);
        }
        console.log('✅ Configuration loaded successfully');
        console.log(`   Base URL: ${config.baseUrl}`);
        console.log(`   Email: ${config.email}`);
        console.log(`   API Key: ${'*'.repeat(config.apiKey.length)}`);
    } catch (error: any) {
        console.error('❌ Configuration error:', error.message);
        process.exit(1);
    }

    // Test connectivity
    await verifyTestRail(config);

    console.log('\n✅ Verification complete!');
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
