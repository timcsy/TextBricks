import * as vscode from 'vscode';
import { TemplateProvider, CategoryTreeItem, TemplateTreeItemImpl } from '../TemplateProvider';
import { TemplateManager } from '../../services/TemplateManager';
import { Template, TemplateCategory } from '../../models/Template';

describe('TemplateProvider', () => {
  let templateProvider: TemplateProvider;
  let mockTemplateManager: jest.Mocked<TemplateManager>;

  const mockCategories: TemplateCategory[] = [
    {
      id: 'level1',
      name: 'Basic Syntax',
      description: 'Fundamental C language syntax',
      level: 1
    }
  ];

  const mockTemplates: Template[] = [
    {
      id: 'hello-world',
      title: 'Hello World',
      description: 'Basic Hello World program',
      code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
      language: 'c',
      categoryId: 'level1'
    }
  ];

  beforeEach(() => {
    mockTemplateManager = {
      getCategories: jest.fn(),
      getTemplatesByCategory: jest.fn(),
      getTemplateById: jest.fn(),
      getAllTemplates: jest.fn(),
      formatTemplate: jest.fn(),
      loadTemplates: jest.fn()
    } as any;

    templateProvider = new TemplateProvider(mockTemplateManager);
  });

  describe('getChildren', () => {
    it('should return categories when no element is provided', async () => {
      mockTemplateManager.getCategories.mockReturnValue(mockCategories);

      const children = await templateProvider.getChildren();

      expect(children).toHaveLength(1);
      expect(children[0]).toBeInstanceOf(CategoryTreeItem);
      expect(children[0].label).toBe('Basic Syntax');
    });

    it('should return templates for a category', async () => {
      mockTemplateManager.getTemplatesByCategory.mockReturnValue(mockTemplates);
      const categoryItem = new CategoryTreeItem(mockCategories[0]);

      const children = await templateProvider.getChildren(categoryItem);

      expect(children).toHaveLength(1);
      expect(children[0]).toBeInstanceOf(TemplateTreeItemImpl);
      expect(children[0].label).toBe('Hello World');
      expect(mockTemplateManager.getTemplatesByCategory).toHaveBeenCalledWith('level1');
    });

    it('should return empty array for template items', async () => {
      const templateItem = new TemplateTreeItemImpl(mockTemplates[0]);

      const children = await templateProvider.getChildren(templateItem);

      expect(children).toHaveLength(0);
    });
  });

  describe('getTreeItem', () => {
    it('should return the same tree item', () => {
      const categoryItem = new CategoryTreeItem(mockCategories[0]);

      const result = templateProvider.getTreeItem(categoryItem);

      expect(result).toBe(categoryItem);
    });
  });

  describe('refresh', () => {
    it('should fire onDidChangeTreeData event', () => {
      const eventSpy = jest.spyOn((templateProvider as any)._onDidChangeTreeData, 'fire');

      templateProvider.refresh();

      expect(eventSpy).toHaveBeenCalled();
    });
  });
});

describe('CategoryTreeItem', () => {
  const mockCategory: TemplateCategory = {
    id: 'level1',
    name: 'Basic Syntax',
    description: 'Fundamental C language syntax',
    level: 1
  };

  it('should create with correct properties', () => {
    const item = new CategoryTreeItem(mockCategory);

    expect(item.label).toBe('Basic Syntax');
    expect(item.tooltip).toBe('Fundamental C language syntax');
    expect(item.description).toBe('Level 1');
    expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.Collapsed);
    expect(item.iconPath).toEqual(new vscode.ThemeIcon('folder'));
  });
});

describe('TemplateTreeItemImpl', () => {
  const mockTemplate: Template = {
    id: 'hello-world',
    title: 'Hello World',
    description: 'Basic Hello World program',
    code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    language: 'c',
    categoryId: 'level1'
  };

  it('should create with correct properties', () => {
    const item = new TemplateTreeItemImpl(mockTemplate);

    expect(item.label).toBe('Hello World');
    expect(item.tooltip).toBe('Basic Hello World program');
    expect(item.description).toBe('Basic Hello World program');
    expect(item.collapsibleState).toBe(vscode.TreeItemCollapsibleState.None);
    expect(item.iconPath).toEqual(new vscode.ThemeIcon('code'));
    expect(item.command).toEqual({
      command: 'educode.copyTemplate',
      title: 'Copy Template',
      arguments: ['hello-world']
    });
  });
});