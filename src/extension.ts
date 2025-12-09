import * as vscode from 'vscode';
import { TestRailHelper } from './helpers/testrailHelper';
import { loadTestRailConfig, validateTestRailConfig } from './utils/configLoader';
import { registerTestRailTools } from './tools/testrailTools';

export function activate(context: vscode.ExtensionContext) {
    console.log('TestRail Tools extension is now active');

    const config = loadTestRailConfig();

    const testrailHelper = config && validateTestRailConfig(config) 
        ? new TestRailHelper(config)
        : null;

    if (!testrailHelper) {
        console.warn('TestRail Tools: Configuration not found or invalid. Please configure TestRail settings.');
    }

    registerTestRailTools(context, testrailHelper);
    
    console.log('TestRail Tools: All tools registered successfully');
}

export function deactivate() {}
