/**
 * Delete Tests for TestRail Language Model Tools
 * 
 * Tests all DELETE operations by cleaning up test data created by writeTests.
 * Reads test data IDs from state file created by write tests.
 * 
 * Run this AFTER running write tests and manually verifying in TestRail.
 * 
 * Coverage (5 tests):
 * - deleteTestRailCase
 * - deleteTestRailSection
 * - deleteTestRailSuite
 * - deleteTestRailProject
 * - deleteTestRailGroup
 * 
 * @module deleteTests
 */

import { TestContext, runTest } from './testUtils';
import { loadTestState, clearTestState, printTestState, hasTestState } from './testState';

export async function runDeleteTests(ctx: TestContext): Promise<boolean> {
    const { helper } = ctx;

    // Load test state from file
    const state = loadTestState();
    
    if (!state) {
        console.log('❌ No test state found. Please run write tests first (npm run test:write).\n');
        return false;
    }

    // Print current state
    printTestState();

    // Populate context from saved state
    ctx.testProjectId = state.testProjectId;
    ctx.testSuiteId = state.testSuiteId;
    ctx.testSectionId = state.testSectionId;
    ctx.testCaseId = state.testCaseId;
    ctx.testGroupId = state.testGroupId;

    console.log('🧹 === DELETE TESTS ===\n');

    // Delete in reverse order of dependencies

    if (ctx.testCaseId) {
        await runTest('deleteTestRailCase - Delete test case', async () => {
            await helper.deleteCase(ctx.testCaseId!);
            console.log(`   🗑️  Deleted case ID: ${ctx.testCaseId}`);
        }, { required: false });
    }

    if (ctx.testSectionId) {
        await runTest('deleteTestRailSection - Delete test section', async () => {
            await helper.deleteSection(ctx.testSectionId!);
            console.log(`   🗑️  Deleted section ID: ${ctx.testSectionId}`);
        }, { required: false });
    }

    if (ctx.testSuiteId) {
        await runTest('deleteTestRailSuite - Delete test suite', async () => {
            await helper.deleteSuite(ctx.testSuiteId!);
            console.log(`   🗑️  Deleted suite ID: ${ctx.testSuiteId}`);
        }, { required: false });
    }

    if (ctx.testProjectId) {
        await runTest('deleteTestRailProject - Delete test project', async () => {
            await helper.deleteProject(ctx.testProjectId!);
            console.log(`   🗑️  Deleted project ID: ${ctx.testProjectId}`);
        }, { required: false });
    }

    if (ctx.testGroupId) {
        await runTest('deleteTestRailGroup - Delete test group', async () => {
            await helper.deleteGroup(ctx.testGroupId!);
            console.log(`   🗑️  Deleted group ID: ${ctx.testGroupId}`);
        }, { required: false, skipOnPermissionError: true });
    }

    console.log();

    // Clear state file after successful cleanup
    clearTestState();

    return true;
}

/**
 * Check if there's pending test data to delete
 */
export function hasPendingDelete(): boolean {
    return hasTestState();
}

/**
 * Show current test state without deleting
 */
export function showPendingDelete(): void {
    if (hasTestState()) {
        printTestState();
    } else {
        console.log('📋 No pending test data to delete.\n');
    }
}
