import { TestRailCase, TestRailProject, TestRailSuite, TestRailSection } from '../helpers/testrailTypes';

export interface ActiveEditorState {
    type: 'project' | 'suite' | 'section' | 'case';
    id: number;
    data: TestRailProject | TestRailSuite | TestRailSection | TestRailCase;
    panelTitle: string;
}

export class EditorStateManager {
    private static instance: EditorStateManager;
    private activeEditor: ActiveEditorState | null = null;

    private constructor() {}

    static getInstance(): EditorStateManager {
        if (!EditorStateManager.instance) {
            EditorStateManager.instance = new EditorStateManager();
        }
        return EditorStateManager.instance;
    }

    setActiveEditor(state: ActiveEditorState | null): void {
        this.activeEditor = state;
    }

    getActiveEditor(): ActiveEditorState | null {
        return this.activeEditor;
    }

    clearActiveEditor(): void {
        this.activeEditor = null;
    }
}
