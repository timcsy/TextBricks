import * as vscode from 'vscode';
import { CommandHandler } from '../CommandHandler';
import { TemplateManager } from '../../services/TemplateManager';
import { Template } from '../../models/Template';

describe('CommandHandler', () => {
  let commandHandler: CommandHandler;
  let mockTemplateManager: jest.Mocked<TemplateManager>;
  let mockEditor: jest.Mocked<vscode.TextEditor>;

  const mockTemplate: Template = {
    id: 'hello-world',
    title: 'Hello World',
    description: 'Basic Hello World program',
    code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    language: 'c',
    categoryId: 'level1'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    mockTemplateManager = {
      getTemplateById: jest.fn(),
      formatTemplate: jest.fn(),
      getTemplatesByCategory: jest.fn(),
      getCategories: jest.fn(),
      getAllTemplates: jest.fn(),
      loadTemplates: jest.fn()
    } as any;

    mockEditor = {
      selection: {
        active: { line: 0, character: 0 }
      },
      edit: jest.fn()
    } as any;

    commandHandler = new CommandHandler(mockTemplateManager);
  });

  describe('copyTemplate', () => {
    it('should copy template to clipboard successfully', async () => {
      mockTemplateManager.getTemplateById.mockReturnValue(mockTemplate);
      mockTemplateManager.formatTemplate.mockReturnValue(mockTemplate.code);
      (vscode.env.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);

      await commandHandler.copyTemplate('hello-world');

      expect(mockTemplateManager.getTemplateById).toHaveBeenCalledWith('hello-world');
      expect(mockTemplateManager.formatTemplate).toHaveBeenCalledWith(mockTemplate);
      expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith(mockTemplate.code);
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith("Template 'Hello World' copied to clipboard");
    });

    it('should show error when template not found', async () => {
      mockTemplateManager.getTemplateById.mockReturnValue(undefined);

      await commandHandler.copyTemplate('non-existent');

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("Template with id 'non-existent' not found");
      expect(vscode.env.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('should handle clipboard write error', async () => {
      const error = new Error('Clipboard error');
      mockTemplateManager.getTemplateById.mockReturnValue(mockTemplate);
      mockTemplateManager.formatTemplate.mockReturnValue(mockTemplate.code);
      (vscode.env.clipboard.writeText as jest.Mock).mockRejectedValue(error);

      await commandHandler.copyTemplate('hello-world');

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to copy template: Error: Clipboard error');
    });
  });

  describe('insertTemplate', () => {
    beforeEach(() => {
      (vscode.window as any).activeTextEditor = mockEditor;
    });

    it('should insert template successfully', async () => {
      mockTemplateManager.getTemplateById.mockReturnValue(mockTemplate);
      mockTemplateManager.formatTemplate.mockReturnValue(mockTemplate.code);
      mockEditor.edit.mockImplementation((callback) => {
        const editBuilder = {
          insert: jest.fn()
        };
        callback(editBuilder as any);
        return Promise.resolve(true);
      });

      await commandHandler.insertTemplate('hello-world');

      expect(mockTemplateManager.getTemplateById).toHaveBeenCalledWith('hello-world');
      expect(mockTemplateManager.formatTemplate).toHaveBeenCalledWith(mockTemplate);
      expect(mockEditor.edit).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith("Template 'Hello World' inserted");
    });

    it('should show error when template not found', async () => {
      mockTemplateManager.getTemplateById.mockReturnValue(undefined);

      await commandHandler.insertTemplate('non-existent');

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("Template with id 'non-existent' not found");
      expect(mockEditor.edit).not.toHaveBeenCalled();
    });

    it('should show error when no active editor', async () => {
      (vscode.window as any).activeTextEditor = undefined;
      mockTemplateManager.getTemplateById.mockReturnValue(mockTemplate);

      await commandHandler.insertTemplate('hello-world');

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No active text editor found');
      expect(mockEditor.edit).not.toHaveBeenCalled();
    });

    it('should handle edit error', async () => {
      const error = new Error('Edit error');
      mockTemplateManager.getTemplateById.mockReturnValue(mockTemplate);
      mockTemplateManager.formatTemplate.mockReturnValue(mockTemplate.code);
      mockEditor.edit.mockRejectedValue(error);

      await commandHandler.insertTemplate('hello-world');

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Failed to insert template: Error: Edit error');
    });
  });
});