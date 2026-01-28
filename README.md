# TestRail Tools for VS Code

**Manage TestRail test cases, suites, and projects directly in VS Code** with powerful YAML editing, live preview panels, and seamless Copilot Chat integration.

## ✨ Features

### 🎯 Interactive Test Case Management
- **YAML-Based Editing**: Edit test cases, sections, suites, and projects in familiar YAML format
- **Live Preview Panel**: See formatted, editable preview alongside your YAML (like Markdown preview)
- **Two-Way Sync**: Edit in preview or YAML - changes sync instantly
- **Copilot Integration**: Let GitHub Copilot help you write and maintain test cases

### 📊 Visual Test Explorer
- Browse all projects, suites, sections, and test cases in a tree view
- Click any item to open it in the YAML editor with live preview
- Create, edit, and delete entities directly from the explorer

### ⌨️ Keyboard Shortcuts
- **Ctrl+K V** (Cmd+K V on Mac): Toggle preview panel
- **Ctrl+S** (Cmd+S on Mac): Save changes to TestRail
- All standard VS Code shortcuts work in the editor

### 🔧 Smart Editing Features
- **Step Management**: Add/delete test steps with inline buttons
- **HTML Stripping**: Automatically cleans HTML tags from descriptions
- **Auto-Complete**: YAML schema provides field suggestions
- **Validation**: See errors immediately as you type
- **Custom Field Defaults**: Configure default values for custom fields

## 📦 Installation

1. Install from VS Code Marketplace or download the VSIX
2. Reload VS Code
3. Configure your TestRail credentials (see Configuration below)

## ⚙️ Configuration

### Option 1: VS Code Settings (Recommended)
1. Open Settings (Ctrl+, or Cmd+,)
2. Search for "TestRail Tools"
3. Configure:
   - **TestRail Base URL**: `https://yourcompany.testrail.io`
   - **TestRail Email**: Your email address
   - **TestRail API Key**: Your API key (see below)
   - **Custom Field Defaults**: Default values for custom fields

### Option 2: Environment Variables
Set these variables in your shell or `.env` file:
```bash
TESTRAIL_BASE_URL=https://yourcompany.testrail.io
TESTRAIL_EMAIL=your.email@company.com
TESTRAIL_API_KEY=your-api-key-here
```

### Getting Your API Key
1. Log in to TestRail
2. Click your avatar → "My Settings"
3. Navigate to "API Keys" section
4. Generate a new API key
5. Copy and save it securely

### Custom Field Defaults
Configure default values for custom fields when creating test cases:
```json
{
  "testrailTools.customFieldDefaults": {
    "custom_automatable": 1,
    "custom_priority": 2
  }
}
```

## 🚀 Usage

### Visual Editor Workflow

1. **Open TestRail Explorer** (sidebar icon)
2. **Browse** to find a test case, section, or suite
3. **Click** to open in YAML editor with live preview
4. **Edit** in either the YAML or preview panel
5. **Save** with Ctrl+S or click "💾 Save to TestRail"

### Creating New Entities

#### From Explorer Tree:
- Click ➕ next to any project/suite/section
- Fill in the YAML template
- Save to create in TestRail

#### From Command Palette:
```
TestRail: New Test Case
TestRail: New Section
TestRail: New Suite
```

### Editing Test Steps

In the preview panel:
- Click **➕ Add Step** to add new steps
- Fill in Step Content and Expected Result
- Click **🗑️ Delete** on any step to remove it
- All changes sync to YAML automatically

### Preview Panel Features

- **💾 Save to TestRail**: Upload changes
- **🔄 Refresh from TestRail**: Pull latest version
- **🌐 Open in Browser**: View in TestRail web UI
- **🗑️ Delete**: Remove entity (with confirmation)

## 🤖 Copilot Chat Integration

Use TestRail tools in Copilot Chat with `#` reference:

### Examples:

```
@workspace #getTestRailProjects list all active projects

@workspace #getTestRailCases projectId: 1 get all test cases

@workspace #addTestRailCase sectionId: 42, title: "Test login"

@workspace #updateTestRailCase caseId: 123 update test case

@workspace #getTestRailUser userId: 10
```

