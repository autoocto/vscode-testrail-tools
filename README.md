# TestRail Tools for VS Code

Interact with TestRail test cases, suites, projects, and more directly from GitHub Copilot Chat in VS Code.

## Features

This extension provides language model tools to interact with TestRail:

### Projects
- Get project details
- List all projects
- Create new projects
- Update existing projects
- Delete projects

### Suites
- Get suite details
- List suites for a project
- Create new suites
- Update existing suites
- Delete suites

### Sections
- Get section details
- List sections for a project/suite
- Create new sections (with support for nested sections)
- Update existing sections
- Delete sections

### Test Cases
- Get test case details
- List test cases with filtering
- Create new test cases with custom fields
- Update existing test cases
- Delete test cases

### User Groups
- Get group details
- List all groups
- Create new groups
- Update existing groups
- Delete groups

### Users
- Get user by ID
- Get user by email
- List all users (optionally filtered by project)

### Priorities
- List all available priorities

## Setup

### Configuration

Configure the extension via VS Code settings or environment variables:

#### VS Code Settings
1. Open VS Code Settings (Ctrl+, or Cmd+,)
2. Search for "TestRail Tools"
3. Set the following:
   - **TestRail Base URL**: Your TestRail instance URL (e.g., `https://yourcompany.testrail.io`)
   - **TestRail Email**: Your TestRail email address
   - **TestRail API Key**: Your TestRail API key

#### Environment Variables
Alternatively, set these environment variables:
- `TESTRAIL_BASE_URL`: Your TestRail instance URL
- `TESTRAIL_EMAIL`: Your TestRail email address
- `TESTRAIL_API_KEY`: Your TestRail API key

### Getting Your TestRail API Key
1. Log in to your TestRail instance
2. Click on your avatar in the top-right corner
3. Select "My Settings"
4. In the "API Keys" section, generate a new API key
5. Copy the key and use it in the configuration

## Usage

Once configured, use the tools in GitHub Copilot Chat by referencing them with `#`:

```
@workspace #getTestRailProjects list all active projects

@workspace #getTestRailCases projectId: 1 get all test cases for project 1

@workspace #addTestRailCase create a new test case in section 5 titled "Test login functionality"

@workspace #getTestRailUser userId: 10 get details for user 10
```

## Available Tools

- `getTestRailProject` - Get details for a specific project
- `getTestRailProjects` - List all projects
- `addTestRailProject` - Create a new project
- `updateTestRailProject` - Update a project
- `deleteTestRailProject` - Delete a project
- `getTestRailSuite` - Get details for a specific suite
- `getTestRailSuites` - List suites for a project
- `addTestRailSuite` - Create a new suite
- `updateTestRailSuite` - Update a suite
- `deleteTestRailSuite` - Delete a suite
- `getTestRailSection` - Get details for a specific section
- `getTestRailSections` - List sections for a project/suite
- `addTestRailSection` - Create a new section
- `updateTestRailSection` - Update a section
- `deleteTestRailSection` - Delete a section
- `getTestRailCase` - Get details for a specific test case
- `getTestRailCases` - List test cases with filtering
- `addTestRailCase` - Create a new test case
- `updateTestRailCase` - Update a test case
- `deleteTestRailCase` - Delete a test case
- `getTestRailGroup` - Get details for a specific group
- `getTestRailGroups` - List all groups
- `addTestRailGroup` - Create a new group
- `updateTestRailGroup` - Update a group
- `deleteTestRailGroup` - Delete a group
- `getTestRailUser` - Get user by ID
- `getTestRailUserByEmail` - Get user by email
- `getTestRailUsers` - List all users
- `getTestRailPriorities` - List all priorities

## Requirements

- VS Code 1.95.0 or higher
- A TestRail instance with API access enabled
- Valid TestRail credentials (email and API key)

## API Reference

This extension implements the TestRail API v2:
- [Projects API](https://support.testrail.com/hc/en-us/articles/7077792415124-Projects)
- [Suites API](https://support.testrail.com/hc/en-us/articles/7077936624276-Suites)
- [Sections API](https://support.testrail.com/hc/en-us/articles/7077918603412-Sections)
- [Cases API](https://support.testrail.com/hc/en-us/articles/7077292642580-Cases)
- [Groups API](https://support.testrail.com/hc/en-us/articles/7077338821012-Groups)
- [Users API](https://support.testrail.com/hc/en-us/articles/7077978310292-Users)
- [Priorities API](https://support.testrail.com/hc/en-us/articles/7077746564244-Priorities)

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For issues or questions:
- File an issue on [GitHub](https://github.com/autoocto/vscode-testrail-tools)