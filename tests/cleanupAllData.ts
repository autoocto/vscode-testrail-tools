/**
 * Cleanup All TestRail Data
 * 
 * WARNING: This script will DELETE all test data from TestRail!
 * Use with extreme caution. Only run on test instances.
 * 
 * Deletes in order:
 * 1. All test cases (within each section)
 * 2. All sections (within each suite)
 * 3. All suites (within each project)
 * 4. All projects (except protected ones)
 * 5. All groups (except default ones)
 * 
 * Usage:
 *   npm run test:cleanup          # Dry run (shows what would be deleted)
 *   npm run test:cleanup -- --confirm   # Actually delete everything
 * 
 * @module cleanupAllData
 */

import * as dotenv from 'dotenv';
import { loadTestRailConfig } from '../src/utils/configLoader';
import { TestRailHelper } from '../src/helpers/testrailHelper';

dotenv.config();

// Projects to protect from deletion (by name pattern)
const PROTECTED_PROJECT_PATTERNS = [
    /^Sample Project$/i,  // Default TestRail sample project
];

// Groups to protect from deletion (by name pattern)
const PROTECTED_GROUP_PATTERNS = [
    /^Lead$/i,
    /^Tester$/i,
    /^Designer$/i,
    /^Administrator$/i,
];

interface CleanupStats {
    projects: { found: number; deleted: number; protected: number };
    suites: { found: number; deleted: number };
    sections: { found: number; deleted: number };
    cases: { found: number; deleted: number };
    groups: { found: number; deleted: number; protected: number };
}

function isProtectedProject(name: string): boolean {
    return PROTECTED_PROJECT_PATTERNS.some(pattern => pattern.test(name));
}

function isProtectedGroup(name: string): boolean {
    return PROTECTED_GROUP_PATTERNS.some(pattern => pattern.test(name));
}

