// ===== COMMON PAGINATION TYPES =====

export interface TestRailLink {
    next: string | null;
    prev: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface TestRailPaginatedResponse<T> {
    offset: number;
    limit: number;
    size: number;
    _links: TestRailLink;
}

// ===== PROJECT TYPES =====

export interface TestRailProject {
    id: number;
    announcement: string | null;
    completed_on: number | null;
    default_role_id: number;
    default_role: string;
    is_completed: boolean;
    name: string;
    show_announcement: boolean;
    suite_mode: number;
    url: string;
}

export interface TestRailProjectsResponse extends TestRailPaginatedResponse<TestRailProject> {
    projects: TestRailProject[];
}

// ===== SUITE TYPES =====

export interface TestRailSuite {
    id: number;
    name: string;
    description: string | null;
    project_id: number;
    is_master: boolean;
    is_baseline: boolean;
    is_completed: boolean;
    completed_on: number | null;
    url: string;
}

export interface TestRailSuitesResponse extends TestRailPaginatedResponse<TestRailSuite> {
    suites: TestRailSuite[];
}

// ===== SECTION TYPES =====

export interface TestRailSection {
    id: number;
    suite_id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    display_order: number;
    depth: number;
}

export interface TestRailSectionsResponse extends TestRailPaginatedResponse<TestRailSection> {
    sections: TestRailSection[];
}

// ===== CASE TYPES =====

export interface TestRailCase {
    id: number;
    title: string;
    section_id: number;
    template_id: number;
    type_id: number;
    priority_id: number;
    milestone_id: number | null;
    refs: string | null;
    created_by: number;
    created_on: number;
    updated_by: number;
    updated_on: number;
    estimate: string | null;
    estimate_forecast: string | null;
    suite_id: number;
    display_order: number;
    is_deleted: number;
    [key: string]: any; // For custom fields
}

export interface TestRailCasesResponse extends TestRailPaginatedResponse<TestRailCase> {
    cases: TestRailCase[];
}

// ===== GROUP TYPES =====

export interface TestRailGroup {
    id: number;
    name: string;
    user_ids?: number[];
    user_count?: number;
}

export interface TestRailGroupsResponse extends TestRailPaginatedResponse<TestRailGroup> {
    groups: TestRailGroup[];
}

// ===== USER TYPES =====

export interface TestRailUser {
    id: number;
    email: string;
    name: string;
    is_active: boolean;
    role_id?: number;
    role?: string;
    email_notifications?: boolean;
    is_admin?: boolean;
    group_ids?: number[];
    mfa_required?: boolean;
    sso_enabled?: boolean;
    assigned_projects?: number[];
    global_role_id?: number | null;
    global_role?: string | null;
    project_role_id?: number | null;
    project_role?: string | null;
}

export interface TestRailUsersResponse extends TestRailPaginatedResponse<TestRailUser> {
    users: TestRailUser[];
}

// ===== PRIORITY TYPES =====

export interface TestRailPriority {
    id: number;
    is_default: boolean;
    name: string;
    priority: number;
    short_name: string;
}

// Note: Priorities API doesn't support pagination, returns array directly
