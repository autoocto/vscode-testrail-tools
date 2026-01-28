/**
 * Test Utilities for TestRail Language Model Tools
 * 
 * This module provides shared utilities for testing all 31 TestRail language model tools.
 * It handles test context initialization, result tracking, and state management.
 * 
 * Key Functions:
 * - initTestContext(): Sets up test environment with existing TestRail data
 * - runTest(): Executes individual tests with error handling and result tracking  
 * - printSummary(): Displays test execution summary with pass/fail counts
 * 
 * @module testUtils
 */

import * as dotenv from 'dotenv';
import { loadTestRailConfig, TestRailConfig } from '../src/utils/configLoader';
import { TestRailHelper } from '../src/helpers/testrailHelper';

dotenv.config();

export interface TestStats {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
}

export interface TestContext {
    config: TestRailConfig;
    helper: TestRailHelper;
    existingProjectId?: number;
    existingSuiteId?: number;
    existingSectionId?: number;
    existingCaseId?: number;
    existingUserId?: number;
    existingUserEmail?: string;
    // Test data IDs (for write/delete tests)
    testProjectId?: number;
    testSuiteId?: number;
    testSectionId?: number;
    testCaseId?: number;
    testGroupId?: number;
}

export const stats: TestStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
};

export function resetStats(): void {
    stats.total = 0;
    stats.passed = 0;
    stats.failed = 0;
    stats.skipped = 0;
}

/**
 * Run a single test with error handling
 */
export async function runTest(
    name: string, 
    fn: () => Promise<void>, 
    options: { required?: boolean; skipOnPermissionError?: boolean } = {}
): Promise<boolean> {
    const { required = true, skipOnPermissionError = false } = options;
    stats.total++;
    
    try {
        await fn();
        stats.passed++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error: any) {
        const isPermissionError = error.message.includes('403') || error.message.includes('401');
        
        if (skipOnPermissionError && isPermissionError) {
            stats.skipped++;
            console.log(`⚠️  ${name} - Skipped (insufficient permissions)`);
            return false;
        } else if (!required) {
            stats.skipped++;
            console.log(`⚠️  ${name} - Skipped: ${error.message}`);
            return false;
        } else {
            stats.failed++;
            console.error(`❌ ${name} - Failed: ${error.message}`);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            return false;
        }
    }
}

/**
 * Initialize test context with existing data
 */
export async function initTestContext(): Promise<TestContext | null> {
    const config = loadTestRailConfig();
    if (!config) {
        console.error('❌ TestRail configuration not found');
        console.error('Please set TESTRAIL_BASE_URL, TESTRAIL_EMAIL, and TESTRAIL_API_KEY');
        return null;
    }

    const helper = new TestRailHelper(config);
    const ctx: TestContext = { config, helper };

    try {
        // Get existing project
        const projectsResp = await helper.getProjects();
        const projects = projectsResp.projects || [];
        
        if (projects.length === 0) {
            console.error('❌ No projects found. Cannot run tests without at least one project.');
            return null;
        }

        ctx.existingProjectId = projects[0].id;
        console.log(`📁 Using existing project: ${projects[0].name} (ID: ${ctx.existingProjectId})`);

        // Get existing suite
        const suitesResp = await helper.getSuites(ctx.existingProjectId);
        const suites = suitesResp.suites || [];
        if (suites.length > 0) {
            ctx.existingSuiteId = suites[0].id;
            console.log(`📚 Using existing suite: ${suites[0].name} (ID: ${ctx.existingSuiteId})`);
            
            // Get existing section
            const sectionsResp = await helper.getSections(ctx.existingProjectId, ctx.existingSuiteId);
            const sections = sectionsResp.sections || [];
            if (sections.length > 0) {
                ctx.existingSectionId = sections[0].id;
                console.log(`📂 Using existing section: ${sections[0].name} (ID: ${ctx.existingSectionId})`);
            }
            
            // Get existing case
            const casesResp = await helper.getCases(ctx.existingProjectId, { suite_id: ctx.existingSuiteId, limit: 1 });
            const cases = casesResp.cases || [];
            if (cases.length > 0) {
                ctx.existingCaseId = cases[0].id;
                console.log(`🧪 Using existing case: ${cases[0].title} (ID: ${ctx.existingCaseId})`);
            }
        }

        // Get existing user
        try {
            const users = await helper.getUsers(ctx.existingProjectId);
            if (users.length > 0) {
                ctx.existingUserId = users[0].id;
                ctx.existingUserEmail = users[0].email;
                console.log(`👤 Using existing user: ${users[0].name} (ID: ${ctx.existingUserId})`);
            }
        } catch (e) {
            // Users API may require admin permissions
        }

        console.log();
        return ctx;
    } catch (error: any) {
        console.error('❌ Failed to initialize test context:', error.message);
        return null;
    }
}

