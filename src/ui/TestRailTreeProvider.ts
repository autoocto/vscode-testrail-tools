import * as vscode from 'vscode';
import { TestRailHelper } from '../helpers/testrailHelper';
import { TestRailProject, TestRailSuite, TestRailSection, TestRailCase } from '../helpers/testrailTypes';

export class TestRailTreeProvider implements vscode.TreeDataProvider<TestRailTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TestRailTreeItem | undefined | null | void> = new vscode.EventEmitter<TestRailTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TestRailTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private projectsCache: Map<number, TestRailProject> = new Map();
    private suitesCache: Map<number, TestRailSuite[]> = new Map();
    private sectionsCache: Map<string, TestRailSection[]> = new Map();
    private casesCache: Map<string, TestRailCase[]> = new Map();

    constructor(private helper: TestRailHelper | null) {}

    refresh(): void {
        this.projectsCache.clear();
        this.suitesCache.clear();
        this.sectionsCache.clear();
        this.casesCache.clear();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TestRailTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TestRailTreeItem): Promise<TestRailTreeItem[]> {
        if (!this.helper) {
            return [];
        }

        try {
            if (!element) {
                // Root level - show projects
                return await this.getProjects();
            }

            switch (element.contextValue) {
                case 'project':
                    return await this.getProjectChildren(element.itemId);
                case 'suite':
                    return await this.getSections(element.projectId!, element.itemId);
                case 'section':
                    return await this.getSectionChildren(element.projectId!, element.suiteId, element.itemId);
                default:
                    return [];
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load TestRail data: ${error}`);
            return [];
        }
    }

    private async getProjectChildren(projectId: number): Promise<TestRailTreeItem[]> {
        const project = this.projectsCache.get(projectId);
        
        // Check suite mode: 1 = single suite, 2 = single suite + baselines, 3 = multiple suites
        if (project && project.suite_mode === 1) {
            // Single suite mode - show sections directly under project
            return await this.getSections(projectId, 0);
        } else {
            // Multiple suite mode - show suites
            return await this.getSuites(projectId);
        }
    }

    private async getSectionChildren(projectId: number, suiteId: number | undefined, sectionId: number): Promise<TestRailTreeItem[]> {
        const cacheKey = `${projectId}-${suiteId || 0}`;
        const sections = this.sectionsCache.get(cacheKey) || [];
        
        // Find subsections of this section
        const subsections = sections.filter(s => s.parent_id === sectionId);
        
        // Get cases for this section
        const cases = await this.getCases(projectId, suiteId, sectionId);
        
        // Create tree items for subsections
        const subsectionItems = subsections.map(section => new TestRailTreeItem(
            section.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            'section',
            section.id,
            projectId,
            suiteId,
            `$(symbol-folder) ${section.name}`,
            section.description || undefined,
            {
                command: 'testrail.openSection',
                title: 'Open Section',
                arguments: [section.id]
            }
        ));
        
        // Return subsections first, then cases
        return [...subsectionItems, ...cases];
    }

    private async getProjects(): Promise<TestRailTreeItem[]> {
        const response = await this.helper!.getProjects(undefined, 250);
        const projects = response.projects || [];
        
        projects.forEach(p => this.projectsCache.set(p.id, p));
        
        return projects.map(project => new TestRailTreeItem(
            project.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            'project',
            project.id,
            undefined,
            undefined,
            `$(project) ${project.name}`,
            undefined,
            {
                command: 'testrail.openProject',
                title: 'Open Project',
                arguments: [project.id]
            }
        ));
    }

    private async getSuites(projectId: number): Promise<TestRailTreeItem[]> {
        let suites = this.suitesCache.get(projectId);
        
        if (!suites) {
            const response = await this.helper!.getSuites(projectId, 250);
            suites = response.suites || [];
            this.suitesCache.set(projectId, suites);
        }

        return suites.map(suite => new TestRailTreeItem(
            suite.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            'suite',
            suite.id,
            projectId,
            undefined,
            `$(folder) ${suite.name}`,
            suite.description || undefined,
            {
                command: 'testrail.openSuite',
                title: 'Open Suite',
                arguments: [suite.id]
            }
        ));
    }

    private async getSections(projectId: number, suiteId: number): Promise<TestRailTreeItem[]> {
        const cacheKey = `${projectId}-${suiteId}`;
        let sections = this.sectionsCache.get(cacheKey);
        
        if (!sections) {
            sections = [];
            let offset = 0;
            const limit = 250;
            let hasMore = true;
            
            // Fetch all pages of sections
            while (hasMore) {
                const response = await this.helper!.getSections(projectId, suiteId === 0 ? undefined : suiteId, limit, offset);
                const pageSections = response.sections || [];
                sections.push(...pageSections);
                
                // Check if there are more pages
                hasMore = response._links?.next ? true : false;
                offset += limit;
            }
            
            this.sectionsCache.set(cacheKey, sections);
        }

        // Build hierarchical structure - only return root sections (those without parent_id)
        const rootSections = sections.filter(s => !s.parent_id);
        
        return rootSections.map(section => new TestRailTreeItem(
            section.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            'section',
            section.id,
            projectId,
            suiteId === 0 ? undefined : suiteId,
            `$(symbol-folder) ${section.name}`,
            section.description || undefined,
            {
                command: 'testrail.openSection',
                title: 'Open Section',
                arguments: [section.id]
            }
        ));
    }

    private async getCases(projectId: number, suiteId: number | undefined, sectionId: number): Promise<TestRailTreeItem[]> {
        const cacheKey = `${projectId}-${suiteId}-${sectionId}`;
        let cases = this.casesCache.get(cacheKey);
        
        if (!cases) {
            const response = await this.helper!.getCases(projectId, {
                suite_id: suiteId,
                section_id: sectionId,
                limit: 250
            });
            cases = response.cases || [];
            this.casesCache.set(cacheKey, cases);
        }

        return cases.map(testCase => new TestRailTreeItem(
            testCase.title,
            vscode.TreeItemCollapsibleState.None,
            'case',
            testCase.id,
            projectId,
            suiteId,
            `$(beaker) C${testCase.id}: ${testCase.title}`,
            undefined,
            {
                command: 'testrail.openCase',
                title: 'Open Test Case',
                arguments: [testCase.id]
            }
        ));
    }
}

export class TestRailTreeItem extends vscode.TreeItem {
    public readonly itemId: number;
    
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        itemId: number,
        public readonly projectId?: number,
        public readonly suiteId?: number,
        iconText?: string,
        tooltip?: string,
        command?: vscode.Command
    ) {
        super(label, collapsibleState);
        
        this.itemId = itemId;
        this.id = `${contextValue}-${itemId}`;
        this.tooltip = tooltip || label;
        this.description = iconText?.replace(/\$\([^)]+\)\s*/, '');
        this.command = command;
        
        // Set icons based on context
        switch (contextValue) {
            case 'project':
                this.iconPath = new vscode.ThemeIcon('project');
                break;
            case 'suite':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'section':
                this.iconPath = new vscode.ThemeIcon('symbol-folder');
                break;
            case 'case':
                this.iconPath = new vscode.ThemeIcon('beaker');
                break;
        }
    }
}
