import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { TestRailConfig } from '../utils/configLoader';

export class TestRailHelper {
    private config: TestRailConfig;

    constructor(config: TestRailConfig) {
        this.config = config;
    }

    /**
     * Make an authenticated request to TestRail REST API
     */
    private async request<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
        const url = new URL(endpoint, this.config.baseUrl);
        const auth = Buffer.from(`${this.config.email}:${this.config.apiKey}`).toString('base64');

        return new Promise((resolve, reject) => {
            const protocol = url.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            const req = protocol.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsed = data ? JSON.parse(data) : {};
                            resolve(parsed);
                        } catch (e) {
                            resolve(data as any);
                        }
                    } else {
                        reject(new Error(`TestRail API error: ${res.statusCode} - ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (body) {
                req.write(JSON.stringify(body));
            }

            req.end();
        });
    }

    // ===== PROJECT METHODS =====

    /**
     * Get a specific project by ID
     */
    async getProject(projectId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/get_project/${projectId}`);
    }

    /**
     * Get all projects
     */
    async getProjects(isCompleted?: number): Promise<any[]> {
        const params = isCompleted !== undefined ? `&is_completed=${isCompleted}` : '';
        const response = await this.request<any>(`/index.php?/api/v2/get_projects${params}`);
        // TestRail API returns an object with 'projects' property for get_projects
        // but returns an array directly for get_projects with offset/limit
        // Handle both cases
        if (Array.isArray(response)) {
            return response;
        }
        if (response && response.projects && Array.isArray(response.projects)) {
            return response.projects;
        }
        return [];
    }

    /**
     * Add a new project
     */
    async addProject(data: {
        name: string;
        announcement?: string;
        show_announcement?: boolean;
        suite_mode?: number;
    }): Promise<any> {
        return this.request('/index.php?/api/v2/add_project', 'POST', data);
    }

    /**
     * Update a project
     */
    async updateProject(projectId: number, data: {
        name?: string;
        announcement?: string;
        show_announcement?: boolean;
        is_completed?: boolean;
    }): Promise<any> {
        return this.request(`/index.php?/api/v2/update_project/${projectId}`, 'POST', data);
    }

    /**
     * Delete a project
     */
    async deleteProject(projectId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/delete_project/${projectId}`, 'POST');
    }

    // ===== SUITE METHODS =====

    /**
     * Get a specific suite by ID
     */
    async getSuite(suiteId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/get_suite/${suiteId}`);
    }

    /**
     * Get all suites for a project
     */
    async getSuites(projectId: number): Promise<any[]> {
        const response = await this.request<any>(`/index.php?/api/v2/get_suites/${projectId}`);
        if (Array.isArray(response)) {
            return response;
        }
        return [];
    }

    /**
     * Add a new suite
     */
    async addSuite(projectId: number, data: {
        name: string;
        description?: string;
    }): Promise<any> {
        return this.request(`/index.php?/api/v2/add_suite/${projectId}`, 'POST', data);
    }

    /**
     * Update a suite
     */
    async updateSuite(suiteId: number, data: {
        name?: string;
        description?: string;
    }): Promise<any> {
        return this.request(`/index.php?/api/v2/update_suite/${suiteId}`, 'POST', data);
    }