/**
 * Print test summary
 */
export function printSummary(): void {
    console.log('\n✨ === TEST SUMMARY ===\n');
    console.log(`Total Tests:   ${stats.total}`);
    console.log(`✅ Passed:     ${stats.passed}`);
    console.log(`❌ Failed:     ${stats.failed}`);
    if (stats.skipped > 0) {
        console.log(`⚠️  Skipped:    ${stats.skipped}`);
    }
    console.log();

    if (stats.failed > 0) {
        console.error('❌ Some tests failed. Please review the output above.');
    } else {
        console.log('✅ All tests passed successfully!');
    }
}

/**
 * Print tool coverage summary
 */
export function printToolCoverage(mode: 'read' | 'write' | 'delete' | 'all'): void {
    console.log('\n📋 Language Model Tools Coverage:');
    
    const readTools = {
        projects: 'getTestRailProjects, getTestRailProject',
        suites: 'getTestRailSuites, getTestRailSuite',
        sections: 'getTestRailSections, getTestRailSection',
        cases: 'getTestRailCases, getTestRailCase',
        users: 'getTestRailUsers, getTestRailUser, getTestRailUserByEmail',
        groups: 'getTestRailGroups, getTestRailGroup',
        others: 'getTestRailPriorities, getActiveTestRailEditor'
    };

    const writeTools = {
        projects: 'addTestRailProject, updateTestRailProject',
        suites: 'addTestRailSuite, updateTestRailSuite',
        sections: 'addTestRailSection, updateTestRailSection',
        cases: 'addTestRailCase, updateTestRailCase',
        groups: 'addTestRailGroup, updateTestRailGroup'
    };

    const deleteTools = {
        projects: 'deleteTestRailProject',
        suites: 'deleteTestRailSuite',
        sections: 'deleteTestRailSection',
        cases: 'deleteTestRailCase',
        groups: 'deleteTestRailGroup'
    };

    if (mode === 'read' || mode === 'all') {
        console.log('   📖 READ:');
        console.log(`      Projects:  ${readTools.projects}`);
        console.log(`      Suites:    ${readTools.suites}`);
        console.log(`      Sections:  ${readTools.sections}`);
        console.log(`      Cases:     ${readTools.cases}`);
        console.log(`      Users:     ${readTools.users}`);
        console.log(`      Groups:    ${readTools.groups}`);
        console.log(`      Others:    ${readTools.others}`);
    }
    
    if (mode === 'write' || mode === 'all') {
        console.log('   ✏️  WRITE (Create/Update):');
        console.log(`      Projects:  ${writeTools.projects}`);
        console.log(`      Suites:    ${writeTools.suites}`);
        console.log(`      Sections:  ${writeTools.sections}`);
        console.log(`      Cases:     ${writeTools.cases}`);
        console.log(`      Groups:    ${writeTools.groups}`);
    }
    
    if (mode === 'delete' || mode === 'all') {
        console.log('   🗑️  DELETE:');
        console.log(`      Projects:  ${deleteTools.projects}`);
        console.log(`      Suites:    ${deleteTools.suites}`);
        console.log(`      Sections:  ${deleteTools.sections}`);
        console.log(`      Cases:     ${deleteTools.cases}`);
        console.log(`      Groups:    ${deleteTools.groups}`);
    }
}

/**
 * Print configuration info
 */
export function printConfig(ctx: TestContext): void {
    console.log(`\n🔧 Configuration:`);
    console.log(`   Base URL: ${ctx.config.baseUrl}`);
    console.log(`   Email:    ${ctx.config.email}`);
}
