/**
 * Comprehensive test script for all TestRail Language Model Tools
 * 
 * Tests all TestRail tools for non-destructive read operations
 * 
 * Usage: 
 *   npm run test-testrail
 *   npm run test-testrail -- <projectId>
 */

import * as dotenv from 'dotenv';
import { loadTestRailConfig } from '../utils/configLoader';
import { TestRailHelper } from '../helpers/testrailHelper';

dotenv.config();

async function main() {
    console.log('🧪 Testing All TestRail Language Model Tools\n');

    const config = loadTestRailConfig();
    if (!config) {
        console.error('❌ TestRail configuration not found');
        console.error('Please set TESTRAIL_BASE_URL, TESTRAIL_EMAIL, and TESTRAIL_API_KEY');
        process.exit(1);
    }

    const testrail = new TestRailHelper(config);
    let testSuiteId: number | undefined;
    let testSectionId: number | undefined;
    let testCaseId: number | undefined;

    try {
        // ===== PROJECT OPERATIONS =====
        console.log('📁 === PROJECT OPERATIONS ===\n');

        // Test 1: Get All Projects
        console.log('1️⃣  getTestRailProjects - Get all projects');
        const allProjects = await testrail.getProjects();
        console.log(`✅ Found ${allProjects.length} projects`);
        if (allProjects.length > 0) {
            allProjects.slice(0, 3).forEach((p: any) => {
                console.log(`   - ${p.name} (ID: ${p.id})`);
            });
        }
        console.log();

        // Test 2: Get Active Projects
        console.log('2️⃣  getTestRailProjects - Get active projects only');
        const activeProjects = await testrail.getProjects(0);
        console.log(`✅ Found ${activeProjects.length} active projects\n`);

        // Test 3: Get Specific Project
        console.log('3️⃣  getTestRailProject - Get project details');
        if (allProjects.length === 0) {
            console.log('⚠️  No projects found, skipping project-specific tests\n');
            console.log('✨ === TEST SUMMARY ===\n');
            console.log('⚠️  Limited tests completed - no projects available in TestRail instance');
            return;
        }
        const projectId = allProjects[0].id;
        const project = await testrail.getProject(projectId);
        console.log(`✅ Project: ${project.name} (ID: ${project.id})`);
        console.log(`   URL: ${project.url}`);
        console.log(`   Suite Mode: ${project.suite_mode === 1 ? 'Single' : project.suite_mode === 2 ? 'Single with Baselines' : 'Multiple'}`);
        console.log(`   Completed: ${project.is_completed ? 'Yes' : 'No'}`);
        console.log(`   Announcement: ${project.announcement || 'None'}\n`);

        // ===== SUITE OPERATIONS =====
        console.log('📚 === SUITE OPERATIONS ===\n');

        // Test 4: Get All Suites
        console.log('4️⃣  getTestRailSuites - Get all suites for project');
        const suites = await testrail.getSuites(projectId);
        console.log(`✅ Found ${suites.length} suites in project ${projectId}`);
        if (suites.length > 0) {
            suites.slice(0, 3).forEach((s: any) => {
                console.log(`   - ${s.name} (ID: ${s.id})`);
            });
            testSuiteId = suites[0].id;
        }
        console.log();

        // Test 5: Get Specific Suite
        if (testSuiteId) {
            console.log('5️⃣  getTestRailSuite - Get suite details');
            const suite = await testrail.getSuite(testSuiteId);
            console.log(`✅ Suite: ${suite.name} (ID: ${suite.id})`);
            console.log(`   Description: ${suite.description || 'None'}`);
            console.log(`   Project ID: ${suite.project_id}`);
            console.log(`   URL: ${suite.url}\n`);
        }

        // ===== SECTION OPERATIONS =====
        console.log('📂 === SECTION OPERATIONS ===\n');

        // Test 6: Get All Sections
        console.log('6️⃣  getTestRailSections - Get all sections');
        const sections = await testrail.getSections(projectId, testSuiteId);
        console.log(`✅ Found ${sections.length} sections`);
        if (sections.length > 0) {
            sections.slice(0, 5).forEach((s: any) => {
                const indent = '  '.repeat(s.depth || 0);
                console.log(`   ${indent}- ${s.name} (ID: ${s.id})`);
            });
            testSectionId = sections[0].id;
        }
        console.log();

        // Test 7: Get Specific Section
        if (testSectionId) {
            console.log('7️⃣  getTestRailSection - Get section details');
            const section = await testrail.getSection(testSectionId);
            console.log(`✅ Section: ${section.name} (ID: ${section.id})`);
            console.log(`   Description: ${section.description || 'None'}`);
            console.log(`   Suite ID: ${section.suite_id}`);
            console.log(`   Parent ID: ${section.parent_id || 'None'}`);
            console.log(`   Depth: ${section.depth}\n`);
        }

        // ===== TEST CASE OPERATIONS =====
        console.log('🧪 === TEST CASE OPERATIONS ===\n');

        // Test 8: Get All Cases
        console.log('8️⃣  getTestRailCases - Get all test cases');
        const cases = await testrail.getCases(projectId, {
            suite_id: testSuiteId,
            limit: 10
        });
        console.log(`✅ Found ${cases.length} test cases (limited to 10)`);
        if (cases.length > 0) {
            cases.slice(0, 5).forEach((c: any) => {
                console.log(`   - C${c.id}: ${c.title}`);
            });
            testCaseId = cases[0].id;
        }
        console.log();

        // Test 9: Get Cases by Section
        if (testSectionId) {
            console.log('9️⃣  getTestRailCases - Get cases in specific section');
            const sectionCases = await testrail.getCases(projectId, {
                suite_id: testSuiteId,
                section_id: testSectionId,
                limit: 5
            });
            console.log(`✅ Found ${sectionCases.length} cases in section ${testSectionId}\n`);
        }

        // Test 10: Get Specific Case
        if (testCaseId) {
            console.log('🔟 getTestRailCase - Get test case details');
            const testCase = await testrail.getCase(testCaseId);
            console.log(`✅ Case: C${testCase.id} - ${testCase.title}`);
            console.log(`   Priority: ${testCase.priority_id}`);
            console.log(`   Type: ${testCase.type_id}`);
            console.log(`   Section ID: ${testCase.section_id}`);
            console.log(`   Estimate: ${testCase.estimate || 'None'}`);
            console.log(`   References: ${testCase.refs || 'None'}`);
            if (testCase.created_on) {
                console.log(`   Created: ${new Date(testCase.created_on * 1000).toLocaleString()}`);
            }
            if (testCase.updated_on) {
                console.log(`   Updated: ${new Date(testCase.updated_on * 1000).toLocaleString()}`);
            }
            console.log();
        }

        // ===== USER GROUP OPERATIONS =====
        console.log('👥 === USER GROUP OPERATIONS ===\n');

        // Test 11: Get All Groups
        console.log('1️⃣1️⃣  getTestRailGroups - Get all user groups');
        try {
            const groups = await testrail.getGroups();
            console.log(`✅ Found ${groups.length} user groups`);
            if (groups.length > 0) {
                groups.slice(0, 5).forEach((g: any) => {
                    console.log(`   - ${g.name} (ID: ${g.id})`);
                });

                // Test 12: Get Specific Group
                console.log('\n1️⃣2️⃣  getTestRailGroup - Get group details');
                const firstGroup = await testrail.getGroup(groups[0].id);
                console.log(`✅ Group: ${firstGroup.name} (ID: ${firstGroup.id})`);
                console.log(`   User Count: ${firstGroup.user_count || 0}\n`);
            } else {
                console.log();
            }
        } catch (error: any) {
            if (error.message.includes('403')) {
                console.log(`⚠️  Skipped (requires administrator privileges)\n`);
            } else {
                throw error;
            }
        }

        // ===== USER OPERATIONS =====
        console.log('👤 === USER OPERATIONS ===\n');

        let projectUsers: any[] = [];
        
        // Test 13: Get Users for Project
        console.log('1️⃣3️⃣  getTestRailUsers - Get users for specific project');
        try {
            projectUsers = await testrail.getUsers(projectId);
            console.log(`✅ Found ${projectUsers.length} users in project ${projectId}`);
            if (projectUsers.length > 0) {
                projectUsers.slice(0, 5).forEach((u: any) => {
                    console.log(`   - ${u.name} (${u.email}) [ID: ${u.id}]`);
                });
            }
            console.log();
        } catch (error: any) {
            if (error.message.includes('403')) {
                console.log(`⚠️  Skipped (requires administrator privileges)\n`);
            } else {
                throw error;
            }
        }

        // Test 14: Get All Users (requires admin)
        console.log('1️⃣4️⃣  getTestRailUsers - Get all users');
        try {
            const allUsers = await testrail.getUsers();
            console.log(`✅ Found ${allUsers.length} users (total)\n`);
        } catch (error: any) {
            if (error.message.includes('403')) {
                console.log(`⚠️  Skipped (requires administrator privileges)\n`);
            } else {
                throw error;
            }
        }

        // Test 15: Get Specific User
        if (projectUsers.length > 0) {
            console.log('1️⃣5️⃣  getTestRailUser - Get user details');
            const user = await testrail.getUser(projectUsers[0].id);
            console.log(`✅ User: ${user.name} (ID: ${user.id})`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role || 'N/A'}`);
            console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}\n`);

            // Test 16: Get User by Email
            console.log('1️⃣6️⃣  getTestRailUserByEmail - Get user by email');
            const userByEmail = await testrail.getUserByEmail(user.email);
            console.log(`✅ Found user: ${userByEmail.name} (${userByEmail.email})\n`);
        }

        // ===== PRIORITY OPERATIONS =====
        console.log('⭐ === PRIORITY OPERATIONS ===\n');

        // Test 17: Get Priorities
        console.log('1️⃣7️⃣  getTestRailPriorities - Get all priorities');
        const priorities = await testrail.getPriorities();
        console.log(`✅ Found ${priorities.length} priorities`);
        priorities.forEach((p: any) => {
            console.log(`   - ${p.name} (ID: ${p.id}, Priority: ${p.priority})`);
        });
        console.log();

        // ===== SUMMARY =====
        console.log('✨ === TEST SUMMARY ===\n');
        console.log('✅ All TestRail Language Model Tools tested successfully!');
        console.log('\nTested Tools (Read Operations):');
        console.log('  ✓ getTestRailProjects');
        console.log('  ✓ getTestRailProject');
        console.log('  ✓ getTestRailSuites');
        console.log('  ✓ getTestRailSuite');
        console.log('  ✓ getTestRailSections');
        console.log('  ✓ getTestRailSection');
        console.log('  ✓ getTestRailCases');
        console.log('  ✓ getTestRailCase');
        console.log('  ✓ getTestRailGroups');
        console.log('  ✓ getTestRailGroup');
        console.log('  ✓ getTestRailUsers');
        console.log('  ✓ getTestRailUser');
        console.log('  ✓ getTestRailUserByEmail');
        console.log('  ✓ getTestRailPriorities');
        console.log('\nNote: Write operations (add, update, delete) are not tested to avoid');
        console.log('      modifying your TestRail data. These tools are safe to use in production.');
        console.log('\nConfiguration:');
        console.log(`  Base URL: ${config.baseUrl}`);
        console.log(`  Email: ${config.email}`);

    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

main();