async function cleanupAllData(dryRun: boolean): Promise<void> {
    console.log('🧹 TestRail Data Cleanup Tool\n');
    
    if (dryRun) {
        console.log('📋 DRY RUN MODE - No data will be deleted\n');
        console.log('   To actually delete, run: npm run test:cleanup -- --confirm\n');
    } else {
        console.log('⚠️  WARNING: This will DELETE all test data!\n');
        console.log('   Protected projects:', PROTECTED_PROJECT_PATTERNS.map(p => p.source).join(', '));
        console.log('   Protected groups:', PROTECTED_GROUP_PATTERNS.map(p => p.source).join(', '));
        console.log();
    }

    const config = loadTestRailConfig();
    if (!config) {
        console.error('❌ TestRail configuration not found');
        process.exit(1);
    }

    const helper = new TestRailHelper(config);
    const stats: CleanupStats = {
        projects: { found: 0, deleted: 0, protected: 0 },
        suites: { found: 0, deleted: 0 },
        sections: { found: 0, deleted: 0 },
        cases: { found: 0, deleted: 0 },
        groups: { found: 0, deleted: 0, protected: 0 },
    };

    console.log(`🔧 Connected to: ${config.baseUrl}`);
    console.log(`👤 User: ${config.email}\n`);

    // ===== CLEANUP PROJECTS =====
    console.log('📁 === PROJECTS ===\n');
    
    const projectsResp = await helper.getProjects();
    const projects = projectsResp.projects || [];
    stats.projects.found = projects.length;

    for (const project of projects) {
        if (isProtectedProject(project.name)) {
            stats.projects.protected++;
            console.log(`🔒 Protected: ${project.name} (ID: ${project.id})`);
            continue;
        }

        console.log(`\n📁 Project: ${project.name} (ID: ${project.id})`);

        // Get suites for this project
        try {
            const suitesResp = await helper.getSuites(project.id);
            const suites = suitesResp.suites || [];
            stats.suites.found += suites.length;

            for (const suite of suites) {
                console.log(`   📚 Suite: ${suite.name} (ID: ${suite.id})`);

                // Get sections for this suite
                try {
                    const sectionsResp = await helper.getSections(project.id, suite.id);
                    const sections = sectionsResp.sections || [];
                    stats.sections.found += sections.length;

                    for (const section of sections) {
                        console.log(`      📂 Section: ${section.name} (ID: ${section.id})`);

                        // Get cases for this section
                        try {
                            const casesResp = await helper.getCases(project.id, { 
                                suite_id: suite.id, 
                                section_id: section.id 
                            });
                            const cases = casesResp.cases || [];
                            stats.cases.found += cases.length;

                            for (const testCase of cases) {
                                if (dryRun) {
                                    console.log(`         🧪 Would delete case: ${testCase.title} (ID: ${testCase.id})`);
                                } else {
                                    await helper.deleteCase(testCase.id);
                                    stats.cases.deleted++;
                                    console.log(`         🗑️  Deleted case: ${testCase.title} (ID: ${testCase.id})`);
                                }
                            }
                        } catch (e: any) {
                            console.log(`         ⚠️  Could not get cases: ${e.message}`);
                        }

                        // Delete section
                        if (dryRun) {
                            console.log(`      📂 Would delete section: ${section.name}`);
                        } else {
                            try {
                                await helper.deleteSection(section.id);
                                stats.sections.deleted++;
                                console.log(`      🗑️  Deleted section: ${section.name}`);
                            } catch (e: any) {
                                console.log(`      ⚠️  Could not delete section: ${e.message}`);
                            }
                        }
                    }
                } catch (e: any) {
                    console.log(`      ⚠️  Could not get sections: ${e.message}`);
                }

                // Delete suite
                if (dryRun) {
                    console.log(`   📚 Would delete suite: ${suite.name}`);
                } else {
                    try {
                        await helper.deleteSuite(suite.id);
                        stats.suites.deleted++;
                        console.log(`   🗑️  Deleted suite: ${suite.name}`);
                    } catch (e: any) {
                        console.log(`   ⚠️  Could not delete suite: ${e.message}`);
                    }
                }
            }
        } catch (e: any) {
            console.log(`   ⚠️  Could not get suites: ${e.message}`);
        }

        // Delete project
        if (dryRun) {
            console.log(`📁 Would delete project: ${project.name}`);
        } else {
            try {
                await helper.deleteProject(project.id);
                stats.projects.deleted++;
                console.log(`🗑️  Deleted project: ${project.name}`);
            } catch (e: any) {
                console.log(`⚠️  Could not delete project: ${e.message}`);
            }
        }
    }

    // ===== CLEANUP GROUPS =====
    console.log('\n👥 === GROUPS ===\n');

    try {
        const groupsResp = await helper.getGroups();
        const groups = groupsResp.groups || [];
        stats.groups.found = groups.length;

        for (const group of groups) {
            if (isProtectedGroup(group.name)) {
                stats.groups.protected++;
                console.log(`🔒 Protected: ${group.name} (ID: ${group.id})`);
                continue;
            }

            if (dryRun) {
                console.log(`👥 Would delete group: ${group.name} (ID: ${group.id})`);
            } else {
                try {
                    await helper.deleteGroup(group.id);
                    stats.groups.deleted++;
                    console.log(`🗑️  Deleted group: ${group.name} (ID: ${group.id})`);
                } catch (e: any) {
                    console.log(`⚠️  Could not delete group ${group.name}: ${e.message}`);
                }
            }
        }
    } catch (e: any) {
        console.log(`⚠️  Could not get groups: ${e.message}`);
    }

    // ===== SUMMARY =====
    console.log('\n✨ === CLEANUP SUMMARY ===\n');
    
    if (dryRun) {
        console.log('📋 DRY RUN - Nothing was actually deleted\n');
    }

    console.log(`Projects:  ${stats.projects.found} found, ${stats.projects.deleted} deleted, ${stats.projects.protected} protected`);
    console.log(`Suites:    ${stats.suites.found} found, ${stats.suites.deleted} deleted`);
    console.log(`Sections:  ${stats.sections.found} found, ${stats.sections.deleted} deleted`);
    console.log(`Cases:     ${stats.cases.found} found, ${stats.cases.deleted} deleted`);
    console.log(`Groups:    ${stats.groups.found} found, ${stats.groups.deleted} deleted, ${stats.groups.protected} protected`);

    if (dryRun) {
        console.log('\n💡 To actually delete, run: npm run test:cleanup -- --confirm');
    } else {
        console.log('\n✅ Cleanup complete!');
    }
}

// Main execution
const args = process.argv.slice(2);
const confirmDelete = args.includes('--confirm') || args.includes('-y');

cleanupAllData(!confirmDelete).catch((error) => {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
});
