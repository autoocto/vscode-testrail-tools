# Changelog

All notable changes to the TestRail Tools extension will be documented in this file.

## [0.2.0] - 2025-12-12

### 🎉 Major Release: YAML Editor & Live Preview

This release completely transforms how you interact with TestRail in VS Code, replacing webview forms with a powerful YAML editor and live preview system.

### ✨ Added

#### YAML-Based Editing System
- **Text Editor Integration**: Edit test cases, sections, suites, and projects in YAML format
- **Live Preview Panel**: Side-by-side formatted preview (like Markdown preview)
- **Two-Way Binding**: Edit in preview OR YAML - changes sync instantly
- **Copilot Integration**: Full GitHub Copilot support for YAML editing

#### Interactive Preview Features
- **Editable Fields**: All fields are editable directly in the preview panel
  - Test Cases: Title, references, steps (content/expected/additional info)
  - Sections: Name, description, suite ID, parent section ID
  - Suites: Name, description
  - Projects: Name, announcement, show announcement, suite mode
- **Step Management**:
  - ➕ Add Step button to add new steps
  - 🗑️ Delete button on each step
  - Always shows additional_info field for all steps
- **Action Buttons**:
  - 💾 Save to TestRail
  - 🔄 Refresh from TestRail
  - 🌐 Open in Browser
  - 🗑️ Delete (with confirmation)

#### Keyboard Shortcuts
- `Ctrl+K V` (`Cmd+K V` on Mac): Toggle preview panel
- `Ctrl+S` (`Cmd+S` on Mac): Save to TestRail when preview is focused
- Preview toggle button in editor title bar

#### Visual Test Explorer
- Tree view of all projects, suites, sections, and test cases
- Click any item to open in YAML editor
- Inline buttons to create new entities
- Refresh button to reload from TestRail

#### Configuration
- **Custom Field Defaults**: Configure default values for custom fields
  ```json
  {
    "testrailTools.customFieldDefaults": {
      "custom_automatable": 1
    }
  }
  ```

### 🐛 Fixed

- **Delete Functionality**: Fixed webview sandbox modal restriction
  - Removed `confirm()` calls from webview (blocked by sandbox)
  - Added VS Code native confirmation dialogs in extension code
  - Delete now works for all entity types (cases, sections, suites, projects)
  
- **HTML Tag Stripping**: All description fields now properly strip HTML tags
  - Prevents display of raw HTML snippets in preview
  - Cleaner, more readable content
  
- **Preview Reopening**: Fixed issue where preview couldn't be reopened after closing
  - Toggle command works properly
  - Preview auto-opens when switching to .testrail.yaml files
  
- **Document Dirty State**: Edits in preview immediately mark document as unsaved
  - Unsaved indicator (white dot) appears instantly
  - Ctrl+S works immediately after any edit
  
- **Single Preview Mode**: Only one preview panel open at a time
  - Auto-closes previous preview when opening new entity
  - Keeps workspace clean and focused
  
- **Packaging**: Fixed missing `js-yaml` dependency in packaged VSIX
  - Removed `node_modules/` from `.vscodeignore`
  - Extension now activates properly after installation

### 🔧 Changed

- **Architecture**: Complete rewrite from webview forms to YAML editors
- **File Storage**: Test entities stored as `.testrail/{type}-{id}.testrail.yaml`
- **Preview Title**: Changed from "Preview" to "Editor" to reflect editable nature

### 🗑️ Deprecated

- Webview-based editors (code still present but not used)
- May be removed in future version

### 📝 Technical Details

#### New Components
- `TestRailPreviewProvider`: Manages preview panels and two-way binding
- `yamlConverters`: Converts TestRail entities to/from YAML
- `yamlCommands`: Commands for opening entities in YAML editor

#### Updated Components
- `package.json`: Added commands, menus, keybindings, configuration
- `extension.ts`: Registers preview provider instead of webview editors
- All render methods: Now generate editable HTML forms

#### Performance
- Real-time preview updates without lag
- Efficient document edit tracking
- Single preview panel reduces memory usage

---

## [0.1.3] - 2025-12-11

### Fixed
- Initial packaging and deployment issues

---

## [0.1.0] - 2025-12-01

### Added
- Initial release with Copilot Chat integration
- Language model tools for all TestRail entities
- Support for projects, suites, sections, test cases, users, groups
- Pagination support for list operations
- Environment variable and VS Code settings configuration
- Nested custom objects display as strings in preview

### Next Steps

- Add "Add Step" / "Remove Step" buttons in preview for test cases
- Support for more custom field types (dates, checkboxes, multi-select)
- Validation feedback in preview before saving
- Undo/redo functionality in preview
