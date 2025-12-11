/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from 'vscode';
import { TestRailHelper } from '../helpers/testrailHelper';
import { handleToolError, createSuccessResult } from '../utils/errorHandler';
import {
    formatProject,
    formatSuite,
    formatSection,
    formatCase,
    formatUser,
    formatGroup,
    formatPriority,
    formatProjectsSummary,
    formatSuitesSummary,
    formatSectionsSummary,
    formatCasesSummary,
    formatUsersSummary,
    formatGroupsSummary
} from '../utils/formatters';

export function registerTestRailTools(context: vscode.ExtensionContext, helper: TestRailHelper | null): void {
    // ===== PROJECT TOOLS =====

    const getProjectTool = vscode.lm.registerTool('getTestRailProject', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ projectId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { projectId } = options.input;
            try {
                const project = await helper.getProject(projectId);
                const formatted = formatProject(project);
                return createSuccessResult({ project, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to get project ${projectId}`);
            }
        }
    });

    const getProjectsTool = vscode.lm.registerTool('getTestRailProjects', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ isCompleted?: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { isCompleted } = options.input;
            try {
                const projectsResp = await helper.getProjects(isCompleted);
                const projects = projectsResp.projects || [];
                const summary = formatProjectsSummary(projects);
                return createSuccessResult({ projects, count: projects.length, summary });
            } catch (error) {
                return handleToolError(error, 'Failed to get projects');
            }
        }
    });

    const addProjectTool = vscode.lm.registerTool('addTestRailProject', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            name: string;
            announcement?: string;
            showAnnouncement?: boolean;
            suiteMode?: number;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { name, announcement, showAnnouncement, suiteMode } = options.input;
            try {
                const data: any = { name };
                if (announcement !== undefined) data.announcement = announcement;
                if (showAnnouncement !== undefined) data.show_announcement = showAnnouncement;
                if (suiteMode !== undefined) data.suite_mode = suiteMode;

                const project = await helper.addProject(data);
                const formatted = formatProject(project);
                return createSuccessResult({ message: `Created project ${project.name}`, project, formatted });
            } catch (error) {
                return handleToolError(error, 'Failed to create project');
            }
        }
    });

    const updateProjectTool = vscode.lm.registerTool('updateTestRailProject', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            projectId: number;
            name?: string;
            announcement?: string;
            showAnnouncement?: boolean;
            isCompleted?: boolean;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { projectId, name, announcement, showAnnouncement, isCompleted } = options.input;
            try {
                const data: any = {};
                if (name !== undefined) data.name = name;
                if (announcement !== undefined) data.announcement = announcement;
                if (showAnnouncement !== undefined) data.show_announcement = showAnnouncement;
                if (isCompleted !== undefined) data.is_completed = isCompleted;

                const project = await helper.updateProject(projectId, data);
                return createSuccessResult({ message: `Updated project ${projectId}`, project });
            } catch (error) {
                return handleToolError(error, `Failed to update project ${projectId}`);
            }
        }
    });

    const deleteProjectTool = vscode.lm.registerTool('deleteTestRailProject', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ projectId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { projectId } = options.input;
            try {
                await helper.deleteProject(projectId);
                return createSuccessResult({ message: `Deleted project ${projectId}` });
            } catch (error) {
                return handleToolError(error, `Failed to delete project ${projectId}`);
            }
        }
    });

    // ===== SUITE TOOLS =====

    const getSuiteTool = vscode.lm.registerTool('getTestRailSuite', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ suiteId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { suiteId } = options.input;
            try {
                const suite = await helper.getSuite(suiteId);
                const formatted = formatSuite(suite);
                return createSuccessResult({ suite, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to get suite ${suiteId}`);
            }
        }
    });

    const getSuitesTool = vscode.lm.registerTool('getTestRailSuites', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ projectId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { projectId } = options.input;
            try {
                const suitesResp = await helper.getSuites(projectId);
                const suites = suitesResp.suites || [];
                const summary = formatSuitesSummary(suites);
                return createSuccessResult({ suites, count: suites.length, summary });
            } catch (error) {
                return handleToolError(error, `Failed to get suites for project ${projectId}`);
            }
        }
    });

    const addSuiteTool = vscode.lm.registerTool('addTestRailSuite', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            projectId: number;
            name: string;
            description?: string;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { projectId, name, description } = options.input;
            try {
                const data: any = { name };
                if (description !== undefined) data.description = description;

                const suite = await helper.addSuite(projectId, data);
                const formatted = formatSuite(suite);
                return createSuccessResult({ message: `Created suite ${suite.name}`, suite, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to create suite in project ${projectId}`);
            }
        }
    });

    const updateSuiteTool = vscode.lm.registerTool('updateTestRailSuite', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            suiteId: number;
            name?: string;
            description?: string;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { suiteId, name, description } = options.input;
            try {
                const data: any = {};
                if (name !== undefined) data.name = name;
                if (description !== undefined) data.description = description;

                const suite = await helper.updateSuite(suiteId, data);
                return createSuccessResult({ message: `Updated suite ${suiteId}`, suite });
            } catch (error) {
                return handleToolError(error, `Failed to update suite ${suiteId}`);
            }
        }
    });

    const deleteSuiteTool = vscode.lm.registerTool('deleteTestRailSuite', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ suiteId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { suiteId } = options.input;
            try {
                await helper.deleteSuite(suiteId);
                return createSuccessResult({ message: `Deleted suite ${suiteId}` });
            } catch (error) {
                return handleToolError(error, `Failed to delete suite ${suiteId}`);
            }
        }
    });

    // ===== SECTION TOOLS =====

    const getSectionTool = vscode.lm.registerTool('getTestRailSection', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ sectionId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { sectionId } = options.input;
            try {
                const section = await helper.getSection(sectionId);
                const formatted = formatSection(section);
                return createSuccessResult({ section, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to get section ${sectionId}`);
            }
        }
    });

    const getSectionsTool = vscode.lm.registerTool('getTestRailSections', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            projectId: number;
            suiteId?: number;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { projectId, suiteId } = options.input;
            try {
                const sectionsResp = await helper.getSections(projectId, suiteId);
                const sections = sectionsResp.sections || [];
                const summary = formatSectionsSummary(sections);
                return createSuccessResult({ sections, count: sections.length, summary });
            } catch (error) {
                return handleToolError(error, `Failed to get sections for project ${projectId}`);
            }
        }
    });

    const addSectionTool = vscode.lm.registerTool('addTestRailSection', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            projectId: number;
            name: string;
            description?: string;
            suiteId?: number;
            parentId?: number;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { projectId, name, description, suiteId, parentId } = options.input;
            try {
                const data: any = { name };
                if (description !== undefined) data.description = description;
                if (suiteId !== undefined) data.suite_id = suiteId;
                if (parentId !== undefined) data.parent_id = parentId;

                const section = await helper.addSection(projectId, data);
                const formatted = formatSection(section);
                return createSuccessResult({ message: `Created section ${section.name}`, section, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to create section in project ${projectId}`);
            }
        }
    });

    const updateSectionTool = vscode.lm.registerTool('updateTestRailSection', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            sectionId: number;
            name?: string;
            description?: string;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { sectionId, name, description } = options.input;
            try {
                const data: any = {};
                if (name !== undefined) data.name = name;
                if (description !== undefined) data.description = description;

                const section = await helper.updateSection(sectionId, data);
                return createSuccessResult({ message: `Updated section ${sectionId}`, section });
            } catch (error) {
                return handleToolError(error, `Failed to update section ${sectionId}`);
            }
        }
    });

    const deleteSectionTool = vscode.lm.registerTool('deleteTestRailSection', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ sectionId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { sectionId } = options.input;
            try {
                await helper.deleteSection(sectionId);
                return createSuccessResult({ message: `Deleted section ${sectionId}` });
            } catch (error) {
                return handleToolError(error, `Failed to delete section ${sectionId}`);
            }
        }
    });

    // ===== CASE TOOLS =====

    const getCaseTool = vscode.lm.registerTool('getTestRailCase', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ caseId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { caseId } = options.input;
            try {
                const testCase = await helper.getCase(caseId);
                const formatted = formatCase(testCase);
                return createSuccessResult({ case: testCase, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to get case ${caseId}`);
            }
        }
    });

    const getCasesTool = vscode.lm.registerTool('getTestRailCases', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            projectId: number;
            suiteId?: number;
            sectionId?: number;
            limit?: number;
            offset?: number;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { projectId, suiteId, sectionId, limit, offset } = options.input;
            try {
                const casesResp = await helper.getCases(projectId, {
                    suite_id: suiteId,
                    section_id: sectionId,
                    limit,
                    offset
                });
                const cases = casesResp.cases || [];
                const summary = formatCasesSummary(cases);
                return createSuccessResult({ cases, count: cases.length, summary });
            } catch (error) {
                return handleToolError(error, `Failed to get cases for project ${projectId}`);
            }
        }
    });

    const addCaseTool = vscode.lm.registerTool('addTestRailCase', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            sectionId: number;
            title: string;
            priorityId?: number;
            estimate?: string;
            refs?: string;
            customFields?: any;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { sectionId, title, priorityId, estimate, refs, customFields } = options.input;
            try {
                const data: any = { title };
                if (priorityId !== undefined) data.priority_id = priorityId;
                if (estimate !== undefined) data.estimate = estimate;
                if (refs !== undefined) data.refs = refs;
                if (customFields) {
                    Object.assign(data, customFields);
                }

                const testCase = await helper.addCase(sectionId, data);
                const formatted = formatCase(testCase);
                return createSuccessResult({ message: `Created case ${testCase.title}`, case: testCase, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to create case in section ${sectionId}`);
            }
        }
    });

    const updateCaseTool = vscode.lm.registerTool('updateTestRailCase', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            caseId: number;
            title?: string;
            priorityId?: number;
            estimate?: string;
            refs?: string;
            customFields?: any;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { caseId, title, priorityId, estimate, refs, customFields } = options.input;
            try {
                const data: any = {};
                if (title !== undefined) data.title = title;
                if (priorityId !== undefined) data.priority_id = priorityId;
                if (estimate !== undefined) data.estimate = estimate;
                if (refs !== undefined) data.refs = refs;
                if (customFields) {
                    Object.assign(data, customFields);
                }

                const testCase = await helper.updateCase(caseId, data);
                return createSuccessResult({ message: `Updated case ${caseId}`, case: testCase });
            } catch (error) {
                return handleToolError(error, `Failed to update case ${caseId}`);
            }
        }
    });

    const deleteCaseTool = vscode.lm.registerTool('deleteTestRailCase', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ caseId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { caseId } = options.input;
            try {
                await helper.deleteCase(caseId);
                return createSuccessResult({ message: `Deleted case ${caseId}` });
            } catch (error) {
                return handleToolError(error, `Failed to delete case ${caseId}`);
            }
        }
    });

    // ===== GROUP TOOLS =====

    const getGroupTool = vscode.lm.registerTool('getTestRailGroup', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ groupId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { groupId } = options.input;
            try {
                const group = await helper.getGroup(groupId);
                const formatted = formatGroup(group);
                return createSuccessResult({ group, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to get group ${groupId}`);
            }
        }
    });

    const getGroupsTool = vscode.lm.registerTool('getTestRailGroups', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<Record<string, never>>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            try {
                const groupsResp = await helper.getGroups();
                const groups = groupsResp.groups || [];
                const summary = formatGroupsSummary(groups);
                return createSuccessResult({ groups, count: groups.length, summary });
            } catch (error) {
                return handleToolError(error, 'Failed to get groups');
            }
        }
    });

    const addGroupTool = vscode.lm.registerTool('addTestRailGroup', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ name: string }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { name } = options.input;
            try {
                const group = await helper.addGroup({ name });
                const formatted = formatGroup(group);
                return createSuccessResult({ message: `Created group ${group.name}`, group, formatted });
            } catch (error) {
                return handleToolError(error, 'Failed to create group');
            }
        }
    });

    const updateGroupTool = vscode.lm.registerTool('updateTestRailGroup', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{
            groupId: number;
            name: string;
        }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { groupId, name } = options.input;
            try {
                const group = await helper.updateGroup(groupId, { name });
                return createSuccessResult({ message: `Updated group ${groupId}`, group });
            } catch (error) {
                return handleToolError(error, `Failed to update group ${groupId}`);
            }
        }
    });

    const deleteGroupTool = vscode.lm.registerTool('deleteTestRailGroup', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ groupId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { groupId } = options.input;
            try {
                await helper.deleteGroup(groupId);
                return createSuccessResult({ message: `Deleted group ${groupId}` });
            } catch (error) {
                return handleToolError(error, `Failed to delete group ${groupId}`);
            }
        }
    });

    // ===== USER TOOLS =====

    const getUserTool = vscode.lm.registerTool('getTestRailUser', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ userId: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { userId } = options.input;
            try {
                const user = await helper.getUser(userId);
                const formatted = formatUser(user);
                return createSuccessResult({ user, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to get user ${userId}`);
            }
        }
    });

    const getUserByEmailTool = vscode.lm.registerTool('getTestRailUserByEmail', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ email: string }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { email } = options.input;
            try {
                const user = await helper.getUserByEmail(email);
                const formatted = formatUser(user);
                return createSuccessResult({ user, formatted });
            } catch (error) {
                return handleToolError(error, `Failed to get user by email ${email}`);
            }
        }
    });

    const getUsersTool = vscode.lm.registerTool('getTestRailUsers', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<{ projectId?: number }>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            const { projectId } = options.input;
            try {
                const users = await helper.getUsers(projectId);
                const summary = formatUsersSummary(users);
                return createSuccessResult({ users, count: users.length, summary });
            } catch (error) {
                return handleToolError(error, 'Failed to get users');
            }
        }
    });

    // ===== PRIORITY TOOLS =====

    const getPrioritiesTool = vscode.lm.registerTool('getTestRailPriorities', {
        async invoke(options: vscode.LanguageModelToolInvocationOptions<Record<string, never>>, _token: vscode.CancellationToken) {
            if (!helper) {
                return handleToolError(new Error('TestRail is not configured'));
            }

            try {
                const priorities = await helper.getPriorities();
                const formatted = priorities.map((p: any) => formatPriority(p)).join('\n');
                return createSuccessResult({ priorities, count: priorities.length, formatted });
            } catch (error) {
                return handleToolError(error, 'Failed to get priorities');
            }
        }
    });

    // Register all tools
    context.subscriptions.push(
        getProjectTool,
        getProjectsTool,
        addProjectTool,
        updateProjectTool,
        deleteProjectTool,
        getSuiteTool,
        getSuitesTool,
        addSuiteTool,
        updateSuiteTool,
        deleteSuiteTool,
        getSectionTool,
        getSectionsTool,
        addSectionTool,
        updateSectionTool,
        deleteSectionTool,
        getCaseTool,
        getCasesTool,
        addCaseTool,
        updateCaseTool,
        deleteCaseTool,
        getGroupTool,
        getGroupsTool,
        addGroupTool,
        updateGroupTool,
        deleteGroupTool,
        getUserTool,
        getUserByEmailTool,
        getUsersTool,
        getPrioritiesTool
    );
}
