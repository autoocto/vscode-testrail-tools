import * as vscode from 'vscode';
import { TestRailHelper } from './helpers/testrailHelper';
import { loadTestRailConfig, validateTestRailConfig } from './utils/configLoader';
import { registerTestRailTools } from './tools/testrailTools';
import { TestRailTreeProvider } from './ui/TestRailTreeProvider';
import { TestRailPreviewProvider } from './ui/TestRailPreviewProvider';
import { registerCaseCommands } from './commands/caseCommands';
import { registerYamlCommands } from './commands/yamlCommands';

/**
 * Activates the TestRail Tools extension
 * Sets up all UI components, commands, and language model tools
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('TestRail Tools extension is now active');

    // Load and validate configuration
    const config = loadTestRailConfig();
    const testrailHelper = config && validateTestRailConfig(config) 
        ? new TestRailHelper(config)
        : null;

    if (!testrailHelper) {
        console.warn('TestRail Tools: Configuration not found or invalid. Please configure TestRail settings.');
    }

    // Register language model tools for Copilot Chat integration
    registerTestRailTools(context, testrailHelper);

    // Register Tree View for visual exploration
    const treeProvider = new TestRailTreeProvider(testrailHelper);
    const treeView = vscode.window.createTreeView('testrailExplorer', {
        treeDataProvider: treeProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);

    // Register YAML Preview Provider for editable preview panels
    const previewDisposables = TestRailPreviewProvider.register(context, testrailHelper);
    previewDisposables.forEach(d => context.subscriptions.push(d));

    // Register commands for creating, editing, and deleting entities
    registerCaseCommands(context, testrailHelper, treeProvider);
    registerYamlCommands(context, testrailHelper);
    
    console.log('TestRail Tools: All tools and UI components registered successfully');
}

/**
 * Deactivates the extension and cleans up resources
 */
export function deactivate() {
    // Resources are automatically cleaned up by VS Code's Disposable pattern
}

