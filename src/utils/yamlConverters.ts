import * as yaml from 'js-yaml';
import { TestRailCase, TestRailSection, TestRailSuite, TestRailProject } from '../helpers/testrailTypes';

export function caseToYaml(testCase: TestRailCase): string {
    const data: any = {
        entityType: 'case',
        id: testCase.id,
        title: testCase.title,
        section_id: testCase.section_id,
        template_id: testCase.template_id,
        type_id: testCase.type_id,
        priority_id: testCase.priority_id,
        estimate: testCase.estimate,
        refs: testCase.refs
    };

    // Add custom fields
    for (const key in testCase) {
        if (key.startsWith('custom_')) {
            data[key] = (testCase as any)[key];
        }
    }

    return yaml.dump(data, { lineWidth: -1, noRefs: true });
}

export function sectionToYaml(section: TestRailSection): string {
    const data: any = {
        entityType: 'section',
        id: section.id,
        name: section.name,
        description: section.description,
        suite_id: section.suite_id,
        parent_id: section.parent_id
    };

    return yaml.dump(data, { lineWidth: -1, noRefs: true });
}

export function suiteToYaml(suite: TestRailSuite): string {
    const data: any = {
        entityType: 'suite',
        id: suite.id,
        name: suite.name,
        description: suite.description,
        project_id: suite.project_id
    };

    return yaml.dump(data, { lineWidth: -1, noRefs: true });
}

export function projectToYaml(project: TestRailProject): string {
    const data: any = {
        entityType: 'project',
        id: project.id,
        name: project.name,
        announcement: project.announcement,
        show_announcement: project.show_announcement,
        is_completed: project.is_completed,
        suite_mode: project.suite_mode
    };

    return yaml.dump(data, { lineWidth: -1, noRefs: true });
}

export function newCaseToYaml(sectionId: number): string {
    // Dynamic import to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('testrailTools');
    const customFieldDefaults = config.get('customFieldDefaults', { custom_automatable: 1 }) as Record<string, any>;
    
    const data: any = {
        entityType: 'case',
        title: '',
        section_id: sectionId,
        ...customFieldDefaults
    };

    return yaml.dump(data, { lineWidth: -1, noRefs: true });
}

export function newSectionToYaml(suiteId: number, parentId?: number): string {
    const data: any = {
        entityType: 'section',
        name: '',
        description: '',
        suite_id: suiteId
    };

    if (parentId) {
        data.parent_id = parentId;
    }

    return yaml.dump(data, { lineWidth: -1, noRefs: true });
}

export function newSuiteToYaml(projectId: number): string {
    const data: any = {
        entityType: 'suite',
        name: '',
        description: '',
        project_id: projectId
    };

    return yaml.dump(data, { lineWidth: -1, noRefs: true });
}

export function newProjectToYaml(): string {
    const data: any = {
        entityType: 'project',
        name: '',
        announcement: '',
        show_announcement: false,
        suite_mode: 1
    };

    return yaml.dump(data, { lineWidth: -1, noRefs: true });
}
