# TestRail Tools Integration Tests

This folder contains integration tests for all 31 TestRail Language Model Tools.

## Test Commands

```bash
# Read-only tests (safe for production)
npm run test:read

# Create/Update tests (saves state for manual verification)
npm run test:write

# Delete tests (cleans up data from write tests)
npm run test:delete

# All tests with immediate cleanup
npm run test:all

# Check pending test data status
npm run test:status

# Setup CRM test data (creates 2 projects with realistic test cases)
npm run test:setup-crm

# Cleanup all TestRail data (dry run)
npm run test:cleanup

# Cleanup all TestRail data (DANGER - actually deletes!)
npm run test:cleanup -- --confirm
```

## Workflow

### Quick Test (All at once)
```bash
npm run test:all
```
This runs all tests and immediately cleans up test data.

### Manual Verification Workflow
```bash
# 1. Run write tests (creates test data)
npm run test:write

# 2. Go to TestRail and verify the created data
#    - Check project, suite, section, case, group

# 3. When satisfied, run delete tests
npm run test:delete
```

### CRM Demo Data Setup
```bash
# Setup realistic CRM test data
npm run test:setup-crm
```

This creates:
- **CRM Sales Pro** (Suite Mode 1 - Single Suite)
  - Lead Management, Contact Management, Opportunity Management, Quote Management
- **CRM Enterprise** (Suite Mode 3 - Multiple Suites)
  - Core CRM Suite, Sales Suite, Support Suite, Analytics Suite
- **User Groups**: CRM Sales Team, CRM Support Team, CRM Managers, CRM Administrators

### Full Cleanup
```bash
# Preview what will be deleted (dry run)
npm run test:cleanup

# Actually delete everything (except protected items)
npm run test:cleanup -- --confirm
```

Protected items (not deleted):
- Projects: "Sample Project"
- Groups: "Lead", "Tester", "Designer", "Administrator"

## Test Coverage

### All 31 Language Model Tools

| Category | Read Tools | Write Tools | Delete Tools |
|----------|-----------|-------------|--------------|
| Projects | getTestRailProjects, getTestRailProject | addTestRailProject, updateTestRailProject | deleteTestRailProject |
| Suites | getTestRailSuites, getTestRailSuite | addTestRailSuite, updateTestRailSuite | deleteTestRailSuite |
| Sections | getTestRailSections, getTestRailSection | addTestRailSection, updateTestRailSection | deleteTestRailSection |
| Cases | getTestRailCases, getTestRailCase | addTestRailCase, updateTestRailCase | deleteTestRailCase |
| Users | getTestRailUsers, getTestRailUser, getTestRailUserByEmail | - | - |
| Groups | getTestRailGroups, getTestRailGroup | addTestRailGroup, updateTestRailGroup | deleteTestRailGroup |
| Priorities | getTestRailPriorities | - | - |
| Editor | getActiveTestRailEditor* | - | - |

*Note: `getActiveTestRailEditor` requires VS Code UI context and cannot be tested via CLI.

## Test Files

| File | Description |
|------|-------------|
| `index.ts` | Main test runner with CLI argument handling |
| `testUtils.ts` | Shared utilities, context, and statistics |
| `readTests.ts` | All GET operation tests (20 tests) |
| `writeTests.ts` | CREATE/UPDATE tests (15 tests) |
| `deleteTests.ts` | DELETE tests (5 tests) |
| `cleanupAllData.ts` | Full cleanup of all TestRail data |
| `setupCrmData.ts` | Creates CRM demo projects with test cases |
| `testState.ts` | State persistence for split test workflow |
| `constants.ts` | Test configuration constants |

## Configuration

Tests require TestRail credentials. Set via `.env` file or VS Code settings:

```env
TESTRAIL_BASE_URL=https://yourcompany.testrail.io
TESTRAIL_EMAIL=your-email@example.com
TESTRAIL_API_KEY=your-api-key
```

## State File

When running `test:write`, a `.test-state.json` file is created with the IDs of created test data. This file is read by `test:delete` to know what to clean up.

```json
{
  "testProjectId": 123,
  "testSuiteId": 456,
  "testSectionId": 789,
  "testCaseId": 101,
  "testGroupId": 202,
  "createdAt": "2024-01-28T12:00:00.000Z"
}
```

The state file is automatically deleted after successful cleanup.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DEBUG=1` | Show stack traces on test failures |
| `TESTRAIL_BASE_URL` | TestRail instance URL |
| `TESTRAIL_EMAIL` | TestRail user email |
| `TESTRAIL_API_KEY` | TestRail API key |

## Test Counts

| Mode | Tests |
|------|-------|
| Read | ~20 tests |
| Write | ~15 tests |
| Delete | 5 tests |
| **Total** | **~40 tests** |

## Troubleshooting

### "No test state found"
Run `npm run test:write` first to create test data before running `npm run test:delete`.

### Permission errors
Some tests (users, groups) require admin permissions and will be skipped if not available.

### Cleanup failed
If cleanup fails mid-way, run `npm run test:status` to see what's left, then manually delete in TestRail or try `npm run test:delete` again.
