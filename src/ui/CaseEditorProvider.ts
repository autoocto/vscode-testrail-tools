import * as vscode from 'vscode';
import { TestRailHelper } from '../helpers/testrailHelper';
import { TestRailCase } from '../helpers/testrailTypes';
import { EditorStateManager } from './EditorStateManager';

export class CaseEditorProvider {
    private panels: Map<number, vscode.WebviewPanel> = new Map();

    constructor(
        private context: vscode.ExtensionContext,
        private helper: TestRailHelper | null
    ) {}

    async openCase(caseId: number): Promise<void> {
        if (!this.helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        // Reuse existing panel if already open
        const existingPanel = this.panels.get(caseId);
        if (existingPanel) {
            existingPanel.reveal();
            return;
        }

        try {
            const testCase = await this.helper.getCase(caseId);
            const panel = this.createWebviewPanel(testCase);
            this.panels.set(caseId, panel);

            panel.onDidDispose(() => {
                this.panels.delete(caseId);
                const stateManager = EditorStateManager.getInstance();
                const current = stateManager.getActiveEditor();
                if (current?.type === 'case' && current.id === caseId) {
                    stateManager.clearActiveEditor();
                }
            });

            // Track as active editor
            panel.onDidChangeViewState(e => {
                if (e.webviewPanel.visible) {
                    EditorStateManager.getInstance().setActiveEditor({
                        type: 'case',
                        id: caseId,
                        data: testCase,
                        panelTitle: panel.title
                    });
                }
            });

            // Set as active immediately
            EditorStateManager.getInstance().setActiveEditor({
                type: 'case',
                id: caseId,
                data: testCase,
                panelTitle: panel.title
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open test case ${caseId}: ${error}`);
        }
    }

    private createWebviewPanel(testCase: TestRailCase): vscode.WebviewPanel {
        const truncatedTitle = testCase.title.length > 50 
            ? testCase.title.substring(0, 47) + '...' 
            : testCase.title;
            
        const panel = vscode.window.createWebviewPanel(
            'testrailCase',
            `C${testCase.id}: ${truncatedTitle}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getWebviewContent(testCase);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'save':
                        await this.saveCase(testCase.id, message.data);
                        break;
                    case 'refresh':
                        await this.refreshCase(panel, testCase.id);
                        break;
                    case 'openInBrowser':
                        this.openInBrowser(testCase.id);
                        break;
                    case 'delete':
                        await this.deleteCase(testCase.id, panel);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        return panel;
    }

    private getWebviewContent(testCase: TestRailCase): string {
        const customSteps = testCase.custom_steps_separated || [];
        const stepsHtml = customSteps.map((step: any, index: number) => `
            <div class="step" data-index="${index}">
                <div class="step-header">
                    <span class="step-number">Step ${index + 1}</span>
                    <div class="step-actions">
                        <button onclick="moveStepUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button onclick="moveStepDown(${index})" ${index === customSteps.length - 1 ? 'disabled' : ''}>↓</button>
                        <button onclick="deleteStep(${index})">🗑️</button>
                    </div>
                </div>
                <div class="step-content">
                    <label>Content:</label>
                    <textarea class="step-input" data-field="content">${this.stripHtml(step.content || '')}</textarea>
                </div>
                <div class="step-expected">
                    <label>Expected Result:</label>
                    <textarea class="step-input" data-field="expected">${this.stripHtml(step.expected || '')}</textarea>
                </div>
            </div>
        `).join('');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Case C${testCase.id}</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .actions {
                    display: flex;
                    gap: 10px;
                }
                button {
                    padding: 6px 12px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                    border-radius: 2px;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .field {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                input, textarea, select {
                    width: 100%;
                    padding: 6px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    box-sizing: border-box;
                }
                textarea {
                    min-height: 60px;
                    resize: vertical;
                    font-family: var(--vscode-font-family);
                }
                .step {
                    border: 1px solid var(--vscode-panel-border);
                    padding: 15px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                }
                .step-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .step-number {
                    font-weight: bold;
                }
                .step-actions {
                    display: flex;
                    gap: 5px;
                }
                .step-actions button {
                    padding: 2px 8px;
                    font-size: 12px;
                }
                .metadata {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .steps-section {
                    margin-top: 20px;
                }
                .add-step {
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Test Case C${testCase.id}</h2>
                <div class="actions">
                    <button onclick="save()">💾 Save</button>
                    <button onclick="refresh()">🔄 Refresh</button>
                    <button onclick="openInBrowser()">🌐 Open in Browser</button>
                    <button onclick="deleteCase()" style="background: var(--vscode-errorForeground); color: var(--vscode-button-foreground);">🗑️ Delete</button>
                </div>
            </div>

            <div class="field">
                <label for="title">Title:</label>
                <input type="text" id="title" value="${this.escapeHtml(testCase.title)}">
            </div>

            <div class="metadata">
                <div class="field">
                    <label for="priority">Priority ID:</label>
                    <input type="number" id="priority" value="${testCase.priority_id || ''}">
                </div>
                <div class="field">
                    <label for="estimate">Estimate:</label>
                    <input type="text" id="estimate" value="${testCase.estimate || ''}">
                </div>
            </div>

            <div class="field">
                <label for="refs">References:</label>
                <input type="text" id="refs" value="${this.escapeHtml(testCase.refs || '')}">
            </div>

            <div class="steps-section">
                <h3>Steps</h3>
                <div id="steps-container">
                    ${stepsHtml}
                </div>
                <button class="add-step" onclick="addStep()">➕ Add Step</button>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function save() {
                    const title = document.getElementById('title').value;
                    const priority_id = parseInt(document.getElementById('priority').value) || null;
                    const estimate = document.getElementById('estimate').value;
                    const refs = document.getElementById('refs').value;
                    
                    const steps = [];
                    document.querySelectorAll('.step').forEach(step => {
                        const content = step.querySelector('[data-field="content"]').value;
                        const expected = step.querySelector('[data-field="expected"]').value;
                        steps.push({ content, expected });
                    });

                    vscode.postMessage({
                        command: 'save',
                        data: {
                            title,
                            priority_id,
                            estimate,
                            refs,
                            custom_steps_separated: steps
                        }
                    });
                }

                function refresh() {
                    vscode.postMessage({ command: 'refresh' });
                }

                function openInBrowser() {
                    vscode.postMessage({ command: 'openInBrowser' });
                }

                function deleteCase() {
                    if (confirm('Are you sure you want to delete this test case? This action cannot be undone.')) {
                        vscode.postMessage({ command: 'delete' });
                    }
                }

                function addStep() {
                    const container = document.getElementById('steps-container');
                    const index = container.children.length;
                    const stepHtml = \`
                        <div class="step" data-index="\${index}">
                            <div class="step-header">
                                <span class="step-number">Step \${index + 1}</span>
                                <div class="step-actions">
                                    <button onclick="moveStepUp(\${index})" \${index === 0 ? 'disabled' : ''}>↑</button>
                                    <button onclick="moveStepDown(\${index})">↓</button>
                                    <button onclick="deleteStep(\${index})">🗑️</button>
                                </div>
                            </div>
                            <div class="step-content">
                                <label>Content:</label>
                                <textarea class="step-input" data-field="content"></textarea>
                            </div>
                            <div class="step-expected">
                                <label>Expected Result:</label>
                                <textarea class="step-input" data-field="expected"></textarea>
                            </div>
                        </div>
                    \`;
                    container.insertAdjacentHTML('beforeend', stepHtml);
                    renumberSteps();
                }

                function deleteStep(index) {
                    const steps = document.querySelectorAll('.step');
                    if (steps.length > 0 && confirm('Delete this step?')) {
                        steps[index].remove();
                        renumberSteps();
                    }
                }

                function moveStepUp(index) {
                    const steps = document.querySelectorAll('.step');
                    if (index > 0) {
                        const container = document.getElementById('steps-container');
                        container.insertBefore(steps[index], steps[index - 1]);
                        renumberSteps();
                    }
                }

                function moveStepDown(index) {
                    const steps = document.querySelectorAll('.step');
                    if (index < steps.length - 1) {
                        const container = document.getElementById('steps-container');
                        container.insertBefore(steps[index + 1], steps[index]);
                        renumberSteps();
                    }
                }

                function renumberSteps() {
                    const steps = document.querySelectorAll('.step');
                    steps.forEach((step, index) => {
                        step.setAttribute('data-index', index);
                        step.querySelector('.step-number').textContent = 'Step ' + (index + 1);
                        const upBtn = step.querySelector('button[onclick^="moveStepUp"]');
                        const downBtn = step.querySelector('button[onclick^="moveStepDown"]');
                        upBtn.disabled = index === 0;
                        downBtn.disabled = index === steps.length - 1;
                        upBtn.setAttribute('onclick', \`moveStepUp(\${index})\`);
                        downBtn.setAttribute('onclick', \`moveStepDown(\${index})\`);
                        step.querySelector('button[onclick^="deleteStep"]').setAttribute('onclick', \`deleteStep(\${index})\`);
                    });
                }
            </script>
        </body>
        </html>`;
    }

    private escapeHtml(text: string): string {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private stripHtml(text: string): string {
        if (!text) return '';
        // First decode HTML entities
        const decoded = text
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&');
        // Then strip all HTML tags
        return decoded.replace(/<[^>]*>/g, '');
    }

    private async saveCase(caseId: number, data: any): Promise<void> {
        if (!this.helper) {
            return;
        }

        try {
            await this.helper.updateCase(caseId, data);
            vscode.window.showInformationMessage(`Test case C${caseId} saved successfully`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save test case: ${error}`);
        }
    }

    private async refreshCase(panel: vscode.WebviewPanel, caseId: number): Promise<void> {
        if (!this.helper) {
            return;
        }

        try {
            const testCase = await this.helper.getCase(caseId);
            panel.webview.html = this.getWebviewContent(testCase);
            vscode.window.showInformationMessage('Test case refreshed');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh test case: ${error}`);
        }
    }

    private openInBrowser(caseId: number): void {
        const config = vscode.workspace.getConfiguration('testrailTools');
        const baseUrl = config.get<string>('testrailBaseUrl');
        if (baseUrl) {
            const url = `${baseUrl}/index.php?/cases/view/${caseId}`;
            vscode.env.openExternal(vscode.Uri.parse(url));
        } else {
            vscode.window.showErrorMessage('TestRail base URL is not configured');
        }
    }

    private async deleteCase(caseId: number, panel: vscode.WebviewPanel): Promise<void> {
        if (!this.helper) {
            return;
        }

        try {
            await this.helper.deleteCase(caseId);
            vscode.window.showInformationMessage(`Test case C${caseId} deleted successfully`);
            panel.dispose();
            // Trigger tree refresh via command
            vscode.commands.executeCommand('testrail.refreshTree');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete test case: ${error}`);
        }
    }
}