    /**
     * Delete a suite
     */
    async deleteSuite(suiteId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/delete_suite/${suiteId}`, 'POST');
    }

    // ===== SECTION METHODS =====

    /**
     * Get a specific section by ID
     */
    async getSection(sectionId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/get_section/${sectionId}`);
    }

    /**
     * Get all sections for a project/suite
     */
    async getSections(projectId: number, suiteId?: number): Promise<any[]> {
        const params = suiteId ? `&suite_id=${suiteId}` : '';
        const response = await this.request<any>(`/index.php?/api/v2/get_sections/${projectId}${params}`);
        if (Array.isArray(response)) {
            return response;
        }
        if (response && response.sections && Array.isArray(response.sections)) {
            return response.sections;
        }
        return [];
    }

    /**
     * Add a new section
     */
    async addSection(projectId: number, data: {
        name: string;
        description?: string;
        suite_id?: number;
        parent_id?: number;
    }): Promise<any> {
        return this.request(`/index.php?/api/v2/add_section/${projectId}`, 'POST', data);
    }

    /**
     * Update a section
     */
    async updateSection(sectionId: number, data: {
        name?: string;
        description?: string;
    }): Promise<any> {
        return this.request(`/index.php?/api/v2/update_section/${sectionId}`, 'POST', data);
    }

    /**
     * Delete a section
     */
    async deleteSection(sectionId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/delete_section/${sectionId}`, 'POST');
    }

    // ===== CASE METHODS =====

    /**
     * Get a specific test case by ID
     */
    async getCase(caseId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/get_case/${caseId}`);
    }

    /**
     * Get all test cases for a project/suite
     */
    async getCases(projectId: number, options?: {
        suite_id?: number;
        section_id?: number;
        limit?: number;
        offset?: number;
    }): Promise<any[]> {
        const params = new URLSearchParams();
        if (options?.suite_id) params.append('suite_id', options.suite_id.toString());
        if (options?.section_id) params.append('section_id', options.section_id.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        
        const queryString = params.toString();
        const response = await this.request<any>(`/index.php?/api/v2/get_cases/${projectId}${queryString ? '&' + queryString : ''}`);
        if (Array.isArray(response)) {
            return response;
        }
        if (response && response.cases && Array.isArray(response.cases)) {
            return response.cases;
        }
        return [];
    }

    /**
     * Add a new test case
     */
    async addCase(sectionId: number, data: {
        title: string;
        priority_id?: number;
        estimate?: string;
        refs?: string;
        [key: string]: any; // For custom fields
    }): Promise<any> {
        return this.request(`/index.php?/api/v2/add_case/${sectionId}`, 'POST', data);
    }

    /**
     * Update a test case
     */
    async updateCase(caseId: number, data: {
        title?: string;
        priority_id?: number;
        estimate?: string;
        refs?: string;
        [key: string]: any; // For custom fields
    }): Promise<any> {
        return this.request(`/index.php?/api/v2/update_case/${caseId}`, 'POST', data);
    }

    /**
     * Delete a test case
     */
    async deleteCase(caseId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/delete_case/${caseId}`, 'POST');
    }

    // ===== GROUP METHODS =====

    /**
     * Get a specific group by ID
     */
    async getGroup(groupId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/get_group/${groupId}`);
    }

    /**
     * Get all groups
     */
    async getGroups(): Promise<any[]> {
        const response = await this.request<any>('/index.php?/api/v2/get_groups');
        if (Array.isArray(response)) {
            return response;
        }
        return [];
    }

    /**
     * Add a new group
     */
    async addGroup(data: {
        name: string;
    }): Promise<any> {
        return this.request('/index.php?/api/v2/add_group', 'POST', data);
    }

    /**
     * Update a group
     */
    async updateGroup(groupId: number, data: {
        name: string;
    }): Promise<any> {
        return this.request(`/index.php?/api/v2/update_group/${groupId}`, 'POST', data);
    }

    /**
     * Delete a group
     */
    async deleteGroup(groupId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/delete_group/${groupId}`, 'POST');
    }

    // ===== USER METHODS =====

    /**
     * Get a specific user by ID
     */
    async getUser(userId: number): Promise<any> {
        return this.request(`/index.php?/api/v2/get_user/${userId}`);
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<any> {
        return this.request(`/index.php?/api/v2/get_user_by_email&email=${encodeURIComponent(email)}`);
    }

    /**
     * Get all users
     */
    async getUsers(projectId?: number): Promise<any[]> {
        const params = projectId ? `&project_id=${projectId}` : '';
        const response = await this.request<any>(`/index.php?/api/v2/get_users${params}`);
        if (Array.isArray(response)) {
            return response;
        }
        if (response && response.users && Array.isArray(response.users)) {
            return response.users;
        }
        return [];
    }

    // ===== PRIORITY METHODS =====

    /**
     * Get all priorities
     */
    async getPriorities(): Promise<any[]> {
        const response = await this.request<any>('/index.php?/api/v2/get_priorities');
        if (Array.isArray(response)) {
            return response;
        }
        return [];
    }
}
