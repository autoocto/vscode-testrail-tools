# TestRail Tools Test Scripts

This folder contains test scripts to verify connectivity and test all TestRail language model tools.

## Setup

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your TestRail credentials:
   ```env
   TESTRAIL_BASE_URL=https://yourcompany.testrail.io
   TESTRAIL_EMAIL=your-email@example.com
   TESTRAIL_API_KEY=your-api-key
   ```

3. To get your TestRail API key:
   - Log in to your TestRail instance
   - Click on your avatar in the top-right corner
   - Select "My Settings"
   - In the "API Keys" section, generate a new API key

## Running Tests

### Verify Connectivity

Test your connection to TestRail:

```bash
npm run verify
```

This will:
- Verify your configuration is loaded correctly
- Test connection to TestRail
- Display your user information
- List accessible projects

### Test All Tools

Run comprehensive tests for all TestRail language model tools (read-only mode):

```bash
npm test
```

This will:
- Test all GET operations (projects, suites, sections, cases, users, groups, priorities)
- Validate that all write operations are properly registered
- Display a summary of all 31 language model tools

The test runs in read-only mode by default to avoid modifying TestRail data.

### Test Write Operations

To test create/update/delete operations (creates temporary data and cleans up):

```bash
npm run test-write
```

**Warning:** This will create and delete test data in your TestRail instance.

### Test Pagination

Test pagination support with `_links.next` and `_links.prev`:

```bash
npm run test-pagination
```

This will:
- Test pagination for Projects, Suites, Sections, Cases, and Groups APIs
- Verify that `offset`, `limit`, and `size` fields are correctly returned
- Test fetching next pages using `_links.next`
- Test fetching previous pages using `_links.prev` when available

Or with a specific project ID:

```bash
npm test -- 1
```

This will test all non-destructive read operations:
- ✓ Projects (get, list)
- ✓ Suites (get, list)
- ✓ Sections (get, list)
- ✓ Test Cases (get, list)
- ✓ User Groups (get, list)
- ✓ Users (get, list, get by email)
- ✓ Priorities (list)

**Note:** Write operations (create, update, delete) are NOT tested to avoid modifying your TestRail data.

## Scripts

- `verifyConnectivity.ts` - Tests connection to TestRail
- `testPagination.ts` - Tests pagination support for all applicable APIs
- `tests/` - Main test suite folder:
  - `index.ts` - Test runner (main entry point)
  - `testUtils.ts` - Shared test utilities and context management
  - `readTests.ts` - All GET operation tests
  - `writeTests.ts` - All CREATE/UPDATE/DELETE tests

## Test Coverage

All 31 TestRail Language Model Tools are covered by tests:

### Read Operations (Tested in `npm test`):
- **Projects**: getTestRailProjects, getTestRailProject
- **Suites**: getTestRailSuites, getTestRailSuite  
- **Sections**: getTestRailSections, getTestRailSection
- **Cases**: getTestRailCases, getTestRailCase
- **Users**: getTestRailUsers, getTestRailUser, getTestRailUserByEmail
- **Groups**: getTestRailGroups, getTestRailGroup
- **Priorities**: getTestRailPriorities
- **Active Editor**: getActiveTestRailEditor

### Write Operations (Validated by structure):
- **Projects**: addTestRailProject, updateTestRailProject, deleteTestRailProject
- **Suites**: addTestRailSuite, updateTestRailSuite, deleteTestRailSuite
- **Sections**: addTestRailSection, updateTestRailSection, deleteTestRailSection
- **Cases**: addTestRailCase, updateTestRailCase, deleteTestRailCase
- **Groups**: addTestRailGroup, updateTestRailGroup, deleteTestRailGroup

All write operations can be tested with `npm run test-write`.

## Troubleshooting

### Connection Errors

**401 Unauthorized:**
- Check your email and API key are correct
- Verify your API key hasn't expired

**404 Not Found:**
- Check your TestRail base URL is correct
- Ensure you include the full URL (e.g., `https://yourcompany.testrail.io`)

**ENOTFOUND:**
- Check your network connection
- Verify the TestRail URL is accessible from your network

### Configuration Not Found

If you see "TestRail configuration not found":
1. Ensure `.env` file exists in the project root
2. Verify environment variables are set correctly
3. Alternatively, configure via VS Code settings:
   - Open Settings (Ctrl+, or Cmd+,)
   - Search for "TestRail Tools"
   - Set Base URL, Email, and API Key

## Using with VS Code Settings

Instead of `.env`, you can configure via VS Code settings:

1. Open VS Code Settings (Ctrl+, or Cmd+,)
2. Search for "TestRail Tools"
3. Configure:
   - TestRail Base URL
   - TestRail Email
   - TestRail API Key

The extension will use VS Code settings first, then fall back to environment variables.
