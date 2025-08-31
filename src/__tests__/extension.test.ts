import * as vscode from 'vscode';
import { activate, deactivate } from '../extension';

// Mock the services
jest.mock('../services/TemplateManager');

describe('Extension', () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock URI
    const mockUri = {
      path: '/test',
      scheme: 'file',
      toString: () => 'file:///test'
    } as vscode.Uri;
    
    // Create mock context with globalState
    mockContext = {
      subscriptions: [],
      extensionUri: mockUri,
      globalState: {
        get: jest.fn().mockReturnValue('c'),
        update: jest.fn()
      }
    } as any;
  });

  describe('activate', () => {
    it('should register webview view provider', () => {
      const registerWebviewViewProviderSpy = jest.spyOn(vscode.window, 'registerWebviewViewProvider');
      
      activate(mockContext);
      
      expect(registerWebviewViewProviderSpy).toHaveBeenCalledWith('textbricks-webview', expect.any(Object));
    });

    it('should register refresh command', () => {
      const registerCommandSpy = jest.spyOn(vscode.commands, 'registerCommand');
      
      activate(mockContext);
      
      expect(registerCommandSpy).toHaveBeenCalledWith('textbricks.refreshTemplates', expect.any(Function));
      expect(registerCommandSpy).toHaveBeenCalledTimes(1);
    });

    it('should add registrations to context subscriptions', () => {
      activate(mockContext);
      
      expect(mockContext.subscriptions).toHaveLength(2); // webview provider + refresh command
    });
  });

  describe('deactivate', () => {
    it('should not throw error', () => {
      expect(() => deactivate()).not.toThrow();
    });
  });
});