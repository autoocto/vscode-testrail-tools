/**
 * Setup CRM Test Data
 * 
 * Creates two CRM projects with different suite modes and realistic test data:
 * 
 * 1. CRM Sales Pro (Suite Mode 1 - Single Suite)
 *    - Lead Management
 *    - Contact Management
 *    - Opportunity Management
 *    - Quote Management
 * 
 * 2. CRM Enterprise (Suite Mode 3 - Multiple Suites)
 *    - Core CRM Suite (Leads, Contacts, Accounts)
 *    - Sales Suite (Opportunities, Quotes, Orders)
 *    - Support Suite (Cases, Knowledge Base, SLA)
 *    - Analytics Suite (Reports, Dashboards)
 * 
 * Also creates user groups for CRM testing.
 * 
 * Usage:
 *   npm run test:setup-crm
 * 
 * @module setupCrmData
 */

import * as dotenv from 'dotenv';
import { loadTestRailConfig } from '../src/utils/configLoader';
import { TestRailHelper } from '../src/helpers/testrailHelper';
import { saveTestState, TestDataIds } from './testState';

dotenv.config();

interface CreatedData extends TestDataIds {
    singleSuiteProjectId?: number;
    multiSuiteProjectId?: number;
    suiteIds: number[];
    sectionIds: number[];
    caseIds: number[];
    groupIds: number[];
}

