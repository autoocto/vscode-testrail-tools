import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { TestRailHelper } from '../helpers/testrailHelper';

export class TestRailDocumentProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = 'testrail.editor';
    
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly helper: TestRailHelper | null
    ) {}

    public static register(context: vscode.ExtensionContext, helper: TestRailHelper | null): vscode.Disposable {
        const provider = new TestRailDocumentProvider(context, helper);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            TestRailDocumentProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
                supportsMultipleEditorsPerDocument: false,
            }
        );
        return providerRegistration;
    }

    async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<void> {
        // Set up the webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        // Render the preview
        this.updateWebview(document, webviewPanel.webview);

        // Listen for document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview(document, webviewPanel.webview);
            }
        });

        // Listen for messages from the webview
        webviewPanel.webview.onDidReceiveMessage(async message => {
            switch (message.type) {
                case 'save':
                    await this.saveToTestRail(document);
                    break;
            }
        });

        // Clean up
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    }

    private updateWebview(document: vscode.TextDocument, webview: vscode.Webview): void {
        try {
            const yamlContent = document.getText();
            const data = yaml.load(yamlContent) as any;
            
            webview.html = this.getHtmlForWebview(data);
        } catch (error) {
            webview.html = this.getErrorHtml(error);
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
        }
        .field-value {
            margin-top: 5px;
            white-space: pre-wrap;
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
    <h1>TestRail ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Preview</h1>
    ${this.renderPreview(data, entityType)}
    <button onclick="saveToTestRail()">💾 Save to TestRail</button>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function saveToTestRail() {
            vscode.postMessage({ type: 'save' });
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
            <div class="field-value">${this.escapeHtml(data.title || '')}</div>
        </div>`;

        if (data.section_id) {
            html += `<div class="field">
                <div class="field-label">Section ID</div>
                <div class="field-value">${data.section_id}</div>
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

        if (data.refs) {
            html += `<div class="field">
                <div class="field-label">References</div>
                <div class="field-value">${this.escapeHtml(data.refs)}</div>
            </div>`;
        }

        if (data.custom_preconds) {
            html += `<div class="field">
                <div class="field-label">Preconditions</div>
                <div class="field-value">${this.escapeHtml(data.custom_preconds)}</div>
            </div>`;
        }

        if (data.custom_steps) {
            html += `<div class="field">
                <div class="field-label">Steps</div>
                <div class="steps">`;
            
            for (const step of data.custom_steps || []) {
                html += `<div class="step">
                    <strong>Step:</strong> ${this.escapeHtml(step.content || '')}
                    <br><strong>Expected:</strong> ${this.escapeHtml(step.expected || '')}
                </div>`;
            }
            
            html += `</div></div>`;
        }

        if (data.custom_expected) {
            html += `<div class="field">
                <div class="field-label">Expected Result</div>
                <div class="field-value">${this.escapeHtml(data.custom_expected)}</div>
            </div>`;
        }

        // Add custom fields
        for (const key in data) {
            if (key.startsWith('custom_') && key !== 'custom_preconds' && key !== 'custom_steps' && key !== 'custom_expected') {
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
            <div class="field-value">${this.escapeHtml(data.name || '')}</div>
        </div>`;

        if (data.description) {
            html += `<div class="field">
                <div class="field-label">Description</div>
                <div class="field-value">${this.escapeHtml(data.description)}</div>
            </div>`;
        }

        if (data.suite_id) {
            html += `<div class="field">
                <div class="field-label">Suite ID</div>
                <div class="field-value">${data.suite_id}</div>
            </div>`;
        }

        if (data.parent_id) {
            html += `<div class="field">
                <div class="field-label">Parent Section ID</div>
                <div class="field-value">${data.parent_id}</div>
            </div>`;
        }

        return html;
    }

    private renderSuitePreview(data: any): string {
        let html = `<div class="field">
            <div class="field-label">Name</div>
            <div class="field-value">${this.escapeHtml(data.name || '')}</div>
        </div>`;

        if (data.description) {
            html += `<div class="field">
                <div class="field-label">Description</div>
                <div class="field-value">${this.escapeHtml(data.description)}</div>
            </div>`;
        }

        return html;
    }

    private renderProjectPreview(data: any): string {
        let html = `<div class="field">
            <div class="field-label">Name</div>
            <div class="field-value">${this.escapeHtml(data.name || '')}</div>
        </div>`;

        if (data.announcement) {
            html += `<div class="field">
                <div class="field-label">Announcement</div>
                <div class="field-value">${this.escapeHtml(data.announcement)}</div>
            </div>`;
        }

        if (data.show_announcement !== undefined) {
            html += `<div class="field">
                <div class="field-label">Show Announcement</div>
                <div class="field-value">${data.show_announcement ? 'Yes' : 'No'}</div>
            </div>`;
        }

        if (data.suite_mode !== undefined) {
            html += `<div class="field">
                <div class="field-label">Suite Mode</div>
                <div class="field-value">${data.suite_mode}</div>
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
                    } else {
                        if (!data.section_id) {
                            throw new Error('section_id is required to create a new test case');
                        }
                        // Get custom field defaults from configuration
                        const config = vscode.workspace.getConfiguration('testrailTools');
                        const customFieldDefaults = config.get<Record<string, any>>('customFieldDefaults', { custom_automatable: 1 });
                        
                        const caseData = { ...customFieldDefaults, ...data };
                        delete caseData.entityType;
                        
                        const newCase = await this.helper.addCase(data.section_id, caseData);
                        vscode.window.showInformationMessage(`Test case C${newCase.id} created successfully`);
                        
                        // Update the document with the new ID
                        const edit = new vscode.WorkspaceEdit();
                        const updatedYaml = yaml.dump({ ...data, id: newCase.id });
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
                        await vscode.workspace.applyEdit(edit);
                    }
                    break;

                case 'section':
                    if (id) {
                        await this.helper.updateSection(id, data);
                        vscode.window.showInformationMessage(`Section updated successfully`);
                    } else {
                        if (!data.suite_id) {
                            throw new Error('suite_id is required to create a new section');
                        }
                        const projectId = await this.getProjectIdForSuite(data.suite_id);
                        const newSection = await this.helper.addSection(projectId, data);
                        vscode.window.showInformationMessage(`Section created successfully`);
                        
                        // Update the document with the new ID
                        const edit = new vscode.WorkspaceEdit();
                        const updatedYaml = yaml.dump({ ...data, id: newSection.id });
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
                        await vscode.workspace.applyEdit(edit);
                    }
                    break;

                case 'suite':
                    if (id) {
                        await this.helper.updateSuite(id, data);
                        vscode.window.showInformationMessage(`Suite updated successfully`);
                    } else {
                        if (!data.project_id) {
                            throw new Error('project_id is required to create a new suite');
                        }
                        const newSuite = await this.helper.addSuite(data.project_id, data);
                        vscode.window.showInformationMessage(`Suite created successfully`);
                        
                        // Update the document with the new ID
                        const edit = new vscode.WorkspaceEdit();
                        const updatedYaml = yaml.dump({ ...data, id: newSuite.id });
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
                        await vscode.workspace.applyEdit(edit);
                    }
                    break;

                case 'project':
                    if (id) {
                        await this.helper.updateProject(id, data);
                        vscode.window.showInformationMessage(`Project updated successfully`);
                    } else {
                        const newProject = await this.helper.addProject(data);
                        vscode.window.showInformationMessage(`Project created successfully`);
                        
                        // Update the document with the new ID
                        const edit = new vscode.WorkspaceEdit();
                        const updatedYaml = yaml.dump({ ...data, id: newProject.id });
                        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), updatedYaml);
                        await vscode.workspace.applyEdit(edit);
                    }
                    break;

                default:
                    throw new Error(`Unknown entity type: ${entityType}`);
            }

            // Refresh the tree
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
}
