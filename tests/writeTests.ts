/**
 * Write Tests for TestRail Language Model Tools (Create/Update Only)
 * 
 * Tests all CREATE and UPDATE operations.
 * Creates test data and saves IDs to state file for later cleanup.
 * 
 * DELETE operations are in a separate file (deleteTests.ts) so you can:
 * 1. Run write tests to create data
 * 2. Manually verify changes in TestRail
 * 3. Run delete tests when ready
 * 
 * Coverage (15 tests):
 * - Projects: addTestRailProject, updateTestRailProject
 * - Suites: addTestRailSuite, updateTestRailSuite (+ get verification)
 * - Sections: addTestRailSection, updateTestRailSection (+ get verification)
 * - Cases: addTestRailCase, updateTestRailCase (+ get verification)
 * - Groups: addTestRailGroup, updateTestRailGroup (+ get verification)
 * 
 * @module writeTests
 */

import { TestContext, runTest } from './testUtils';
import { TEST_NAMING, TEST_PATTERNS } from './constants';
import { saveTestState } from './testState';

export async function runWriteTests(ctx: TestContext): Promise<void> {
    const { helper } = ctx;

    // ===== PROJECT WRITE TESTS =====
    console.log('📁 === PROJECT CREATE/UPDATE TESTS ===\n');

    await runTest('addTestRailProject - Create test project', async () => {
        const project = await helper.addProject({
            name: `${TEST_NAMING.PROJECT_PREFIX} ${Date.now()}`,
            announcement: 'Test project created by integration tests',
            show_announcement: false,
            suite_mode: 3 // Multiple suites
        });
        ctx.testProjectId = project.id;
        if (!project.id || !project.name) {
            throw new Error('Failed to create project');
        }
        console.log(`   📝 Created project ID: ${project.id}`);
    });

    await runTest('updateTestRailProject - Update test project', async () => {
        if (!ctx.testProjectId) throw new Error('No test project to update');
        const project = await helper.updateProject(ctx.testProjectId, {
            announcement: `${TEST_NAMING.UPDATED_SUFFIX} by integration test`,
            show_announcement: true
        });
        if (!project.announcement.includes(TEST_NAMING.UPDATED_SUFFIX)) {
            throw new Error('Project update failed');
        }
    });

    console.log();

    // ===== SUITE WRITE TESTS =====
    console.log('📚 === SUITE CREATE/UPDATE TESTS ===\n');

    await runTest('addTestRailSuite - Create test suite', async () => {
        if (!ctx.testProjectId) throw new Error('No test project');
        const suite = await helper.addSuite(ctx.testProjectId, {
            name: `${TEST_NAMING.SUITE_PREFIX} ${Date.now()}`,
            description: 'Test suite created by integration tests'
        });
        ctx.testSuiteId = suite.id;
        if (!suite.id || !suite.name) {
            throw new Error('Failed to create suite');
        }
        console.log(`   📝 Created suite ID: ${suite.id}`);
    });

    await runTest('getTestRailSuite - Verify created suite', async () => {
        if (!ctx.testSuiteId) throw new Error('No test suite');
        const suite = await helper.getSuite(ctx.testSuiteId);
        if (!suite.id || !suite.name) {
            throw new Error('Suite details incomplete');
        }
    });

    await runTest('updateTestRailSuite - Update test suite', async () => {
        if (!ctx.testSuiteId) throw new Error('No test suite');
        const suite = await helper.updateSuite(ctx.testSuiteId, {
            description: `${TEST_NAMING.UPDATED_SUFFIX} by integration test`
        });
        if (!suite.description.includes(TEST_NAMING.UPDATED_SUFFIX)) {
            throw new Error('Suite update failed');
        }
    });

    console.log();

    // ===== SECTION WRITE TESTS =====
    console.log('📂 === SECTION CREATE/UPDATE TESTS ===\n');

    await runTest('addTestRailSection - Create test section', async () => {
        if (!ctx.testProjectId || !ctx.testSuiteId) throw new Error('No test project/suite');
        const section = await helper.addSection(ctx.testProjectId, {
            name: `${TEST_NAMING.SECTION_PREFIX} ${Date.now()}`,
            description: 'Test section created by integration tests',
            suite_id: ctx.testSuiteId
        });
        ctx.testSectionId = section.id;
        if (!section.id || !section.name) {
            throw new Error('Failed to create section');
        }
        console.log(`   📝 Created section ID: ${section.id}`);
    });

    await runTest('getTestRailSection - Verify created section', async () => {
        if (!ctx.testSectionId) throw new Error('No test section');
        const section = await helper.getSection(ctx.testSectionId);
        if (!section.id || !section.name) {
            throw new Error('Section details incomplete');
        }
    });

    await runTest('updateTestRailSection - Update test section', async () => {
        if (!ctx.testSectionId) throw new Error('No test section');
        const section = await helper.updateSection(ctx.testSectionId, {
            description: `${TEST_NAMING.UPDATED_SUFFIX} by integration test`
        });
        if (!section.description.includes(TEST_NAMING.UPDATED_SUFFIX)) {
            throw new Error('Section update failed');
        }
    });

    console.log();

    // ===== CASE WRITE TESTS =====
    console.log('🧪 === CASE CREATE/UPDATE TESTS ===\n');

    await runTest('addTestRailCase - Create test case', async () => {
        if (!ctx.testSectionId) throw new Error('No test section');
        const testCase = await helper.addCase(ctx.testSectionId, {
            title: `${TEST_NAMING.CASE_PREFIX} ${Date.now()}`,
            priority_id: 2,
            estimate: '5m',
            refs: 'TEST-123'
        });
        ctx.testCaseId = testCase.id;
        if (!testCase.id || !testCase.title) {
            throw new Error('Failed to create case');
        }
        console.log(`   📝 Created case ID: ${testCase.id}`);
    });

    await runTest('getTestRailCase - Verify created case', async () => {
        if (!ctx.testCaseId) throw new Error('No test case');
        const testCase = await helper.getCase(ctx.testCaseId);
        if (!testCase.id || !testCase.title) {
            throw new Error('Case details incomplete');
        }
    });

    await runTest('updateTestRailCase - Update test case', async () => {
        if (!ctx.testCaseId) throw new Error('No test case');
        const testCase = await helper.updateCase(ctx.testCaseId, {
            estimate: '10m',
            refs: 'TEST-456'
        });
        // TestRail returns '10min' for '10m' input - validate it contains a number
        if (!testCase.estimate || !TEST_PATTERNS.ESTIMATE_PATTERN.test(testCase.estimate)) {
            throw new Error(`Case update failed - estimate is: ${testCase.estimate}`);
        }
    });

    console.log();

    // ===== GROUP WRITE TESTS =====
    console.log('👥 === GROUP CREATE/UPDATE TESTS ===\n');

    await runTest('addTestRailGroup - Create test group', async () => {
        const group = await helper.addGroup({
            name: `${TEST_NAMING.GROUP_PREFIX} ${Date.now()}`
        });
        ctx.testGroupId = group.id;
        if (!group.id || !group.name) {
            throw new Error('Failed to create group');
        }
        console.log(`   📝 Created group ID: ${group.id}`);
    }, { skipOnPermissionError: true });

    if (ctx.testGroupId) {
        await runTest('getTestRailGroup - Verify created group', async () => {
            if (!ctx.testGroupId) throw new Error('No test group');
            const group = await helper.getGroup(ctx.testGroupId);
            if (!group.id || !group.name) {
                throw new Error('Group details incomplete');
            }
        }, { skipOnPermissionError: true });

        await runTest('updateTestRailGroup - Update test group', async () => {
            if (!ctx.testGroupId) throw new Error('No test group');
            const newName = `${TEST_NAMING.GROUP_PREFIX} ${TEST_NAMING.UPDATED_SUFFIX} ${Date.now()}`;
            const group = await helper.updateGroup(ctx.testGroupId, {
                name: newName
            });
            if (!group.name || !group.name.includes(TEST_NAMING.UPDATED_SUFFIX)) {
                throw new Error('Group update failed');
            }
        }, { skipOnPermissionError: true });
    }

    console.log();

    // Save test state for later cleanup
    saveTestState({
        testProjectId: ctx.testProjectId,
        testSuiteId: ctx.testSuiteId,
        testSectionId: ctx.testSectionId,
        testCaseId: ctx.testCaseId,
        testGroupId: ctx.testGroupId
    });
}
