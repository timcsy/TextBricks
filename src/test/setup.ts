// Jest setup file for VSCode extension testing
// This file runs before each test file

// Mock VSCode API
jest.mock('vscode', () => ({
  TreeItem: class MockTreeItem {
    public label: any;
    public collapsibleState: any;
    constructor(label: any, collapsibleState: any) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  ThemeIcon: class MockThemeIcon {
    constructor(public id: string) {}
  },
  EventEmitter: class MockEventEmitter {
    public event: any;
    public fire: any;
    constructor() {
      this.event = jest.fn();
      this.fire = jest.fn();
    }
  },
  commands: {
    registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
    executeCommand: jest.fn()
  },
  window: {
    registerTreeDataProvider: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    activeTextEditor: undefined
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn()
    }))
  },
  env: {
    clipboard: {
      writeText: jest.fn()
    }
  },
  Range: class MockRange {},
  Position: class MockPosition {},
  Selection: class MockSelection {}
}), { virtual: true });