// Test case templates for CRM features
const CRM_TEST_CASES = {
    // Lead Management
    leads: [
        { title: 'Create new lead with all required fields', priority_id: 2, estimate: '5m', refs: 'CRM-101' },
        { title: 'Create lead from web form submission', priority_id: 2, estimate: '10m', refs: 'CRM-102' },
        { title: 'Convert lead to contact and account', priority_id: 1, estimate: '15m', refs: 'CRM-103' },
        { title: 'Assign lead to sales representative', priority_id: 3, estimate: '5m', refs: 'CRM-104' },
        { title: 'Update lead status through sales pipeline', priority_id: 2, estimate: '10m', refs: 'CRM-105' },
        { title: 'Bulk import leads from CSV file', priority_id: 3, estimate: '20m', refs: 'CRM-106' },
        { title: 'Search and filter leads by criteria', priority_id: 2, estimate: '10m', refs: 'CRM-107' },
        { title: 'Delete lead with confirmation dialog', priority_id: 4, estimate: '5m', refs: 'CRM-108' },
    ],
    // Contact Management
    contacts: [
        { title: 'Create new contact with company association', priority_id: 2, estimate: '5m', refs: 'CRM-201' },
        { title: 'Edit contact details and save changes', priority_id: 2, estimate: '5m', refs: 'CRM-202' },
        { title: 'Link contact to multiple accounts', priority_id: 3, estimate: '10m', refs: 'CRM-203' },
        { title: 'View contact activity timeline', priority_id: 2, estimate: '10m', refs: 'CRM-204' },
        { title: 'Send email to contact from CRM', priority_id: 2, estimate: '15m', refs: 'CRM-205' },
        { title: 'Merge duplicate contacts', priority_id: 1, estimate: '20m', refs: 'CRM-206' },
        { title: 'Export contacts to vCard format', priority_id: 4, estimate: '10m', refs: 'CRM-207' },
    ],
    // Account Management
    accounts: [
        { title: 'Create new account with billing address', priority_id: 2, estimate: '5m', refs: 'CRM-301' },
        { title: 'View account hierarchy', priority_id: 3, estimate: '10m', refs: 'CRM-302' },
        { title: 'Update account industry and revenue', priority_id: 3, estimate: '5m', refs: 'CRM-303' },
        { title: 'View all related contacts for account', priority_id: 2, estimate: '5m', refs: 'CRM-304' },
        { title: 'View all opportunities for account', priority_id: 2, estimate: '5m', refs: 'CRM-305' },
        { title: 'Generate account statement', priority_id: 3, estimate: '15m', refs: 'CRM-306' },
    ],
    // Opportunity Management
    opportunities: [
        { title: 'Create opportunity with expected close date', priority_id: 1, estimate: '10m', refs: 'CRM-401' },
        { title: 'Update opportunity stage in pipeline', priority_id: 1, estimate: '5m', refs: 'CRM-402' },
        { title: 'Add products/services to opportunity', priority_id: 2, estimate: '15m', refs: 'CRM-403' },
        { title: 'Calculate opportunity value automatically', priority_id: 2, estimate: '10m', refs: 'CRM-404' },
        { title: 'Mark opportunity as won/lost', priority_id: 1, estimate: '5m', refs: 'CRM-405' },
        { title: 'Clone opportunity for renewal', priority_id: 3, estimate: '10m', refs: 'CRM-406' },
        { title: 'View opportunity probability forecast', priority_id: 2, estimate: '10m', refs: 'CRM-407' },
    ],
    // Quote Management
    quotes: [
        { title: 'Generate quote from opportunity', priority_id: 2, estimate: '15m', refs: 'CRM-501' },
        { title: 'Add line items with pricing', priority_id: 2, estimate: '10m', refs: 'CRM-502' },
        { title: 'Apply discount to quote', priority_id: 2, estimate: '5m', refs: 'CRM-503' },
        { title: 'Send quote PDF to customer', priority_id: 2, estimate: '10m', refs: 'CRM-504' },
        { title: 'Convert accepted quote to order', priority_id: 1, estimate: '15m', refs: 'CRM-505' },
        { title: 'Create quote revision', priority_id: 3, estimate: '10m', refs: 'CRM-506' },
    ],
    // Support Cases
    cases: [
        { title: 'Create support case from email', priority_id: 1, estimate: '10m', refs: 'CRM-601' },
        { title: 'Assign case to support agent', priority_id: 2, estimate: '5m', refs: 'CRM-602' },
        { title: 'Escalate case to supervisor', priority_id: 1, estimate: '5m', refs: 'CRM-603' },
        { title: 'Add internal notes to case', priority_id: 3, estimate: '5m', refs: 'CRM-604' },
        { title: 'Send customer response from case', priority_id: 2, estimate: '10m', refs: 'CRM-605' },
        { title: 'Close case with resolution', priority_id: 2, estimate: '5m', refs: 'CRM-606' },
        { title: 'Reopen closed case', priority_id: 3, estimate: '5m', refs: 'CRM-607' },
        { title: 'View case SLA countdown', priority_id: 2, estimate: '5m', refs: 'CRM-608' },
    ],
    // Knowledge Base
    knowledgeBase: [
        { title: 'Create knowledge article', priority_id: 3, estimate: '15m', refs: 'CRM-701' },
        { title: 'Search knowledge base', priority_id: 2, estimate: '10m', refs: 'CRM-702' },
        { title: 'Link article to support case', priority_id: 3, estimate: '5m', refs: 'CRM-703' },
        { title: 'Rate article helpfulness', priority_id: 4, estimate: '5m', refs: 'CRM-704' },
        { title: 'Publish/unpublish article', priority_id: 3, estimate: '5m', refs: 'CRM-705' },
    ],
    // Reports & Analytics
    reports: [
        { title: 'Generate sales pipeline report', priority_id: 2, estimate: '10m', refs: 'CRM-801' },
        { title: 'View lead conversion metrics', priority_id: 2, estimate: '10m', refs: 'CRM-802' },
        { title: 'Export report to Excel', priority_id: 3, estimate: '10m', refs: 'CRM-803' },
        { title: 'Schedule automated report delivery', priority_id: 3, estimate: '15m', refs: 'CRM-804' },
        { title: 'Create custom report filter', priority_id: 3, estimate: '15m', refs: 'CRM-805' },
    ],
    // Dashboards
    dashboards: [
        { title: 'View sales dashboard with KPIs', priority_id: 2, estimate: '5m', refs: 'CRM-901' },
        { title: 'Customize dashboard widgets', priority_id: 3, estimate: '15m', refs: 'CRM-902' },
        { title: 'Share dashboard with team', priority_id: 3, estimate: '10m', refs: 'CRM-903' },
        { title: 'Set dashboard refresh interval', priority_id: 4, estimate: '5m', refs: 'CRM-904' },
    ],
};

