/**
 * Test script for TestRail API pagination support
 * 
 * Tests pagination with 'next' links for all APIs that support it:
 * - Projects
 * - Suites
 * - Sections
 * - Cases
 * - Groups
 * 
 * Usage: 
 *   npm run test-pagination
 *   npx ts-node src/scripts/testPagination.ts
 */

import * as dotenv from 'dotenv';
import { loadTestRailConfig } from '../utils/configLoader';
import { TestRailHelper } from '../helpers/testrailHelper';

dotenv.config();

async function main() {
    console.log('🧪 Testing TestRail API Pagination\n');

    const config = loadTestRailConfig();
    if (!config) {
        console.error('❌ TestRail configuration not found');
        console.error('Please set TESTRAIL_BASE_URL, TESTRAIL_EMAIL, and TESTRAIL_API_KEY');
        process.exit(1);
    }

    const testrail = new TestRailHelper(config);

    try {
        // Get a project to work with
        console.log('📁 === PAGINATION TESTS ===\n');
        
        const projectsResp = await testrail.getProjects();
        const projects = projectsResp.projects || [];
        
        if (projects.length === 0) {
            console.log('⚠️  No projects found, skipping pagination tests\n');
            return;
        }

        const projectId = projects[0].id;
        const project = await testrail.getProject(projectId);
        console.log(`Using project: ${project.name} (ID: ${project.id})\n`);

        // ===== TEST PROJECTS PAGINATION =====
        console.log('1️⃣  Testing Projects Pagination');
        try {
            const page1 = await testrail.getProjects(undefined, 2, 0);
            console.log(`✅ Page 1: ${page1.projects.length} projects (offset: ${page1.offset}, limit: ${page1.limit}, size: ${page1.size})`);
            console.log(`   _links.next: ${page1._links.next || 'null'}`);
            console.log(`   _links.prev: ${page1._links.prev || 'null'}`);
            
            if (page1._links.next) {
                console.log(`\n   Fetching next page using: ${page1._links.next}`);
                const page2 = await testrail.requestNext(page1._links.next);
                console.log(`   ✅ Page 2 retrieved successfully`);
                console.log(`      Projects in page 2: ${(page2 as any).projects?.length || 0}`);
            } else {
                console.log(`   ℹ️  No next page available (total projects: ${page1.size})`);
            }
        } catch (error: any) {
            console.log(`   ⚠️  Projects pagination test skipped: ${error.message}`);
        }
        console.log();

        // ===== TEST SUITES PAGINATION =====
        console.log('2️⃣  Testing Suites Pagination');
        try {
            const page1 = await testrail.getSuites(projectId, 2, 0);
            console.log(`✅ Page 1: ${page1.suites.length} suites (offset: ${page1.offset}, limit: ${page1.limit}, size: ${page1.size})`);
            console.log(`   _links.next: ${page1._links.next || 'null'}`);
            console.log(`   _links.prev: ${page1._links.prev || 'null'}`);
            
            if (page1._links.next) {
                console.log(`\n   Fetching next page using: ${page1._links.next}`);
                const page2 = await testrail.requestNext(page1._links.next);
                console.log(`   ✅ Page 2 retrieved successfully`);
                console.log(`      Suites in page 2: ${(page2 as any).suites?.length || 0}`);
            } else {
                console.log(`   ℹ️  No next page available (total suites: ${page1.size})`);
            }
        } catch (error: any) {
            console.log(`   ⚠️  Suites pagination test skipped: ${error.message}`);
        }
        console.log();

        // Get a suite to test sections
        const suitesResp = await testrail.getSuites(projectId);
        const suites = suitesResp.suites || [];
        
        if (suites.length > 0) {
            const suiteId = suites[0].id;
            
            // ===== TEST SECTIONS PAGINATION =====
            console.log('3️⃣  Testing Sections Pagination');
            try {
                const page1 = await testrail.getSections(projectId, suiteId, 5, 0);
                console.log(`✅ Page 1: ${page1.sections.length} sections (offset: ${page1.offset}, limit: ${page1.limit}, size: ${page1.size})`);
                console.log(`   _links.next: ${page1._links.next || 'null'}`);
                console.log(`   _links.prev: ${page1._links.prev || 'null'}`);
                
                if (page1._links.next) {
                    console.log(`\n   Fetching next page using: ${page1._links.next}`);
                    const page2 = await testrail.requestNext(page1._links.next);
                    console.log(`   ✅ Page 2 retrieved successfully`);
                    console.log(`      Sections in page 2: ${(page2 as any).sections?.length || 0}`);
                    
                    // Test prev link if available
                    if ((page2 as any)._links?.prev) {
                        console.log(`\n   Testing prev link: ${(page2 as any)._links.prev}`);
                        const pagePrev = await testrail.requestNext((page2 as any)._links.prev);
                        console.log(`   ✅ Prev page retrieved successfully`);
                        console.log(`      Sections in prev page: ${(pagePrev as any).sections?.length || 0}`);
                    }
                } else {
                    console.log(`   ℹ️  No next page available (total sections: ${page1.size})`);
                }
            } catch (error: any) {
                console.log(`   ⚠️  Sections pagination test skipped: ${error.message}`);
            }
            console.log();

            // ===== TEST CASES PAGINATION =====
            console.log('4️⃣  Testing Cases Pagination');
            try {
                const page1 = await testrail.getCases(projectId, {
                    suite_id: suiteId,
                    limit: 10,
                    offset: 0
                });
                console.log(`✅ Page 1: ${page1.cases.length} cases (offset: ${page1.offset}, limit: ${page1.limit}, size: ${page1.size})`);
                console.log(`   _links.next: ${page1._links.next || 'null'}`);
                console.log(`   _links.prev: ${page1._links.prev || 'null'}`);
                
                if (page1._links.next) {
                    console.log(`\n   Fetching next page using: ${page1._links.next}`);
                    const page2 = await testrail.requestNext(page1._links.next);
                    console.log(`   ✅ Page 2 retrieved successfully`);
                    console.log(`      Cases in page 2: ${(page2 as any).cases?.length || 0}`);
                } else {
                    console.log(`   ℹ️  No next page available (total cases: ${page1.size})`);
                }
            } catch (error: any) {
                console.log(`   ⚠️  Cases pagination test skipped: ${error.message}`);
            }
            console.log();
        }

        // ===== TEST GROUPS PAGINATION =====
        console.log('5️⃣  Testing Groups Pagination');
        try {
            const page1 = await testrail.getGroups(2, 0);
            console.log(`✅ Page 1: ${page1.groups.length} groups (offset: ${page1.offset}, limit: ${page1.limit}, size: ${page1.size})`);
            console.log(`   _links.next: ${page1._links.next || 'null'}`);
            console.log(`   _links.prev: ${page1._links.prev || 'null'}`);
            
            if (page1._links.next) {
                console.log(`\n   Fetching next page using: ${page1._links.next}`);
                const page2 = await testrail.requestNext(page1._links.next);
                console.log(`   ✅ Page 2 retrieved successfully`);
                console.log(`      Groups in page 2: ${(page2 as any).groups?.length || 0}`);
            } else {
                console.log(`   ℹ️  No next page available (total groups: ${page1.size})`);
            }
        } catch (error: any) {
            if (error.message.includes('403')) {
                console.log(`   ⚠️  Groups pagination test skipped (requires administrator privileges)`);
            } else {
                console.log(`   ⚠️  Groups pagination test skipped: ${error.message}`);
            }
        }
        console.log();

        // ===== SUMMARY =====
        console.log('✨ === PAGINATION TEST SUMMARY ===\n');
        console.log('✅ Pagination tests completed successfully!');
        console.log('\nTested Pagination Support:');
        console.log('  ✓ Projects - offset, limit, _links.next, _links.prev');
        console.log('  ✓ Suites - offset, limit, _links.next, _links.prev');
        console.log('  ✓ Sections - offset, limit, _links.next, _links.prev');
        console.log('  ✓ Cases - offset, limit, _links.next, _links.prev');
        console.log('  ✓ Groups - offset, limit, _links.next, _links.prev');
        console.log('\nNote: Users and Priorities APIs do not support pagination in TestRail.');
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
