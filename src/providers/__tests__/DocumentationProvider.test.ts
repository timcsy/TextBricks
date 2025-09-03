import * as vscode from 'vscode';
import { DocumentationProvider } from '../DocumentationProvider';
import { TemplateManager } from '../../services/TemplateManager';
import { DocumentationService } from '../../services/DocumentationService';

// Mock vscode module
jest.mock('vscode', () => {
  const mockEditor = {
    document: {
      lineAt: jest.fn(),
      lineCount: 1
    },
    selection: {
      active: { line: 0, character: 0 }
    },
    options: {
      insertSpaces: true,
      tabSize: 4
    },
    edit: jest.fn()
  };

  return {
  window: {
    activeTextEditor: mockEditor,
    createWebviewPanel: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn()
  },
  ViewColumn: {
    Beside: 2
  },
  Uri: {
    joinPath: jest.fn(),
    parse: jest.fn()
  },
  Position: jest.fn().mockImplementation((line, character) => ({ line, character })),
  workspace: {
    openTextDocument: jest.fn(),
    onDidSaveTextDocument: jest.fn()
  },
  env: {
    clipboard: {
      writeText: jest.fn()
    },
    openExternal: jest.fn()
  }
  };
});

describe('DocumentationProvider', () => {
  let documentationProvider: DocumentationProvider;
  let templateManager: TemplateManager;
  let documentationService: DocumentationService;
  let mockExtensionUri: vscode.Uri;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create instances
    templateManager = new TemplateManager();
    mockExtensionUri = {} as vscode.Uri;
    documentationService = new DocumentationService(mockExtensionUri);
    
    documentationProvider = new DocumentationProvider(
      mockExtensionUri,
      templateManager,
      documentationService
    );
  });

  describe('目標縮排計算測試 (_getCurrentIndentation)', () => {
    it('應該在空行開頭返回空字符串', () => {
      // Mock empty line at position 0
      const mockLine = {
        text: '',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
      };
      
      mockEditor.selection.active = { line: 0, character: 0 };
      mockEditor.document.lineAt = jest.fn().mockReturnValue(mockLine);
      
      // Access private method for testing
      const result = (documentationProvider as any)._getCurrentIndentation();
      
      expect(result).toBe('');
    });

    it('應該返回當前行的縮排', () => {
      // Mock line with indentation
      const mockLine = {
        text: '  console.log("test");',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 21 } }
      };
      
      mockEditor.selection.active = { line: 0, character: 5 };
      mockEditor.document.lineAt = jest.fn().mockReturnValue(mockLine);
      
      const result = (documentationProvider as any)._getCurrentIndentation();
      
      expect(result).toBe('  '); // 2 spaces
    });

    it('應該在非空行開頭返回行縮排', () => {
      // Mock line with indentation at position 0
      const mockLine = {
        text: '    function test() {',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 18 } }
      };
      
      mockEditor.selection.active = { line: 0, character: 0 };
      mockEditor.document.lineAt = jest.fn().mockReturnValue(mockLine);
      
      const result = (documentationProvider as any)._getCurrentIndentation();
      
      expect(result).toBe('    '); // 4 spaces
    });

    it('應該fallback到編輯器配置（使用空格）', () => {
      // Mock empty line but not at character 0
      const mockLine = {
        text: '',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
      };
      
      mockEditor.selection.active = { line: 0, character: 2 }; // Not at column 0
      mockEditor.document.lineAt = jest.fn().mockReturnValue(mockLine);
      mockEditor.options = { insertSpaces: true, tabSize: 4 };
      
      const result = (documentationProvider as any)._getCurrentIndentation();
      
      expect(result).toBe('    '); // 4 spaces from tabSize
    });

    it('應該fallback到編輯器配置（使用tab）', () => {
      // Mock empty line but not at character 0
      const mockLine = {
        text: '',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
      };
      
      mockEditor.selection.active = { line: 0, character: 2 }; // Not at column 0
      mockEditor.document.lineAt = jest.fn().mockReturnValue(mockLine);
      mockEditor.options = { insertSpaces: false, tabSize: 4 };
      
      const result = (documentationProvider as any)._getCurrentIndentation();
      
      expect(result).toBe('\t'); // tab
    });

    it('應該處理沒有編輯器的情況', () => {
      // Mock no active editor
      (vscode.window as any).activeTextEditor = null;
      
      const result = (documentationProvider as any)._getCurrentIndentation();
      
      expect(result).toBe('    '); // Default 4 spaces
    });
  });

  describe('代碼片段插入邏輯測試', () => {
    beforeEach(() => {
      // Restore active editor for insertion tests
      (vscode.window as any).activeTextEditor = mockEditor;
      
      // Mock template
      const sampleTemplate = {
        id: 'test-template',
        title: 'Test Template',
        categoryId: 'test-category',
        language: 'c',
        code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
        description: 'Test template'
      };
      
      jest.spyOn(templateManager, 'getTemplateById').mockReturnValue(sampleTemplate);
      jest.spyOn(templateManager, 'formatCodeSnippetUnified').mockImplementation(
        (code, template, targetIndentation) => {
          if (targetIndentation === '') {
            return code.split('\n').map(line => line.trim()).join('\n');
          }
          const lines = code.split('\n');
          return lines.map((line, i) => 
            i === 0 ? line.trim() : targetIndentation + line.trim()
          ).join('\n');
        }
      );
    });

    it('應該正確處理空行開頭的插入', async () => {
      // Mock empty line at position 0
      const mockLine = {
        text: '',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
      };
      
      mockEditor.selection.active = { line: 0, character: 0 };
      mockEditor.document.lineAt = jest.fn().mockReturnValue(mockLine);
      mockEditor.edit = jest.fn().mockImplementation((callback) => {
        const editBuilder = {
          insert: jest.fn()
        };
        callback(editBuilder);
        return Promise.resolve(true);
      });
      
      // Test the insertion
      await (documentationProvider as any)._insertCodeSnippet(
        'printf("Hello, World!\\n");\nreturn 0;',
        'test-template'
      );
      
      // Verify formatCodeSnippetUnified was called with empty target indentation
      expect(templateManager.formatCodeSnippetUnified).toHaveBeenCalledWith(
        'printf("Hello, World!\\n");\nreturn 0;',
        expect.anything(),
        ''
      );
    });

    it('應該正確處理有縮排位置的插入', async () => {
      // Mock line with indentation
      const mockLine = {
        text: '  if (condition) {',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 17 } }
      };
      
      mockEditor.selection.active = { line: 0, character: 10 };
      mockEditor.document.lineAt = jest.fn().mockReturnValue(mockLine);
      mockEditor.edit = jest.fn().mockImplementation((callback) => {
        const editBuilder = {
          insert: jest.fn()
        };
        callback(editBuilder);
        return Promise.resolve(true);
      });
      
      // Test the insertion
      await (documentationProvider as any)._insertCodeSnippet(
        'printf("Hello, World!\\n");\nreturn 0;',
        'test-template'
      );
      
      // Verify formatCodeSnippetUnified was called with correct target indentation
      expect(templateManager.formatCodeSnippetUnified).toHaveBeenCalledWith(
        'printf("Hello, World!\\n");\nreturn 0;',
        expect.anything(),
        '  '  // 2 spaces from line indentation
      );
    });
  });

  describe('複製邏輯測試', () => {
    beforeEach(() => {
      // Mock template
      const sampleTemplate = {
        id: 'test-template',
        title: 'Test Template', 
        categoryId: 'test-category',
        language: 'c',
        code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
        description: 'Test template'
      };
      
      jest.spyOn(templateManager, 'getTemplateById').mockReturnValue(sampleTemplate);
      jest.spyOn(templateManager, 'formatCodeSnippetUnified').mockReturnValue('formatted code');
    });

    it('應該使用統一的格式化方法', async () => {
      // Mock current indentation
      const mockLine = {
        text: '    // comment',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 13 } }
      };
      
      mockEditor.selection.active = { line: 0, character: 8 };
      mockEditor.document.lineAt = jest.fn().mockReturnValue(mockLine);
      
      await (documentationProvider as any)._copyCodeSnippet(
        'printf("test");',
        'test-template'
      );
      
      // Verify the unified method was called
      expect(templateManager.formatCodeSnippetUnified).toHaveBeenCalledWith(
        'printf("test");',
        expect.anything(),
        '    '  // 4 spaces from line indentation
      );
      
      // Verify clipboard was used
      expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith('formatted code');
    });
  });
});