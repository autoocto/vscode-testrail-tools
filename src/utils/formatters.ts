/**
 * Format a TestRail project for display
 */
export function formatProject(project: any): string {
    return `Project: ${project.name} (ID: ${project.id})
URL: ${project.url || 'N/A'}
Announcement: ${project.announcement || 'None'}
Suite Mode: ${project.suite_mode === 1 ? 'Single' : project.suite_mode === 2 ? 'Single with Baselines' : 'Multiple'}
Completed: ${project.is_completed ? 'Yes' : 'No'}`;
}

/**
 * Format a TestRail suite for display
 */
export function formatSuite(suite: any): string {
    return `Suite: ${suite.name} (ID: ${suite.id})
Description: ${suite.description || 'None'}
Project ID: ${suite.project_id}
URL: ${suite.url || 'N/A'}`;
}

/**
 * Format a TestRail section for display
 */
export function formatSection(section: any): string {
    return `Section: ${section.name} (ID: ${section.id})
Description: ${section.description || 'None'}
Suite ID: ${section.suite_id}
Parent ID: ${section.parent_id || 'None'}
Depth: ${section.depth}`;
}

/**
 * Format a TestRail test case for display
 */
export function formatCase(testCase: any): string {
    return `Case: ${testCase.title} (ID: ${testCase.id})
Priority: ${testCase.priority_id}
Type: ${testCase.type_id}
Section ID: ${testCase.section_id}
Estimate: ${testCase.estimate || 'None'}
References: ${testCase.refs || 'None'}
Created: ${testCase.created_on ? new Date(testCase.created_on * 1000).toLocaleString() : 'N/A'}
Updated: ${testCase.updated_on ? new Date(testCase.updated_on * 1000).toLocaleString() : 'N/A'}`;
}

/**
 * Format a TestRail user for display
 */
export function formatUser(user: any): string {
    return `User: ${user.name} (ID: ${user.id})
Email: ${user.email}
Role: ${user.role || 'N/A'}
Active: ${user.is_active ? 'Yes' : 'No'}`;
}

/**
 * Format a TestRail group for display
 */
export function formatGroup(group: any): string {
    return `Group: ${group.name} (ID: ${group.id})
User Count: ${group.user_count || 0}`;
}

/**
 * Format a TestRail priority for display
 */
export function formatPriority(priority: any): string {
    return `${priority.name} (ID: ${priority.id}, Priority: ${priority.priority})`;
}

/**
 * Format a list of projects summary
 */
export function formatProjectsSummary(projects: any[]): string {
    if (!projects || projects.length === 0) {
        return 'No projects found';
    }
    return projects.map(p => `- ${p.name} (ID: ${p.id})`).join('\n');
}

/**
 * Format a list of suites summary
 */
export function formatSuitesSummary(suites: any[]): string {
    if (!suites || suites.length === 0) {
        return 'No suites found';
    }
    return suites.map(s => `- ${s.name} (ID: ${s.id})`).join('\n');
}

/**
 * Format a list of sections summary
 */
export function formatSectionsSummary(sections: any[]): string {
    if (!sections || sections.length === 0) {
        return 'No sections found';
    }
    return sections.map(s => `- ${s.name} (ID: ${s.id})`).join('\n');
}

/**
 * Format a list of cases summary
 */
export function formatCasesSummary(cases: any[]): string {
    if (!cases || cases.length === 0) {
        return 'No cases found';
    }
    return cases.map(c => `- C${c.id}: ${c.title}`).join('\n');
}

/**
 * Format a list of users summary
 */
export function formatUsersSummary(users: any[]): string {
    if (!users || users.length === 0) {
        return 'No users found';
    }
    return users.map(u => `- ${u.name} (${u.email})`).join('\n');
}

/**
 * Format a list of groups summary
 */
export function formatGroupsSummary(groups: any[]): string {
    if (!groups || groups.length === 0) {
        return 'No groups found';
    }
    return groups.map(g => `- ${g.name} (ID: ${g.id})`).join('\n');
}
