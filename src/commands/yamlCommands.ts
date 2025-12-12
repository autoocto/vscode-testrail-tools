import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { TestRailHelper } from '../helpers/testrailHelper';
import { TestRailTreeItem } from '../ui/TestRailTreeProvider';
import * as yamlConverters from '../utils/yamlConverters';

export function registerYamlCommands(
    context: vscode.ExtensionContext,
    helper: TestRailHelper | null
): void {
    // Open entity in YAML editor
    const openProjectYamlCommand = vscode.commands.registerCommand('testrail.openProjectYaml', async (projectIdOrItem: number | TestRailTreeItem) => {
        if (!helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        const projectId = typeof projectIdOrItem === 'number' ? projectIdOrItem : projectIdOrItem.itemId;
        
        try {
            const project = await helper.getProject(projectId);
            const yamlContent = yamlConverters.projectToYaml(project);
            await openYamlDocument(yamlContent);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load project: ${error}`);
        }
    });

    const openSuiteYamlCommand = vscode.commands.registerCommand('testrail.openSuiteYaml', async (suiteIdOrItem: number | TestRailTreeItem) => {
        if (!helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        const suiteId = typeof suiteIdOrItem === 'number' ? suiteIdOrItem : suiteIdOrItem.itemId;
        
        try {
            const suite = await helper.getSuite(suiteId);
            const yamlContent = yamlConverters.suiteToYaml(suite);
            await openYamlDocument(yamlContent);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load suite: ${error}`);
        }
    });

    const openSectionYamlCommand = vscode.commands.registerCommand('testrail.openSectionYaml', async (sectionIdOrItem: number | TestRailTreeItem) => {
        if (!helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        const sectionId = typeof sectionIdOrItem === 'number' ? sectionIdOrItem : sectionIdOrItem.itemId;
        
        try {
            const section = await helper.getSection(sectionId);
            const yamlContent = yamlConverters.sectionToYaml(section);
            await openYamlDocument(yamlContent);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load section: ${error}`);
        }
    });

    const openCaseYamlCommand = vscode.commands.registerCommand('testrail.openCaseYaml', async (caseIdOrItem: number | TestRailTreeItem) => {
        if (!helper) {
            vscode.window.showErrorMessage('TestRail is not configured');
            return;
        }

        const caseId = typeof caseIdOrItem === 'number' ? caseIdOrItem : caseIdOrItem.itemId;
        
        try {
            const testCase = await helper.getCase(caseId);
            const yamlContent = yamlConverters.caseToYaml(testCase);
            await openYamlDocument(yamlContent);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load test case: ${error}`);
        }
    });

    // Create new entities in YAML editor
    const createCaseYamlCommand = vscode.commands.registerCommand('testrail.createCaseYaml', async (sectionItem?: TestRailTreeItem) => {
        if (!sectionItem) {
            vscode.window.showErrorMessage('Please select a section first');
            return;
        }

        const yamlContent = yamlConverters.newCaseToYaml(sectionItem.itemId);
        await openYamlDocument(yamlContent);
    });

    const createSectionYamlCommand = vscode.commands.registerCommand('testrail.createSectionYaml', async (suiteOrSectionItem?: TestRailTreeItem) => {
        if (!suiteOrSectionItem || (suiteOrSectionItem.contextValue !== 'suite' && suiteOrSectionItem.contextValue !== 'section')) {
            vscode.window.showErrorMessage('Please select a suite or section first');
            return;
        }

        const suiteId = suiteOrSectionItem.contextValue === 'suite' ? suiteOrSectionItem.itemId : suiteOrSectionItem.suiteId;
        const parentId = suiteOrSectionItem.contextValue === 'section' ? suiteOrSectionItem.itemId : undefined;

        if (!suiteId) {
            vscode.window.showErrorMessage('Could not determine suite ID');
            return;
        }

        const yamlContent = yamlConverters.newSectionToYaml(suiteId, parentId);
        await openYamlDocument(yamlContent);
    });

    const createSuiteYamlCommand = vscode.commands.registerCommand('testrail.createSuiteYaml', async (projectItem?: TestRailTreeItem) => {
        if (!projectItem || projectItem.contextValue !== 'project') {
            vscode.window.showErrorMessage('Please select a project first');
            return;
        }

        const yamlContent = yamlConverters.newSuiteToYaml(projectItem.itemId);
        await openYamlDocument(yamlContent);
    });

    const createProjectYamlCommand = vscode.commands.registerCommand('testrail.createProjectYaml', async () => {
        const yamlContent = yamlConverters.newProjectToYaml();
        await openYamlDocument(yamlContent);
    });

    context.subscriptions.push(
        openProjectYamlCommand,
        openSuiteYamlCommand,
        openSectionYamlCommand,
        openCaseYamlCommand,
        createCaseYamlCommand,
        createSectionYamlCommand,
        createSuiteYamlCommand,
        createProjectYamlCommand
    );
}

async function openYamlDocument(content: string): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    // Create a .testrail directory if it doesn't exist
    const testrailDir = path.join(workspaceFolder.uri.fsPath, '.testrail');
    
    try {
        await fs.mkdir(testrailDir, { recursive: true });
    } catch (error) {
        // Directory might already exist, ignore
    }

    // Parse YAML to get entity type and ID for filename
    const data = yaml.load(content) as any;
    const entityType = data.entityType || 'unknown';
    const entityId = data.id || 'new';
    
    // Use entity type and ID in filename to reuse the same file
    const filename = `${entityType}-${entityId}.testrail.yaml`;
    const filePath = path.join(testrailDir, filename);
    
    // Write the content to the file (overwrite if exists)
    await fs.writeFile(filePath, content, 'utf8');
    
    // Open the file
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc, { preview: false });
}
