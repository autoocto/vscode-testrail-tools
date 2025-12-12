import * as vscode from 'vscode';
import { TestRailHelper } from '../helpers/testrailHelper';
import { TestRailProject } from '../helpers/testrailTypes';

export class ProjectEditorProvider {
    private panels: Map<number, vscode.WebviewPanel> = new Map();

    constructor(
        private context: vscode.ExtensionContext,
        private helper: TestRailHelper | null
    ) {}

    async openProject(projectId: number): Promise<void> {
        if (!this.helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        const existingPanel = this.panels.get(projectId);
        if (existingPanel) {
            existingPanel.reveal();
            return;
        }

        try {
            const project = await this.helper.getProject(projectId);
            const panel = this.createWebviewPanel(project);
            this.panels.set(projectId, panel);

            panel.onDidDispose(() => {
                this.panels.delete(projectId);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open project ${projectId}: ${error}`);
        }
    }

    private createWebviewPanel(project: TestRailProject): vscode.WebviewPanel {
        const truncatedName = project.name.length > 50 
            ? project.name.substring(0, 47) + '...' 
            : project.name;

        const panel = vscode.window.createWebviewPanel(
            'testrailProject',
            `Project: ${truncatedName}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getWebviewContent(project);

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'save':
                        await this.saveProject(project.id, message.data);
                        break;
                    case 'refresh':
                        await this.refreshProject(panel, project.id);
                        break;
                    case 'openInBrowser':
                        this.openInBrowser(project.id);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        return panel;
    }

    private getWebviewContent(project: TestRailProject): string {
        const suiteModeText = ['', 'Single Suite', 'Single Suite + Baselines', 'Multiple Suites'][project.suite_mode] || 'Unknown';
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Project ${project.id}</title>
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
                input, textarea, select {
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
                .checkbox-field {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .checkbox-field input[type="checkbox"] {
                    width: auto;
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
                <h2>Project: ${this.escapeHtml(project.name)}</h2>
                <div class="actions">
                    <button onclick="save()">💾 Save</button>
                    <button onclick="refresh()">🔄 Refresh</button>
                    <button onclick="openInBrowser()">🌐 Open in Browser</button>
                </div>
            </div>

            <div class="field">
                <label for="name">Name:</label>
                <input type="text" id="name" value="${this.escapeHtml(project.name)}">
            </div>

            <div class="field">
                <label for="announcement">Announcement:</label>
                <textarea id="announcement">${this.stripHtml(project.announcement || '')}</textarea>
            </div>

            <div class="checkbox-field field">
                <input type="checkbox" id="showAnnouncement" ${project.show_announcement ? 'checked' : ''}>
                <label for="showAnnouncement">Show Announcement</label>
            </div>

            <div class="checkbox-field field">
                <input type="checkbox" id="isCompleted" ${project.is_completed ? 'checked' : ''}>
                <label for="isCompleted">Project Completed</label>
            </div>

            <div class="metadata">
                <p><strong>ID:</strong> ${project.id}</p>
                <p><strong>Suite Mode:</strong> ${suiteModeText} (${project.suite_mode})</p>
                <p><strong>URL:</strong> ${this.escapeHtml(project.url || '')}</p>
                <p><strong>Completed On:</strong> ${project.completed_on ? new Date(project.completed_on * 1000).toLocaleString() : 'N/A'}</p>
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                function save() {
                    const name = document.getElementById('name').value;
                    const announcement = document.getElementById('announcement').value;
                    const show_announcement = document.getElementById('showAnnouncement').checked;
                    const is_completed = document.getElementById('isCompleted').checked;
                    
                    vscode.postMessage({
                        command: 'save',
                        data: {
                            name,
                            announcement,
                            show_announcement,
                            is_completed
                        }
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

    private async saveProject(projectId: number, data: any): Promise<void> {
        if (!this.helper) {
            return;
        }

        try {
            await this.helper.updateProject(projectId, data);
            vscode.window.showInformationMessage(`Project saved successfully`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save project: ${error}`);
        }
    }

    private async refreshProject(panel: vscode.WebviewPanel, projectId: number): Promise<void> {
        if (!this.helper) {
            return;
        }

        try {
            const project = await this.helper.getProject(projectId);
            panel.webview.html = this.getWebviewContent(project);
            vscode.window.showInformationMessage('Project refreshed');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh project: ${error}`);
        }
    }

    private openInBrowser(projectId: number): void {
        const config = vscode.workspace.getConfiguration('testrailTools');
        const baseUrl = config.get<string>('testrailBaseUrl');
        if (baseUrl) {
            const url = `${baseUrl}/index.php?/projects/overview/${projectId}`;
            vscode.env.openExternal(vscode.Uri.parse(url));
        } else {
            vscode.window.showErrorMessage('TestRail base URL is not configured');
        }
    }
}
