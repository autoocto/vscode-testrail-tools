import * as vscode from 'vscode';
import { TestRailHelper } from '../helpers/testrailHelper';
import { TestRailTreeProvider, TestRailTreeItem } from '../ui/TestRailTreeProvider';

export function registerCaseCommands(
    context: vscode.ExtensionContext,
    helper: TestRailHelper | null,
    treeProvider: TestRailTreeProvider
): void {
    // Open project editor - delegate to YAML command
    const openProjectCommand = vscode.commands.registerCommand('testrail.openProject', async (projectIdOrItem: number | TestRailTreeItem) => {
        await vscode.commands.executeCommand('testrail.openProjectYaml', projectIdOrItem);
    });
    // Open suite editor - delegate to YAML command
    const openSuiteCommand = vscode.commands.registerCommand('testrail.openSuite', async (suiteIdOrItem: number | TestRailTreeItem) => {
        await vscode.commands.executeCommand('testrail.openSuiteYaml', suiteIdOrItem);
    });

    // Open section editor - delegate to YAML command
    const openSectionCommand = vscode.commands.registerCommand('testrail.openSection', async (sectionIdOrItem: number | TestRailTreeItem) => {
        await vscode.commands.executeCommand('testrail.openSectionYaml', sectionIdOrItem);
    });
    // Open case editor - delegate to YAML command
    const openCaseCommand = vscode.commands.registerCommand('testrail.openCase', async (caseIdOrItem: number | TestRailTreeItem) => {
        await vscode.commands.executeCommand('testrail.openCaseYaml', caseIdOrItem);
    });

    // Create new case - delegate to YAML command
    const createCaseCommand = vscode.commands.registerCommand('testrail.createCase', async (sectionItem?: TestRailTreeItem) => {
        await vscode.commands.executeCommand('testrail.createCaseYaml', sectionItem);
    });

    // Delete case
    const deleteCaseCommand = vscode.commands.registerCommand('testrail.deleteCase', async (caseItem: TestRailTreeItem) => {
        if (!helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to delete test case C${caseItem.itemId}?`,
            { modal: true },
            'Delete'
        );

        if (confirmation !== 'Delete') {
            return;
        }

        try {
            await helper.deleteCase(caseItem.itemId);
            vscode.window.showInformationMessage(`Deleted test case C${caseItem.itemId}`);
            treeProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to delete test case: ${error}`);
        }
    });

    // Refresh tree
    const refreshTreeCommand = vscode.commands.registerCommand('testrail.refreshTree', () => {
        treeProvider.refresh();
        vscode.window.showInformationMessage('TestRail tree refreshed');
    });

    // Create new suite - delegate to YAML command
    const createSuiteCommand = vscode.commands.registerCommand('testrail.createSuite', async (projectItem?: TestRailTreeItem) => {
        await vscode.commands.executeCommand('testrail.createSuiteYaml', projectItem);
    });

    // Create new section - delegate to YAML command
    const createSectionCommand = vscode.commands.registerCommand('testrail.createSection', async (suiteOrSectionItem?: TestRailTreeItem) => {
        await vscode.commands.executeCommand('testrail.createSectionYaml', suiteOrSectionItem);
    });

    context.subscriptions.push(
        openProjectCommand,
        openSuiteCommand,
        openSectionCommand,
        openCaseCommand,
        createCaseCommand,
        deleteCaseCommand,
        refreshTreeCommand,
        createSuiteCommand,
        createSectionCommand
    );
}