### Available Tools

**Projects**: get, list, add, update, delete  
**Suites**: get, list, add, update, delete  
**Sections**: get, list, add, update, delete  
**Test Cases**: get, list, add, update, delete  
**Users**: get by ID, get by email, list  
**Groups**: get, list, add, update, delete  
**Priorities**: list  

### Pagination Support

Tools support pagination with `limit` and `offset`:
```
#getTestRailCases projectId: 1, limit: 50, offset: 0
#getTestRailSections projectId: 1, limit: 100, offset: 100
```

Responses include:
- `offset`: Starting position
- `limit`: Max items returned
- `size`: Total items available
- `_links.next/prev`: Pagination URLs

## 📁 YAML File Format

Files are stored in `.testrail/` directory with format: `{type}-{id}.testrail.yaml`

### Test Case Example:
```yaml
entityType: case
id: 123
title: Test user login
section_id: 42
refs: JIRA-456
custom_steps:
  - content: Navigate to login page
    expected: Login page displays
  - content: Enter valid credentials
    expected: User is logged in
```

### Section Example:
```yaml
entityType: section
id: 42
name: Authentication Tests
description: Tests for login and auth
suite_id: 5
parent_id: null  # null for top-level, or parent section ID
```

## 🔍 Keyboard Shortcuts

| Command | Windows/Linux | Mac | Description |
|---------|---------------|-----|-------------|
| Toggle Preview | `Ctrl+K V` | `Cmd+K V` | Show/hide preview panel |
| Save to TestRail | `Ctrl+S` | `Cmd+S` | Save changes (in preview) |
| Save File | `Ctrl+S` | `Cmd+S` | Save YAML (in editor) |
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` | Access all commands |

## 🛠️ Requirements

- **VS Code**: 1.95.0 or higher
- **TestRail**: Instance with API v2 enabled
- **Credentials**: Valid email and API key

## 📚 API Reference

This extension uses TestRail API v2:
- [Projects API](https://support.testrail.com/hc/en-us/articles/7077792415124-Projects)
- [Suites API](https://support.testrail.com/hc/en-us/articles/7077936624276-Suites)
- [Sections API](https://support.testrail.com/hc/en-us/articles/7077918603412-Sections)
- [Cases API](https://support.testrail.com/hc/en-us/articles/7077292642580-Cases)
- [Users API](https://support.testrail.com/hc/en-us/articles/7077978310292-Users)
- [Groups API](https://support.testrail.com/hc/en-us/articles/7077338821012-Groups)

## 🐛 Troubleshooting

### Extension Not Activating
- Check VS Code version (must be 1.95.0+)
- Verify `js-yaml` is in `node_modules/` (run `npm install`)
- Check Output panel → TestRail Tools for errors

### Cannot Connect to TestRail
- Verify base URL (no trailing slash)
- Confirm API key is valid
- Check network/firewall settings
- Enable API access in TestRail admin

### Preview Not Showing
- Press `Ctrl+K V` to toggle
- Check that file ends with `.testrail.yaml`
- Try closing and reopening the file

## 🧪 Testing & Development

### Running Tests

```bash
# Verify connectivity to TestRail
npm run verify

# Run comprehensive integration tests (read-only)
npm test

# Test pagination support
npm run test-pagination

# Test write operations (creates/deletes test data)
npm run test-write
```

### Test Coverage

All 31 Language Model Tools are covered by integration tests:
- ✅ 17 Read operations (tested by default)
- ✅ 13 Write operations (validated, tested with `--write` flag)  
- ✅ 1 Context tool (getActiveTestRailEditor)

See [src/scripts/README.md](src/scripts/README.md) for detailed test documentation.

### Development Commands

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run linter
npm run lint

# Package extension
npm run pack
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run verify` to test
5. Submit a pull request

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/autoocto/vscode-testrail-tools/issues)
- **Discussions**: [GitHub Discussions](https://github.com/autoocto/vscode-testrail-tools/discussions)

---

**Made with ❤️ for QA teams everywhere**