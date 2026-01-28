/**
 * Main Test Runner for TestRail Language Model Tools
 * 
 * Supports multiple test modes:
 * - read:   Run read-only tests (GET operations)
 * - write:  Run write tests (CREATE/UPDATE) - saves state for later cleanup
 * - delete: Run delete tests - cleans up data created by write tests
 * - all:    Run all tests including immediate cleanup
 * - status: Show current test state (pending deletes)
 * 
 * Usage:
 *   npm run test:read     # Read-only tests
 *   npm run test:write    # Create/update tests (saves IDs)
 *   npm run test:delete   # Delete tests (cleans up saved IDs)
 *   npm run test:all      # All tests with immediate cleanup
 *   npm run test:status   # Show pending test data
 * 
 * All 31 Language Model Tools are covered:
 * - Projects: 5 tools (get, getAll, add, update, delete)
 * - Suites: 5 tools (get, getAll, add, update, delete)
 * - Sections: 5 tools (get, getAll, add, update, delete)
 * - Cases: 5 tools (get, getAll, add, update, delete)
 * - Users: 3 tools (get, getAll, getByEmail)
 * - Groups: 5 tools (get, getAll, add, update, delete)
 * - Priorities: 1 tool (getAll)
 * - Editor: 1 tool (getActiveTestRailEditor - UI only)
 * 
 * @module index
 */

import { 
    initTestContext, 
    printSummary, 
    printToolCoverage,
    printConfig,
    stats,
    resetStats
} from './testUtils';
import { runReadTests } from './readTests';
import { runWriteTests } from './writeTests';
import { runDeleteTests, showPendingDelete, hasPendingDelete } from './deleteTests';

type TestMode = 'read' | 'write' | 'delete' | 'all' | 'status';

function getTestMode(): TestMode {
    const args = process.argv.slice(2);
    
    if (args.includes('--read') || args.includes('-r')) return 'read';
    if (args.includes('--write') || args.includes('-w')) return 'write';
    if (args.includes('--delete') || args.includes('-d')) return 'delete';
    if (args.includes('--all') || args.includes('-a')) return 'all';
    if (args.includes('--status') || args.includes('-s')) return 'status';
    
    // Default to read
    return 'read';
}

function printUsage(): void {
    console.log('📖 Usage:');
    console.log('   npm run test:read     or  npx ts-node tests/index.ts --read');
    console.log('   npm run test:write    or  npx ts-node tests/index.ts --write');
    console.log('   npm run test:delete   or  npx ts-node tests/index.ts --delete');
    console.log('   npm run test:all      or  npx ts-node tests/index.ts --all');
    console.log('   npm run test:status   or  npx ts-node tests/index.ts --status');
    console.log();
}

async function main(): Promise<void> {
    const mode = getTestMode();
    
    console.log('🧪 TestRail Language Model Tools - Integration Tests\n');

    // Handle status mode separately
    if (mode === 'status') {
        showPendingDelete();
        return;
    }

    // Print mode information
    switch (mode) {
        case 'read':
            console.log('📖 READ MODE: Testing GET operations only (safe for production).\n');
            break;
        case 'write':
            console.log('✏️  WRITE MODE: Testing CREATE/UPDATE operations.');
            console.log('   Test data IDs will be saved for later cleanup.');
            console.log('   Run "npm run test:delete" after verifying in TestRail.\n');
            break;
        case 'delete':
            console.log('🗑️  DELETE MODE: Cleaning up test data created by write tests.\n');
            break;
        case 'all':
            console.log('🔄 ALL MODE: Running all tests with immediate cleanup.\n');
            break;
    }

    // Check for pending deletes
    if (mode === 'write' && hasPendingDelete()) {
        console.log('⚠️  Warning: There is pending test data from a previous run.');
        console.log('   Consider running "npm run test:delete" first to clean up.\n');
    }

    // Reset stats
    resetStats();

    // Initialize context
    console.log('📋 === SETUP ===\n');
    const ctx = await initTestContext();
    
    if (!ctx) {
        process.exit(1);
    }

    try {
        // Run tests based on mode
        if (mode === 'read' || mode === 'all') {
            await runReadTests(ctx);
        }

        if (mode === 'write' || mode === 'all') {
            await runWriteTests(ctx);
        }

        if (mode === 'delete') {
            const hasState = await runDeleteTests(ctx);
            if (!hasState) {
                process.exit(1);
            }
        }

        if (mode === 'all') {
            // Immediate cleanup in 'all' mode
            await runDeleteTests(ctx);
        }

        // Print summary
        printSummary();

        // Print tool coverage based on mode
        printToolCoverage(mode === 'all' ? 'all' : mode);

        // Note about UI-only tool
        console.log('\n📝 Note: getActiveTestRailEditor requires VS Code UI context and cannot be tested via CLI.');

        // Print config
        printConfig(ctx);

        // Next steps for write mode
        if (mode === 'write') {
            console.log('\n📋 Next Steps:');
            console.log('   1. Verify the test data in TestRail');
            console.log('   2. Run "npm run test:delete" to clean up');
        }

        // Exit with error if tests failed
        if (stats.failed > 0) {
            process.exit(1);
        }

    } catch (error: any) {
        console.error('\n❌ Test execution failed:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
