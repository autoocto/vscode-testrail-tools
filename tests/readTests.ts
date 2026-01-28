/**
 * Read-Only Tests for TestRail Language Model Tools
 * 
 * Tests all GET operations without modifying TestRail data.
 * Safe to run against production instances.
 * 
 * Coverage (20 tests):
 * - Projects: getTestRailProjects (all, filtered, paginated), getTestRailProject
 * - Suites: getTestRailSuites (all, paginated), getTestRailSuite  
 * - Sections: getTestRailSections (all, paginated), getTestRailSection
 * - Cases: getTestRailCases (all, filtered), getTestRailCase
 * - Users: getTestRailUsers (all, by project), getTestRailUser, getTestRailUserByEmail
 * - Groups: getTestRailGroups (all, paginated)
 * - Priorities: getTestRailPriorities
 * 
 * @module readTests
 */

import { TestContext, runTest } from './testUtils';
import { TEST_PAGINATION } from './constants';

export async function runReadTests(ctx: TestContext): Promise<void> {
    const { helper, existingProjectId, existingSuiteId, existingSectionId, existingCaseId, existingUserId, existingUserEmail } = ctx;

    // ===== PROJECT TESTS =====
    console.log('📁 === PROJECT READ TESTS ===\n');

    await runTest('getTestRailProjects - Get all projects', async () => {
        const resp = await helper.getProjects();
        if (!resp.projects || resp.projects.length === 0) {
            throw new Error('No projects returned');
        }
    });

    await runTest('getTestRailProjects - Filter by completed status', async () => {
        const resp = await helper.getProjects(0); // Active only
        if (!Array.isArray(resp.projects)) {
            throw new Error('Projects not returned as array');
        }
    });

    await runTest('getTestRailProjects - With pagination', async () => {
        const resp = await helper.getProjects(undefined, TEST_PAGINATION.DEFAULT_LIMIT, TEST_PAGINATION.DEFAULT_OFFSET);
        if (!resp.projects || typeof resp.limit !== 'number') {
            throw new Error('Pagination parameters not working');
        }
    });

    await runTest('getTestRailProject - Get specific project', async () => {
        if (!existingProjectId) throw new Error('No existing project');
        const project = await helper.getProject(existingProjectId);
        if (!project.id || !project.name) {
            throw new Error('Project details incomplete');
        }
    });

    console.log();

    // ===== SUITE TESTS =====
    console.log('📚 === SUITE READ TESTS ===\n');

    await runTest('getTestRailSuites - Get all suites', async () => {
        if (!existingProjectId) throw new Error('No existing project');
        const resp = await helper.getSuites(existingProjectId);
        if (!Array.isArray(resp.suites)) {
            throw new Error('Suites not returned as array');
        }
    });

    await runTest('getTestRailSuites - With pagination', async () => {
        if (!existingProjectId) throw new Error('No existing project');
        const resp = await helper.getSuites(existingProjectId, TEST_PAGINATION.SMALL_LIMIT, TEST_PAGINATION.DEFAULT_OFFSET);
        if (typeof resp.limit !== 'number') {
            throw new Error('Pagination not working');
        }
    });

    if (existingSuiteId) {
        await runTest('getTestRailSuite - Get specific suite', async () => {
            const suite = await helper.getSuite(existingSuiteId!);
            if (!suite.id || !suite.name) {
                throw new Error('Suite details incomplete');
            }
        });
    }

    console.log();

    // ===== SECTION TESTS =====
    console.log('📂 === SECTION READ TESTS ===\n');

    await runTest('getTestRailSections - Get all sections', async () => {
        if (!existingProjectId) throw new Error('No existing project');
        const resp = await helper.getSections(existingProjectId, existingSuiteId);
        if (!Array.isArray(resp.sections)) {
            throw new Error('Sections not returned as array');
        }
    });

    await runTest('getTestRailSections - With pagination', async () => {
        if (!existingProjectId) throw new Error('No existing project');
        const resp = await helper.getSections(existingProjectId, existingSuiteId, TEST_PAGINATION.SMALL_LIMIT, TEST_PAGINATION.DEFAULT_OFFSET);
        if (typeof resp.limit !== 'number') {
            throw new Error('Pagination not working');
        }
    });

    if (existingSectionId) {
        await runTest('getTestRailSection - Get specific section', async () => {
            const section = await helper.getSection(existingSectionId!);
            if (!section.id || !section.name) {
                throw new Error('Section details incomplete');
            }
        });
    }

    console.log();

    // ===== CASE TESTS =====
    console.log('🧪 === CASE READ TESTS ===\n');

    await runTest('getTestRailCases - Get all cases', async () => {
        if (!existingProjectId) throw new Error('No existing project');
        const resp = await helper.getCases(existingProjectId, {
            suite_id: existingSuiteId,
            limit: 10
        });
        if (!Array.isArray(resp.cases)) {
            throw new Error('Cases not returned as array');
        }
    });

    if (existingSectionId) {
        await runTest('getTestRailCases - Filter by section', async () => {
            if (!existingProjectId) throw new Error('No existing project');
            const resp = await helper.getCases(existingProjectId, {
                suite_id: existingSuiteId,
                section_id: existingSectionId,
                limit: 5
            });
            if (!Array.isArray(resp.cases)) {
                throw new Error('Cases not returned as array');
            }
        });
    }

    if (existingCaseId) {
        await runTest('getTestRailCase - Get specific case', async () => {
            const testCase = await helper.getCase(existingCaseId!);
            if (!testCase.id || !testCase.title) {
                throw new Error('Case details incomplete');
            }
        });
    }

    console.log();

    // ===== USER TESTS =====
    console.log('👤 === USER READ TESTS ===\n');

    await runTest('getTestRailUsers - Get all users', async () => {
        const users = await helper.getUsers();
        if (!Array.isArray(users) || users.length === 0) {
            throw new Error('No users returned');
        }
    }, { skipOnPermissionError: true });

    await runTest('getTestRailUsers - Get users for project', async () => {
        if (!existingProjectId) throw new Error('No project');
        const users = await helper.getUsers(existingProjectId);
        if (!Array.isArray(users)) {
            throw new Error('Users not returned as array');
        }
    }, { skipOnPermissionError: true });

    if (existingUserId) {
        await runTest('getTestRailUser - Get specific user', async () => {
            const user = await helper.getUser(existingUserId!);
            if (!user.id || !user.email) {
                throw new Error('User details incomplete');
            }
        }, { skipOnPermissionError: true });
    }

    if (existingUserEmail) {
        await runTest('getTestRailUserByEmail - Get user by email', async () => {
            const user = await helper.getUserByEmail(existingUserEmail!);
            if (!user.id || user.email !== existingUserEmail) {
                throw new Error('User lookup by email failed');
            }
        }, { skipOnPermissionError: true });
    }

    console.log();

    // ===== GROUP TESTS =====
    console.log('👥 === GROUP READ TESTS ===\n');

    await runTest('getTestRailGroups - Get all groups', async () => {
        const resp = await helper.getGroups();
        if (!Array.isArray(resp.groups)) {
            throw new Error('Groups not returned as array');
        }
    }, { skipOnPermissionError: true });

    await runTest('getTestRailGroups - With pagination', async () => {
        const resp = await helper.getGroups(TEST_PAGINATION.SMALL_LIMIT, TEST_PAGINATION.DEFAULT_OFFSET);
        if (typeof resp.limit !== 'number') {
            throw new Error('Pagination not working');
        }
    }, { skipOnPermissionError: true });

    console.log();

    // ===== PRIORITY TESTS =====
    console.log('⭐ === PRIORITY READ TESTS ===\n');

    await runTest('getTestRailPriorities - Get all priorities', async () => {
        const priorities = await helper.getPriorities();
        if (!Array.isArray(priorities) || priorities.length === 0) {
            throw new Error('No priorities returned');
        }
        const first = priorities[0];
        if (!first.id || !first.name) {
            throw new Error('Priority structure invalid');
        }
    });

    console.log();
}
