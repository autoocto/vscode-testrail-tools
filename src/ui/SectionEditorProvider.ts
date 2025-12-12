import * as vscode from 'vscode';
import { TestRailHelper } from '../helpers/testrailHelper';
import { TestRailSection } from '../helpers/testrailTypes';

export class SectionEditorProvider {
    private panels: Map<number, vscode.WebviewPanel> = new Map();

    constructor(
        private context: vscode.ExtensionContext,
        private helper: TestRailHelper | null
    ) {}

    async openSection(sectionId: number): Promise<void> {
        if (!this.helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        const existingPanel = this.panels.get(sectionId);
        if (existingPanel) {
            existingPanel.reveal();
            return;
        }

        try {
            const section = await this.helper.getSection(sectionId);
            const panel = this.createWebviewPanel(section);
            this.panels.set(sectionId, panel);

            panel.onDidDispose(() => {
                this.panels.delete(sectionId);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open section ${sectionId}: ${error}`);
        }
    }

    private createWebviewPanel(section: TestRailSection): vscode.WebviewPanel {
        const panel = vscode.window.createWebviewPanel(
            'testrailSection',
            `Section: ${section.name}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getWebviewContent(section);

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'save':
                        await this.saveSection(section.id, message.data);
                        break;
                    case 'refresh':
                        await this.refreshSection(panel, section.id);
                        break;
                    case 'openInBrowser':
                        this.openInBrowser(section.suite_id);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        return panel;
    }

    private getWebviewContent(section: TestRailSection): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Section ${section.id}</title>
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
                .field {
                    margin-bottom: 15px;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                input, textarea {
                    width: 100%;
                    padding: 6px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    box-sizing: border-box;
                }
                textarea {
                    min-height: 100px;
                    resize: vertical;
                    font-family: var(--vscode-font-family);
                }
                .metadata {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid var(--vscode-panel-border);
                    color: var(--vscode-descriptionForeground);
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Section: ${this.escapeHtml(section.name)}</h2>
                <div class="actions">
                    <button onclick="save()">💾 Save</button>
                    <button onclick="refresh()">🔄 Refresh</button>
                    <button onclick="openInBrowser()">🌐 Open in Browser</button>
                </div>
            </div>

            <div class="field">
                <label for="name">Name:</label>
                <input type="text" id="name" value="${this.escapeHtml(section.name)}">
            </div>

            <div class="field">
                <label for="description">Description:</label>
                <textarea id="description">${this.stripHtml(section.description || '')}</textarea>
            </div>

            <div class="metadata">
                <p><strong>ID:</strong> ${section.id}</p>
                <p><strong>Suite ID:</strong> ${section.suite_id}</p>
                <p><strong>Parent ID:</strong> ${section.parent_id || 'None (root level)'}</p>
                <p><strong>Depth:</strong> ${section.depth}</p>
                <p><strong>Display Order:</strong> ${section.display_order}</p>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function save() {
                    const name = document.getElementById('name').value;
                    const description = document.getElementById('description').value;
                    
                    vscode.postMessage({
                        command: 'save',
                        data: { name, description }
                    });
                }

                function refresh() {
                    vscode.postMessage({ command: 'refresh' });
                }

                function openInBrowser() {
                    vscode.postMessage({ command: 'openInBrowser' });
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

    private async saveSection(sectionId: number, data: any): Promise<void> {
        if (!this.helper) {
            return;
        }

        try {
            await this.helper.updateSection(sectionId, data);
            vscode.window.showInformationMessage(`Section saved successfully`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save section: ${error}`);
        }
    }

    private async refreshSection(panel: vscode.WebviewPanel, sectionId: number): Promise<void> {
        if (!this.helper) {
            return;
        }

        try {
            const section = await this.helper.getSection(sectionId);
            panel.webview.html = this.getWebviewContent(section);
            vscode.window.showInformationMessage('Section refreshed');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh section: ${error}`);
        }
    }

    private openInBrowser(suiteId: number): void {
        const config = vscode.workspace.getConfiguration('testrailTools');
        const baseUrl = config.get<string>('testrailBaseUrl');
        if (baseUrl) {
            const url = `${baseUrl}/index.php?/suites/view/${suiteId}`;
            vscode.env.openExternal(vscode.Uri.parse(url));
        } else {
            vscode.window.showErrorMessage('TestRail base URL is not configured');
        }
    }
}
