
# Test Case UI & Editor Integration for Copilot Chat

Purpose: enable users to work with TestRail test cases fully inside VS Code (no browser required). Copilot Chat should be able to add UI panels, an editable test-case editor, and wire up language-model tools to fetch, edit, and sync TestRail test cases.

Goals
- Provide a read-only and editable view of a TestRail test case inside VS Code.
- Allow creation, update, and deletion of test cases from the editor.
- Expose quick actions (add step, reorder steps, update priority, open in browser) via CodeLens and the editor title bar.
- Keep Copilot Chat tools as the data layer (use existing `TestRailHelper` methods and language-model tools) so LLM prompts can refer to the UI.
- Ensure offline UX: editor edits are saved locally (untitled/dirty) and a "Sync" command pushes to TestRail.

Overview of Components
- Side View (Tree): `TestRail` view showing Projects -> Suites -> Sections -> Cases. Clicking a case opens the Case Editor.
- Case Editor: custom TextDocument or Webview that renders a structured, editable representation of the test case (title, description, steps, expected results, priority, refs, custom fields).
- Commands & CodeLenses: context actions for create/update/delete/sync/open-in-browser.
- Copilot Chat Integration: ensure language-model tools and the extension commands are discoverable and usable by Copilot Chat prompts.

Design & Implementation Steps

1) Register a `TestRail` Tree View
- Create a `TestRailTreeProvider` implementing `vscode.TreeDataProvider`.
- Populate using `helper.getProjects(limit?, offset?)` -> for selected project, load suites via `getSuites(projectId, limit?, offset?)`, then sections, then cases via `getCases(projectId, { suite_id, section_id, limit, offset })`.
- Make the tree items clickable to `vscode.commands.executeCommand('testrail.openCase', caseId)`.

2) Open Case Editor
- Command: `testrail.openCase` — accepts `caseId` or a tree item.
- When invoked, fetch full case details via `helper.getCase(caseId)` and open a custom editor. Options:
	- Use a custom TextDocument with a language (e.g., `testrail-case`) and a serializer (Custom TextEditorProvider) that shows structured YAML/JSON or Markdown with frontmatter.
	- Or use a Webview-based editor for richer controls (drag/drop steps, dropdowns for priority, WYSIWYG for steps). Webview recommended for best UX.

3) Editor Data Model
- Fields: `id`, `title`, `type_id`, `priority_id`, `estimate`, `refs`, `custom_fields` (map), `sections`, `suite_id`, `status`, `created_by`, `created_on`, `updated_on`.
- Steps: represent as an ordered array of {content, expected} or use the existing `custom_steps`/`custom_expected` fields depending on TestRail configuration.

4) Editing & Local Save
- Edits should mark the editor as dirty. Implement save to push changes to TestRail via `helper.updateCase(caseId, data)`.
- Support `Save As New Case` command that calls `helper.addCase(sectionId, data)`.
- Provide a `Sync` command that: (a) if editor is dirty, prompts to save and push changes; (b) if editor has unsaved local-only changes (e.g., created from scratch), allows creation.

5) Create/Delete Case Flows
- Create: Provide a `New Test Case` command at section level in the Tree View and `New Case` button in the editor title bar. Use `helper.addCase(sectionId, data)` to persist.
- Delete: Confirm deletion with the user, call `helper.deleteCase(caseId)`, then refresh tree.

6) Quick Actions & CodeLens
- Add CodeLens for steps: `Add Step`, `Move Up`, `Move Down`, `Delete Step` near each step in the editor (if using Markdown/YAML view) or as inline buttons in Webview.
- Editor title bar actions: `Save`, `Save As New Case`, `Sync to TestRail`, `Open in Browser` (open URL built from config base URL and case id), `Refresh from Server`.

7) Copilot Chat Tooling Integration
- Ensure commands are registered with descriptive `title`, `tooltip`, and `args` so Copilot Chat can invoke them.
- Keep language-model tools registered (see `src/tools/testrailTools.ts`) for LLM access to TestRail data. Example flows Copilot Chat can use:
	- "Open test case 123 in the TestRail editor" -> call `testrail.openCase` with 123.
	- "Create a new test case in project X with title Y" -> call `addTestRailCase` tool or `testrail.createCase` command.
	- "Show me failing steps of case 456" -> call `getTestRailCase` tool, format results, show in chat.

8) Formatting & Smart Editing Helpers
- Provide formatter functions (already in `utils/formatters.ts`) for rendering cases in the editor or preview.
- Add a `Generate Steps` command which uses Copilot Chat tool or LLM to suggest test steps given a description: call the LLM with the case description and get a structured list of steps, then insert into the editor.

9) Permissions and Error Handling
- Use `handleToolError` to format failures for UI notifications.
- Gracefully handle API rate-limits, authentication errors, and offline mode (show cached/stale badge and allow read-only view).

10) Caching & Refresh
- Cache recently loaded projects/cases in the Tree Provider to avoid repeated network calls; provide `Refresh` command for the Tree and single-case refresh.

11) Tests & Validation
- Add unit tests for the Tree Provider and commands to validate that they call the helper with correct params (including `limit`/`offset`).
- Add an integration script (like `testPagination.ts`) to ensure pagination flows work.

Developer Notes and Tips for Copilot Chat
- Prefer Webview for WYSIWYG editing; if time constrained, implement a structured Markdown/YAML serializer so users can edit easily in a standard TextEditor.
- Use `vscode.window.registerCustomEditorProvider` for richer editors or `vscode.window.createWebviewPanel` for a simpler approach.
- Reuse `TestRailHelper` methods and language-model tools for all network operations; keep UI code focused on presentation and user interactions.
- Keep commands idempotent and return success/failure messages so Copilot Chat can present meaningful responses in conversation.

Example Commands to Register (names)
- `testrail.openCase` — Open case editor for case id
- `testrail.createCase` — Create a new case in a section
- `testrail.updateCase` — Update an existing case from editor
- `testrail.deleteCase` — Delete a case
- `testrail.syncCase` — Sync local editor with TestRail
- `testrail.refreshTree` — Refresh the TestRail Tree view

UX Edge Cases
- If a user attempts to save an editor when required fields are missing, show inline errors and a modal explaining what's required.
- When TestRail returns an array (legacy endpoints), wrap it in paginated object to keep UI code stable.

Security & Privacy
- Do not log API keys or sensitive response data. Use VS Code secrets for storing credentials if needed.

Deliverables
- `src/ui/TestRailTreeProvider.ts` — Tree provider implementation
- `src/ui/caseEditor/*` — Editor implementation (Webview or CustomEditor)
- `src/commands/caseCommands.ts` — command registration and handlers
- Tests: `src/test/*` to validate command -> helper interactions
- Update `README.md` with instructions for UI usage and Copilot Chat examples
