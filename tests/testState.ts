/**
 * Test State Management
 * 
 * Persists test data IDs between separate test commands.
 * This allows running write tests, manually checking TestRail,
 * then running delete tests separately.
 * 
 * @module testState
 */

import * as fs from 'fs';
import * as path from 'path';
import { TEST_STATE_FILE } from './constants';

export interface TestDataIds {
    testProjectId?: number;
    testSuiteId?: number;
    testSectionId?: number;
    testCaseId?: number;
    testGroupId?: number;
    createdAt?: string;
}

const stateFilePath = path.join(process.cwd(), TEST_STATE_FILE);

/**
 * Save test data IDs to a file for later cleanup
 */
export function saveTestState(data: TestDataIds): void {
    const state: TestDataIds = {
        ...data,
        createdAt: new Date().toISOString()
    };
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
    console.log(`💾 Test state saved to ${TEST_STATE_FILE}`);
}

/**
 * Load test data IDs from file
 */
export function loadTestState(): TestDataIds | null {
    try {
        if (fs.existsSync(stateFilePath)) {
            const content = fs.readFileSync(stateFilePath, 'utf8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('Warning: Could not load test state:', error);
    }
    return null;
}

/**
 * Clear the test state file after cleanup
 */
export function clearTestState(): void {
    try {
        if (fs.existsSync(stateFilePath)) {
            fs.unlinkSync(stateFilePath);
            console.log(`🗑️  Test state file ${TEST_STATE_FILE} removed`);
        }
    } catch (error) {
        console.error('Warning: Could not clear test state:', error);
    }
}

/**
 * Check if test state exists
 */
export function hasTestState(): boolean {
    return fs.existsSync(stateFilePath);
}

/**
 * Print current test state for debugging
 */
export function printTestState(): void {
    const state = loadTestState();
    if (state) {
        console.log('\n📋 Current Test State:');
        if (state.testProjectId) console.log(`   Project ID: ${state.testProjectId}`);
        if (state.testSuiteId) console.log(`   Suite ID: ${state.testSuiteId}`);
        if (state.testSectionId) console.log(`   Section ID: ${state.testSectionId}`);
        if (state.testCaseId) console.log(`   Case ID: ${state.testCaseId}`);
        if (state.testGroupId) console.log(`   Group ID: ${state.testGroupId}`);
        if (state.createdAt) console.log(`   Created At: ${state.createdAt}`);
        console.log();
    } else {
        console.log('\n📋 No test state found. Run write tests first.\n');
    }
}