// User groups for CRM
const CRM_GROUPS = [
    'CRM Sales Team',
    'CRM Support Team',
    'CRM Managers',
    'CRM Administrators',
];

async function setupCrmData(): Promise<void> {
    console.log('🏢 CRM Test Data Setup\n');

    const config = loadTestRailConfig();
    if (!config) {
        console.error('❌ TestRail configuration not found');
        process.exit(1);
    }

    const helper = new TestRailHelper(config);
    const createdData: CreatedData = {
        suiteIds: [],
        sectionIds: [],
        caseIds: [],
        groupIds: [],
    };

    console.log(`🔧 Connected to: ${config.baseUrl}`);
    console.log(`👤 User: ${config.email}\n`);

    try {
        // ===== CREATE USER GROUPS =====
        console.log('👥 === CREATING USER GROUPS ===\n');

        for (const groupName of CRM_GROUPS) {
            try {
                const group = await helper.addGroup({ name: groupName });
                createdData.groupIds.push(group.id);
                console.log(`✅ Created group: ${groupName} (ID: ${group.id})`);
            } catch (e: any) {
                console.log(`⚠️  Could not create group ${groupName}: ${e.message}`);
            }
        }
        console.log();

        // ===== CREATE PROJECT 1: CRM Sales Pro (Single Suite Mode) =====
        console.log('📁 === PROJECT 1: CRM Sales Pro (Single Suite Mode) ===\n');

        const singleSuiteProject = await helper.addProject({
            name: 'CRM Sales Pro',
            announcement: 'CRM Sales Pro - Single suite mode project for small teams',
            show_announcement: true,
            suite_mode: 1  // Single suite repository
        });
        createdData.singleSuiteProjectId = singleSuiteProject.id;
        console.log(`✅ Created project: CRM Sales Pro (ID: ${singleSuiteProject.id})`);
        console.log(`   Suite Mode: 1 (Single Suite Repository)\n`);

        // For single suite mode, we create sections directly in the default suite
        // Get the default suite ID
        const singleSuitesResp = await helper.getSuites(singleSuiteProject.id);
        const defaultSuite = singleSuitesResp.suites?.[0];
        
        if (defaultSuite) {
            createdData.suiteIds.push(defaultSuite.id);
            console.log(`   Default suite ID: ${defaultSuite.id}\n`);

            // Create sections for single suite project
            const singleSuiteSections = [
                { name: 'Lead Management', cases: CRM_TEST_CASES.leads },
                { name: 'Contact Management', cases: CRM_TEST_CASES.contacts },
                { name: 'Opportunity Management', cases: CRM_TEST_CASES.opportunities },
                { name: 'Quote Management', cases: CRM_TEST_CASES.quotes },
            ];

            for (const sectionDef of singleSuiteSections) {
                const section = await helper.addSection(singleSuiteProject.id, {
                    name: sectionDef.name,
                    suite_id: defaultSuite.id,
                    description: `Test cases for ${sectionDef.name}`
                });
                createdData.sectionIds.push(section.id);
                console.log(`   📂 Created section: ${sectionDef.name} (ID: ${section.id})`);

                // Add test cases
                for (const caseDef of sectionDef.cases) {
                    const testCase = await helper.addCase(section.id, caseDef);
                    createdData.caseIds.push(testCase.id);
                    console.log(`      🧪 Created case: ${caseDef.title} (ID: ${testCase.id})`);
                }
            }
        }
        console.log();

        // ===== CREATE PROJECT 2: CRM Enterprise (Multiple Suites Mode) =====
        console.log('📁 === PROJECT 2: CRM Enterprise (Multiple Suites Mode) ===\n');

        const multiSuiteProject = await helper.addProject({
            name: 'CRM Enterprise',
            announcement: 'CRM Enterprise - Multi-suite project for enterprise deployments',
            show_announcement: true,
            suite_mode: 3  // Multiple suites
        });
        createdData.multiSuiteProjectId = multiSuiteProject.id;
        console.log(`✅ Created project: CRM Enterprise (ID: ${multiSuiteProject.id})`);
        console.log(`   Suite Mode: 3 (Multiple Suites)\n`);

        // Create multiple suites for enterprise project
        const enterpriseSuites = [
            {
                name: 'Core CRM Suite',
                description: 'Core CRM functionality - Leads, Contacts, Accounts',
                sections: [
                    { name: 'Lead Management', cases: CRM_TEST_CASES.leads },
                    { name: 'Contact Management', cases: CRM_TEST_CASES.contacts },
                    { name: 'Account Management', cases: CRM_TEST_CASES.accounts },
                ]
            },
            {
                name: 'Sales Suite',
                description: 'Sales operations - Opportunities, Quotes, Orders',
                sections: [
                    { name: 'Opportunity Management', cases: CRM_TEST_CASES.opportunities },
                    { name: 'Quote Management', cases: CRM_TEST_CASES.quotes },
                ]
            },
            {
                name: 'Support Suite',
                description: 'Customer support - Cases, Knowledge Base, SLA',
                sections: [
                    { name: 'Support Cases', cases: CRM_TEST_CASES.cases },
                    { name: 'Knowledge Base', cases: CRM_TEST_CASES.knowledgeBase },
                ]
            },
            {
                name: 'Analytics Suite',
                description: 'Reporting and analytics - Reports, Dashboards',
                sections: [
                    { name: 'Reports', cases: CRM_TEST_CASES.reports },
                    { name: 'Dashboards', cases: CRM_TEST_CASES.dashboards },
                ]
            },
        ];

        for (const suiteDef of enterpriseSuites) {
            const suite = await helper.addSuite(multiSuiteProject.id, {
                name: suiteDef.name,
                description: suiteDef.description
            });
            createdData.suiteIds.push(suite.id);
            console.log(`   📚 Created suite: ${suiteDef.name} (ID: ${suite.id})`);

            for (const sectionDef of suiteDef.sections) {
                const section = await helper.addSection(multiSuiteProject.id, {
                    name: sectionDef.name,
                    suite_id: suite.id,
                    description: `Test cases for ${sectionDef.name}`
                });
                createdData.sectionIds.push(section.id);
                console.log(`      📂 Created section: ${sectionDef.name} (ID: ${section.id})`);

                // Add test cases
                for (const caseDef of sectionDef.cases) {
                    const testCase = await helper.addCase(section.id, caseDef);
                    createdData.caseIds.push(testCase.id);
                    console.log(`         🧪 Created case: ${caseDef.title} (ID: ${testCase.id})`);
                }
            }
            console.log();
        }

        // ===== SUMMARY =====
        console.log('\n✨ === SETUP SUMMARY ===\n');
        console.log(`Projects created: 2`);
        console.log(`   - CRM Sales Pro (ID: ${createdData.singleSuiteProjectId}) - Single Suite Mode`);
        console.log(`   - CRM Enterprise (ID: ${createdData.multiSuiteProjectId}) - Multiple Suites Mode`);
        console.log(`Suites created: ${createdData.suiteIds.length}`);
        console.log(`Sections created: ${createdData.sectionIds.length}`);
        console.log(`Test cases created: ${createdData.caseIds.length}`);
        console.log(`Groups created: ${createdData.groupIds.length}`);

        // Save state for cleanup
        saveTestState({
            testProjectId: createdData.singleSuiteProjectId,
            // Store additional data in a simple format
        });

        console.log('\n✅ CRM test data setup complete!');
        console.log('\n💡 To clean up this data, run: npm run test:cleanup -- --confirm');

    } catch (error: any) {
        console.error('\n❌ Setup failed:', error.message);
        if (process.env.DEBUG) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Main execution
setupCrmData().catch((error) => {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
});
