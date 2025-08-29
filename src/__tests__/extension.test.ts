import * as vscode from 'vscode';
import { activate, deactivate } from '../extension';

// Mock the provider and command handler classes
jest.mock('../providers/TemplateProvider');
jest.mock('../commands/CommandHandler');
jest.mock('../services/TemplateManager');

describe('Extension', () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock context
    mockContext = {
      subscriptions: []
    } as any;
  });

  describe('activate', () => {
    it('should register tree data provider', () => {
      const registerTreeDataProviderSpy = jest.spyOn(vscode.window, 'registerTreeDataProvider');
      
      activate(mockContext);
      
      expect(registerTreeDataProviderSpy).toHaveBeenCalledWith('educode-templates', expect.any(Object));
    });

    it('should register all commands', () => {
      const registerCommandSpy = jest.spyOn(vscode.commands, 'registerCommand');
      
      activate(mockContext);
      
      expect(registerCommandSpy).toHaveBeenCalledWith('educode.refreshTemplates', expect.any(Function));
      expect(registerCommandSpy).toHaveBeenCalledWith('educode.copyTemplate', expect.any(Function));
      expect(registerCommandSpy).toHaveBeenCalledWith('educode.insertTemplate', expect.any(Function));
      expect(registerCommandSpy).toHaveBeenCalledTimes(3);
    });

    it('should add commands to context subscriptions', () => {
      activate(mockContext);
      
      expect(mockContext.subscriptions).toHaveLength(3);
    });
  });

  describe('deactivate', () => {
    it('should not throw error', () => {
      expect(() => deactivate()).not.toThrow();
    });
  });
});