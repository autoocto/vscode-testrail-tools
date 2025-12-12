import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { TestRailHelper } from '../helpers/testrailHelper';
import * as yamlConverters from '../utils/yamlConverters';

/**
 * Provides live preview panels for TestRail YAML documents
 * 
 * Features:
 * - Two-way binding between YAML and preview
 * - Editable form fields in preview
 * - Step management (add/delete)
 * - Save/refresh/delete operations
 * - Auto-opens when .testrail.yaml files are opened
 */
export class TestRailPreviewProvider {
    private static previewPanels: Map<string, vscode.WebviewPanel> = new Map();
    
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly helper: TestRailHelper | null
    ) {}

    /**
     * Registers the preview provider and all related commands
     * @param context - Extension context
     * @param helper - TestRail API helper (may be null if not configured)
     * @returns Array of disposables for cleanup
     */
    public static register(context: vscode.ExtensionContext, helper: TestRailHelper | null): vscode.Disposable[] {
        const provider = new TestRailPreviewProvider(context, helper);
        
        const disposables: vscode.Disposable[] = [];
        
        // Register command to show preview
        disposables.push(
            vscode.commands.registerCommand('testrail.showPreview', () => {
                provider.showPreview();
            })
        );
        
        // Register command to toggle preview
        disposables.push(
            vscode.commands.registerCommand('testrail.togglePreview', () => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document.fileName.endsWith('.testrail.yaml')) {
                    const documentUri = editor.document.uri.toString();
                    const panel = TestRailPreviewProvider.previewPanels.get(documentUri);
                    if (panel) {
                        panel.dispose();
                        TestRailPreviewProvider.previewPanels.delete(documentUri);
                    } else {
                        provider.showPreview();
                    }
                }
            })
        );
        
        // Register command to save to TestRail
        disposables.push(
            vscode.commands.registerCommand('testrail.saveToTestRail', async () => {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document.fileName.endsWith('.testrail.yaml')) {
                    await provider.saveToTestRail(editor.document);
                }
            })
        );
        
        // Auto-show preview when opening .testrail.yaml files
        disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor && editor.document.fileName.endsWith('.testrail.yaml')) {
                    provider.showPreview();
                }
            })
        );
        
        // Update preview when document changes
        disposables.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                if (event.document.fileName.endsWith('.testrail.yaml')) {
                    provider.updatePreview(event.document);
                }
            })
        );
        
        // Close preview when document closes
        disposables.push(
            vscode.workspace.onDidCloseTextDocument(document => {
                if (document.fileName.endsWith('.testrail.yaml')) {
                    const panel = TestRailPreviewProvider.previewPanels.get(document.uri.toString());
                    if (panel) {
                        panel.dispose();
                        TestRailPreviewProvider.previewPanels.delete(document.uri.toString());
                    }
                }
            })
        );
        
        return disposables;
    }

    /**
     * Shows the live preview panel for the active TestRail YAML file.
     * Automatically closes any other open preview to maintain single preview mode.
     * Creates a new webview panel or reveals existing one.
     * @private
     */
    private showPreview(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document.fileName.endsWith('.testrail.yaml')) {
            return;
        }

        const document = editor.document;
        const documentUri = document.uri.toString();
        
        // Close all other previews to ensure only one is open at a time
        for (const [uri, panel] of TestRailPreviewProvider.previewPanels.entries()) {
            if (uri !== documentUri) {
                panel.dispose();
                TestRailPreviewProvider.previewPanels.delete(uri);
            }
        }
        
        // Check if preview already exists
        let panel = TestRailPreviewProvider.previewPanels.get(documentUri);
        
        if (panel) {
            // Reveal existing panel
            panel.reveal(vscode.ViewColumn.Beside);
        } else {
            // Create new preview panel
            panel = vscode.window.createWebviewPanel(
                'testrailPreview',
                'TestRail Preview',
                { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    enableCommandUris: true,
                    localResourceRoots: [],
                    portMapping: []
                }
            );

            TestRailPreviewProvider.previewPanels.set(documentUri, panel);

            // Handle panel disposal
            panel.onDidDispose(() => {
                TestRailPreviewProvider.previewPanels.delete(documentUri);
            });

            // Handle messages from webview
            panel.webview.onDidReceiveMessage(async message => {
                switch (message.type) {
                    case 'updateField':
                        await this.updateFieldInDocument(document, message.field, message.value);
                        break;
                    case 'addStep':
                        await this.addStepToDocument(document);
                        break;
                    case 'deleteStep': {
                        const stepConfirm = await vscode.window.showWarningMessage(
                            'Delete this step?',
                            { modal: true },
                            'Delete'
                        );
                        if (stepConfirm === 'Delete') {
                            await this.deleteStepFromDocument(document, message.index);
                        }
                        break;
                    }
                    case 'save':
                        await this.saveToTestRail(document);
                        break;
                    case 'delete': {
                        const deleteConfirm = await vscode.window.showWarningMessage(
                            'Are you sure you want to delete this entity? This action cannot be undone.',
                            { modal: true },
                            'Delete'
                        );
                        if (deleteConfirm === 'Delete') {
                            await this.deleteFromTestRail(document);
                        }
                        break;
                    }
                    case 'refresh':
                        await this.refreshFromTestRail(document);
                        break;
                    case 'openInBrowser':
                        await this.openInBrowser(document);
                        break;
                }
            });
        }

        // Update preview content
        this.updatePreview(document);
    }

    /**
     * Updates a field value in the YAML document, enabling two-way binding between preview and YAML.
     * Handles nested fields (e.g., "custom_steps.0.content") and automatically parses the document.
     * @param document - The YAML text document to update
     * @param field - Dot-notation path to the field (e.g., "title" or "custom_steps.0.content")
     * @param value - The new value to set
     * @private
     */
    private async updateFieldInDocument(document: vscode.TextDocument, field: string, value: any): Promise<void> {
        try {
            const yamlContent = document.getText();
            const data = yaml.load(yamlContent) as any;
            
            // Handle nested fields (e.g., "custom_steps.0.content")
            const parts = field.split('.');
            let target = data;
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                const index = parseInt(part);
                if (!isNaN(index)) {
                    target = target[index];
                } else {
                    if (!target[part]) {
                        target[part] = {};
                    }
                    target = target[part];
                }
            }
            
            const lastPart = parts[parts.length - 1];
            const index = parseInt(lastPart);
            if (!isNaN(index)) {
                target[index] = value;
            } else {
                target[lastPart] = value;
            }
            
            // Update the document
            const updatedYaml = yaml.dump(data, { lineWidth: -1, noRefs: true });
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
            await vscode.workspace.applyEdit(edit);
        } catch (error) {
            console.error('Failed to update field:', error);
        }
    }

    /**
     * Adds a new empty step to the test case in the YAML document.
     * Automatically determines whether to use custom_steps or custom_steps_separated.
     * @param document - The YAML text document to update
     * @private
     */
    private async addStepToDocument(document: vscode.TextDocument): Promise<void> {
        try {
            const yamlContent = document.getText();
            const data = yaml.load(yamlContent) as any;
            
            // Determine which steps field to use
            const stepsField = data.custom_steps ? 'custom_steps' : 'custom_steps_separated';
            
            // Initialize steps array if it doesn't exist
            if (!data[stepsField]) {
                data[stepsField] = [];
            }
            
            // Add a new empty step
            data[stepsField].push({
                content: '',
                expected: ''
            });
            
            // Update the document
            const updatedYaml = yaml.dump(data, { lineWidth: -1, noRefs: true });
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
            await vscode.workspace.applyEdit(edit);
        } catch (error) {
            console.error('Failed to add step:', error);
            vscode.window.showErrorMessage(`Failed to add step: ${error}`);
        }
    }

    /**
     * Deletes a step from the test case at the specified index.
     * Automatically determines whether to use custom_steps or custom_steps_separated.
     * @param document - The YAML text document to update
     * @param index - Zero-based index of the step to delete
     * @private
     */
    private async deleteStepFromDocument(document: vscode.TextDocument, index: number): Promise<void> {
        try {
            const yamlContent = document.getText();
            const data = yaml.load(yamlContent) as any;
            
            // Determine which steps field to use
            const stepsField = data.custom_steps ? 'custom_steps' : 'custom_steps_separated';
            
            if (data[stepsField] && Array.isArray(data[stepsField])) {
                // Remove the step at the specified index
                data[stepsField].splice(index, 1);
                
                // Update the document
                const updatedYaml = yaml.dump(data, { lineWidth: -1, noRefs: true });
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
                await vscode.workspace.applyEdit(edit);
            }
        } catch (error) {
            console.error('Failed to delete step:', error);
            vscode.window.showErrorMessage(`Failed to delete step: ${error}`);
        }
    }

    /**
     * Updates the preview panel with the latest content from the YAML document.
     * Parses the YAML and renders appropriate HTML based on entity type.
     * @param document - The YAML text document to render
     * @private
     */
    private updatePreview(document: vscode.TextDocument): void {
        const panel = TestRailPreviewProvider.previewPanels.get(document.uri.toString());
        if (!panel) {
            return;
        }

        try {
            const yamlContent = document.getText();
            const data = yaml.load(yamlContent) as any;
            panel.webview.html = this.getHtmlForWebview(data);
        } catch (error) {
            panel.webview.html = this.getErrorHtml(error);
        }
    }

    private getHtmlForWebview(data: any): string {
        const entityType = data.entityType || 'unknown';
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TestRail Preview</title>
    <style>
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1, h2, h3 {
            color: var(--vscode-editor-foreground);
        }
        .field {
            margin: 10px 0;
            padding: 10px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }
        .field-label {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 5px;
        }
        .field-value {
            margin-top: 5px;
        }
        input, textarea, select {
            width: 100%;
            padding: 6px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-family: var(--vscode-font-family);
        }
        textarea {
            min-height: 60px;
            resize: vertical;
        }
        .steps {
            margin-top: 10px;
        }
        .step {
            margin: 5px 0;
            padding: 8px;
            background: var(--vscode-editor-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        .step textarea {
            margin-top: 4px;
        }
        button {
            margin: 20px 0;
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .error {
            color: var(--vscode-errorForeground);
            padding: 10px;
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>TestRail ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Editor</h1>
    ${this.renderPreview(data, entityType)}
    <div style="margin: 20px 0; display: flex; gap: 10px; flex-wrap: wrap;">
        <button onclick="saveToTestRail()">💾 Save to TestRail</button>
        <button onclick="refreshFromTestRail()">🔄 Refresh from TestRail</button>
        <button onclick="openInBrowser()" ${!data.id ? 'disabled' : ''}>🌐 Open in Browser</button>
        <button onclick="deleteEntity()" ${!data.id ? 'disabled' : ''} style="background: var(--vscode-errorForeground);">🗑️ Delete</button>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // Handle Ctrl+S to save
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveToTestRail();
            }
        });
        
        function updateField(field, value) {
            vscode.postMessage({ type: 'updateField', field, value });
        }
        
        function addStep() {
            vscode.postMessage({ type: 'addStep' });
        }
        
        function deleteStep(index) {
            vscode.postMessage({ type: 'deleteStep', index });
        }
        
        function saveToTestRail() {
            vscode.postMessage({ type: 'save' });
        }
        
        function refreshFromTestRail() {
            vscode.postMessage({ type: 'refresh' });
        }
        
        function openInBrowser() {
            vscode.postMessage({ type: 'openInBrowser' });
        }
        
        function deleteEntity() {
            vscode.postMessage({ type: 'delete' });
        }
    </script>
</body>
</html>`;
    }

    private renderPreview(data: any, entityType: string): string {
        switch (entityType) {
            case 'case':
                return this.renderCasePreview(data);
            case 'section':
                return this.renderSectionPreview(data);
            case 'suite':
                return this.renderSuitePreview(data);
            case 'project':
                return this.renderProjectPreview(data);
            default:
                return `<div class="error">Unknown entity type: ${entityType}</div>`;
        }
    }

    private renderCasePreview(data: any): string {
        let html = `<div class="field">
            <div class="field-label">Title</div>
            <input type="text" value="${this.escapeHtml(data.title || '')}" onchange="updateField('title', this.value)" />
        </div>`;

        if (data.section_id) {
            html += `<div class="field">
                <div class="field-label">Section ID</div>
                <input type="number" value="${data.section_id}" onchange="updateField('section_id', parseInt(this.value))" />
            </div>`;
        }

        if (data.template_id) {
            html += `<div class="field">
                <div class="field-label">Template ID</div>
                <div class="field-value">${data.template_id}</div>
            </div>`;
        }

        if (data.type_id) {
            html += `<div class="field">
                <div class="field-label">Type ID</div>
                <div class="field-value">${data.type_id}</div>
            </div>`;
        }

        if (data.priority_id) {
            html += `<div class="field">
                <div class="field-label">Priority ID</div>
                <div class="field-value">${data.priority_id}</div>
            </div>`;
        }

        if (data.estimate) {
            html += `<div class="field">
                <div class="field-label">Estimate</div>
                <div class="field-value">${data.estimate}</div>
            </div>`;
        }

        if (data.refs !== undefined) {
            html += `<div class="field">
                <div class="field-label">References</div>
                <input type="text" value="${this.escapeHtml(data.refs || '')}" onchange="updateField('refs', this.value)" />
            </div>`;
        }

        if (data.custom_preconds) {
            html += `<div class="field">
                <div class="field-label">Preconditions</div>
                <div class="field-value">${this.escapeHtml(data.custom_preconds)}</div>
            </div>`;
        }

        // Handle both custom_steps and custom_steps_separated
        const steps = data.custom_steps || data.custom_steps_separated;
        const stepsField = data.custom_steps ? 'custom_steps' : 'custom_steps_separated';
        
        html += `<div class="field">
            <div class="field-label">Steps
                <button onclick="addStep()" style="margin-left: 10px; padding: 4px 8px; font-size: 12px;">➕ Add Step</button>
            </div>
            <div class="steps">`;
        
        if (steps && Array.isArray(steps) && steps.length > 0) {
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                html += `<div class="step">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>Step ${i + 1}:</strong>
                        <button onclick="deleteStep(${i})" style="padding: 2px 6px; font-size: 11px; background: var(--vscode-errorForeground);">🗑️ Delete</button>
                    </div>
                    <textarea placeholder="Step content" onchange="updateField('${stepsField}.${i}.content', this.value)">${this.escapeHtml(this.stripHtml(step.content || ''))}</textarea>
                    <strong>Expected:</strong>
                    <textarea placeholder="Expected result" onchange="updateField('${stepsField}.${i}.expected', this.value)">${this.escapeHtml(this.stripHtml(step.expected || ''))}</textarea>
                    <strong>Additional Info:</strong>
                    <textarea placeholder="Additional info (optional)" onchange="updateField('${stepsField}.${i}.additional_info', this.value)">${this.escapeHtml(this.stripHtml(step.additional_info || ''))}</textarea>
                </div>`;
            }
        } else {
            html += `<div style="padding: 10px; color: var(--vscode-descriptionForeground);">No steps yet. Click "Add Step" to add one.</div>`;
        }
        
        html += `</div></div>`;

        if (data.custom_expected) {
            html += `<div class="field">
                <div class="field-label">Expected Result</div>
                <div class="field-value">${this.escapeHtml(data.custom_expected)}</div>
            </div>`;
        }

        // Add custom fields (excluding the ones we've already rendered)
        for (const key in data) {
            if (key.startsWith('custom_') && 
                key !== 'custom_preconds' && 
                key !== 'custom_steps' && 
                key !== 'custom_steps_separated' && 
                key !== 'custom_expected') {
                html += `<div class="field">
                    <div class="field-label">${key}</div>
                    <div class="field-value">${this.escapeHtml(String(data[key]))}</div>
                </div>`;
            }
        }

        return html;
    }

    private renderSectionPreview(data: any): string {
        let html = `<div class="field">
            <div class="field-label">Name</div>
            <input type="text" value="${this.escapeHtml(data.name || '')}" onchange="updateField('name', this.value)" />
        </div>`;

        html += `<div class="field">
            <div class="field-label">Description</div>
            <textarea onchange="updateField('description', this.value)">${this.escapeHtml(this.stripHtml(data.description || ''))}</textarea>
        </div>`;

        if (data.suite_id !== undefined) {
            html += `<div class="field">
                <div class="field-label">Suite ID</div>
                <input type="number" value="${data.suite_id}" onchange="updateField('suite_id', parseInt(this.value))" />
            </div>`;
        }

        if (data.parent_id !== undefined) {
            html += `<div class="field">
                <div class="field-label">Parent Section ID</div>
                <input type="number" value="${data.parent_id || ''}" onchange="updateField('parent_id', this.value ? parseInt(this.value) : null)" />
            </div>`;
        }

        return html;
    }

    private renderSuitePreview(data: any): string {
        let html = `<div class="field">
            <div class="field-label">Name</div>
            <input type="text" value="${this.escapeHtml(data.name || '')}" onchange="updateField('name', this.value)" />
        </div>`;

        html += `<div class="field">
            <div class="field-label">Description</div>
            <textarea onchange="updateField('description', this.value)">${this.escapeHtml(this.stripHtml(data.description || ''))}</textarea>
        </div>`;

        return html;
    }

    private renderProjectPreview(data: any): string {
        let html = `<div class="field">
            <div class="field-label">Name</div>
            <input type="text" value="${this.escapeHtml(data.name || '')}" onchange="updateField('name', this.value)" />
        </div>`;

        html += `<div class="field">
            <div class="field-label">Announcement</div>
            <textarea onchange="updateField('announcement', this.value)">${this.escapeHtml(this.stripHtml(data.announcement || ''))}</textarea>
        </div>`;

        if (data.show_announcement !== undefined) {
            html += `<div class="field">
                <div class="field-label">Show Announcement</div>
                <select onchange="updateField('show_announcement', this.value === 'true')">
                    <option value="true" ${data.show_announcement ? 'selected' : ''}>Yes</option>
                    <option value="false" ${!data.show_announcement ? 'selected' : ''}>No</option>
                </select>
            </div>`;
        }

        if (data.suite_mode !== undefined) {
            html += `<div class="field">
                <div class="field-label">Suite Mode</div>
                <select onchange="updateField('suite_mode', parseInt(this.value))">
                    <option value="1" ${data.suite_mode === 1 ? 'selected' : ''}>1 - Single Suite</option>
                    <option value="2" ${data.suite_mode === 2 ? 'selected' : ''}>2 - Single Suite + Baselines</option>
                    <option value="3" ${data.suite_mode === 3 ? 'selected' : ''}>3 - Multiple Suites</option>
                </select>
            </div>`;
        }

        return html;
    }

    private getErrorHtml(error: any): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .error {
            color: var(--vscode-errorForeground);
            padding: 10px;
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="error">
        <h2>Error parsing YAML</h2>
        <pre>${this.escapeHtml(String(error))}</pre>
    </div>
</body>
</html>`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private stripHtml(text: string): string {
        if (!text) return '';
        const decoded = text
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&');
        return this.escapeHtml(decoded.replace(/<[^>]*>/g, ''));
    }

    /**
     * Saves the current YAML document to TestRail.
     * Creates new entities if ID is not present, updates existing ones otherwise.
     * Supports cases, sections, projects, and suites.
     * @param document - The YAML text document to save
     * @private
     */
    private async saveToTestRail(document: vscode.TextDocument): Promise<void> {
        if (!this.helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        try {
            const yamlContent = document.getText();
            const data = yaml.load(yamlContent) as any;
            
            const entityType = data.entityType;
            const id = data.id;

            if (!entityType) {
                throw new Error('entityType is required in the YAML document');
            }

            switch (entityType) {
                case 'case':
                    if (id) {
                        await this.helper.updateCase(id, data);
                        vscode.window.showInformationMessage(`Test case C${id} updated successfully`);
                        await document.save();
                    } else {
                        if (!data.section_id) {
                            throw new Error('section_id is required to create a new test case');
                        }
                        const config = vscode.workspace.getConfiguration('testrailTools');
                        const customFieldDefaults = config.get('customFieldDefaults', { custom_automatable: 1 }) as Record<string, any>;
                        
                        const caseData = { ...customFieldDefaults, ...data };
                        delete caseData.entityType;
                        
                        const newCase = await this.helper.addCase(data.section_id, caseData);
                        vscode.window.showInformationMessage(`Test case C${newCase.id} created successfully`);
                        
                        // Update the document with the new ID
                        const edit = new vscode.WorkspaceEdit();
                        const updatedYaml = yaml.dump({ ...data, id: newCase.id });
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
                        await vscode.workspace.applyEdit(edit);
                        await document.save();
                    }
                    break;

                case 'section':
                    if (id) {
                        await this.helper.updateSection(id, data);
                        vscode.window.showInformationMessage(`Section updated successfully`);
                        await document.save();
                    } else {
                        if (!data.suite_id) {
                            throw new Error('suite_id is required to create a new section');
                        }
                        const projectId = await this.getProjectIdForSuite(data.suite_id);
                        const newSection = await this.helper.addSection(projectId, data);
                        vscode.window.showInformationMessage(`Section created successfully`);
                        
                        const edit = new vscode.WorkspaceEdit();
                        const updatedYaml = yaml.dump({ ...data, id: newSection.id });
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
                        await vscode.workspace.applyEdit(edit);
                        await document.save();
                    }
                    break;

                case 'suite':
                    if (id) {
                        await this.helper.updateSuite(id, data);
                        vscode.window.showInformationMessage(`Suite updated successfully`);
                        await document.save();
                    } else {
                        if (!data.project_id) {
                            throw new Error('project_id is required to create a new suite');
                        }
                        const newSuite = await this.helper.addSuite(data.project_id, data);
                        vscode.window.showInformationMessage(`Suite created successfully`);
                        
                        const edit = new vscode.WorkspaceEdit();
                        const updatedYaml = yaml.dump({ ...data, id: newSuite.id });
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
                        await vscode.workspace.applyEdit(edit);
                        await document.save();
                    }
                    break;

                case 'project':
                    if (id) {
                        await this.helper.updateProject(id, data);
                        vscode.window.showInformationMessage(`Project updated successfully`);
                        await document.save();
                    } else {
                        const newProject = await this.helper.addProject(data);
                        vscode.window.showInformationMessage(`Project created successfully`);
                        
                        const edit = new vscode.WorkspaceEdit();
                        const updatedYaml = yaml.dump({ ...data, id: newProject.id });
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
                        await vscode.workspace.applyEdit(edit);
                        await document.save();
                    }
                    break;

                default:
                    throw new Error(`Unknown entity type: ${entityType}`);
            }

            vscode.commands.executeCommand('testrail.refreshTree');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save to TestRail: ${error}`);
        }
    }

    private async getProjectIdForSuite(suiteId: number): Promise<number> {
        if (!this.helper) {
            throw new Error('TestRail is not configured');
        }
        
        const suite = await this.helper.getSuite(suiteId);
        return suite.project_id;
    }

    /**
     * Deletes the entity represented by the YAML document from TestRail.
     * Prompts for confirmation via VS Code native dialog before deletion.
     * Supports cases, sections, projects, and suites.
     * @param document - The YAML text document representing the entity to delete
     * @private
     */
    private async deleteFromTestRail(document: vscode.TextDocument): Promise<void> {
        if (!this.helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        try {
            const yamlContent = document.getText();
            const data = yaml.load(yamlContent) as any;
            
            const entityType = data.entityType;
            const id = data.id;

            if (!id) {
                vscode.window.showErrorMessage('Cannot delete: entity has no ID (not yet created)');
                return;
            }

            console.log(`Attempting to delete ${entityType} with ID ${id}`);

            switch (entityType) {
                case 'case':
                    console.log(`Calling deleteCase(${id})`);
                    await this.helper.deleteCase(id);
                    vscode.window.showInformationMessage(`Test case C${id} deleted successfully`);
                    break;
                case 'section':
                    console.log(`Calling deleteSection(${id})`);
                    await this.helper.deleteSection(id);
                    vscode.window.showInformationMessage(`Section deleted successfully`);
                    break;
                case 'suite':
                    console.log(`Calling deleteSuite(${id})`);
                    await this.helper.deleteSuite(id);
                    vscode.window.showInformationMessage(`Suite deleted successfully`);
                    break;
                case 'project':
                    console.log(`Calling deleteProject(${id})`);
                    await this.helper.deleteProject(id);
                    vscode.window.showInformationMessage(`Project deleted successfully`);
                    break;
                default:
                    throw new Error(`Unknown entity type: ${entityType}`);
            }

            console.log(`Delete successful for ${entityType} ${id}, closing editors`);
            // Close the preview panel first
            const panel = TestRailPreviewProvider.previewPanels.get(document.uri.toString());
            if (panel) {
                panel.dispose();
                TestRailPreviewProvider.previewPanels.delete(document.uri.toString());
            }
            
            // Close the document
            await vscode.window.showTextDocument(document);
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            
            // Refresh the tree
            await vscode.commands.executeCommand('testrail.refreshTree');
            console.log(`Cleanup complete for ${entityType} ${id}`);
        } catch (error) {
            console.error('Delete operation failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to delete from TestRail: ${errorMessage}`);
        }
    }

    /**
     * Refreshes the YAML document with the latest data from TestRail.
     * Fetches current state from TestRail API and updates the document.
     * Supports cases, sections, projects, and suites.
     * @param document - The YAML text document to refresh
     * @private
     */
    private async refreshFromTestRail(document: vscode.TextDocument): Promise<void> {
        if (!this.helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        try {
            const yamlContent = document.getText();
            const data = yaml.load(yamlContent) as any;
            
            const entityType = data.entityType;
            const id = data.id;

            if (!id) {
                vscode.window.showErrorMessage('Cannot refresh: entity has no ID (not yet created)');
                return;
            }

            let refreshedData: any;

            switch (entityType) {
                case 'case':
                    refreshedData = await this.helper.getCase(id);
                    break;
                case 'section':
                    refreshedData = await this.helper.getSection(id);
                    break;
                case 'suite':
                    refreshedData = await this.helper.getSuite(id);
                    break;
                case 'project':
                    refreshedData = await this.helper.getProject(id);
                    break;
                default:
                    throw new Error(`Unknown entity type: ${entityType}`);
            }

            // Convert to YAML using the appropriate converter
            let updatedYaml: string;

            switch (entityType) {
                case 'case':
                    updatedYaml = yamlConverters.caseToYaml(refreshedData);
                    break;
                case 'section':
                    updatedYaml = yamlConverters.sectionToYaml(refreshedData);
                    break;
                case 'suite':
                    updatedYaml = yamlConverters.suiteToYaml(refreshedData);
                    break;
                case 'project':
                    updatedYaml = yamlConverters.projectToYaml(refreshedData);
                    break;
                default:
                    throw new Error(`Unknown entity type: ${entityType}`);
            }

            // Update the document
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
            await vscode.workspace.applyEdit(edit);
            await document.save();

            vscode.window.showInformationMessage(`Refreshed from TestRail`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh from TestRail: ${error}`);
        }
    }

    private async openInBrowser(document: vscode.TextDocument): Promise<void> {
        try {
            const yamlContent = document.getText();
            const data = yaml.load(yamlContent) as any;
            
            const entityType = data.entityType;
            const id = data.id;

            if (!id) {
                vscode.window.showErrorMessage('Cannot open in browser: entity has no ID (not yet created)');
                return;
            }

            const config = vscode.workspace.getConfiguration('testrailTools');
            const baseUrl = config.get<string>('testrailBaseUrl');

            if (!baseUrl) {
                vscode.window.showErrorMessage('TestRail base URL is not configured');
                return;
            }

            let url: string;

            switch (entityType) {
                case 'case':
                    // TestRail case URL format: https://yourcompany.testrail.io/index.php?/cases/view/{id}
                    url = `${baseUrl}/index.php?/cases/view/${id}`;
                    break;
                case 'section': {
                    // Sections don't have direct URLs, but we can link to the suite
                    const section = data;
                    if (section.suite_id) {
                        url = `${baseUrl}/index.php?/suites/view/${section.suite_id}`;
                    } else {
                        vscode.window.showErrorMessage('Section has no suite_id');
                        return;
                    }
                    break;
                }
                case 'suite':
                    url = `${baseUrl}/index.php?/suites/view/${id}`;
                    break;
                case 'project':
                    url = `${baseUrl}/index.php?/projects/overview/${id}`;
                    break;
                default:
                    vscode.window.showErrorMessage(`Cannot open ${entityType} in browser`);
                    return;
            }

            await vscode.env.openExternal(vscode.Uri.parse(url));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open in browser: ${error}`);
        }
    }
}
