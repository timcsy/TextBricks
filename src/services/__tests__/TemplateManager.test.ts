import { TemplateManager } from '../TemplateManager';
import { Template, TemplateCategory } from '../../models/Template';

describe('TemplateManager', () => {
  let templateManager: TemplateManager;
  
  const mockCategories: TemplateCategory[] = [
    {
      id: 'level1',
      name: 'Basic Syntax',
      description: 'Fundamental C language syntax',
      level: 1
    },
    {
      id: 'level2',
      name: 'Control Structures',
      description: 'If-else, loops, and conditional statements',
      level: 2
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
    },
    {
      id: 'variable-declaration',
      title: 'Variable Declaration',
      description: 'Basic variable declaration',
      code: 'int number = 42;\nchar character = \'A\';\nfloat decimal = 3.14f;',
      language: 'c',
      categoryId: 'level1'
    },
    {
      id: 'if-else',
      title: 'If-Else Statement',
      description: 'Basic conditional statement',
      code: 'if (condition) {\n    // code block\n} else {\n    // alternative code block\n}',
      language: 'c',
      categoryId: 'level2'
    }
  ];

  beforeEach(() => {
    templateManager = new TemplateManager();
    // Manually set up test data since loadTemplates is not implemented yet
    (templateManager as any).categories = [...mockCategories];
    (templateManager as any).templates = [...mockTemplates];
  });

  describe('getTemplateById', () => {
    it('should return template when id exists', () => {
      const template = templateManager.getTemplateById('hello-world');
      
      expect(template).toBeDefined();
      expect(template?.id).toBe('hello-world');
      expect(template?.title).toBe('Hello World');
      expect(template?.code).toContain('printf("Hello, World!\\n");');
    });

    it('should return undefined when id does not exist', () => {
      const template = templateManager.getTemplateById('non-existent');
      
      expect(template).toBeUndefined();
    });

    it('should handle empty string id', () => {
      const template = templateManager.getTemplateById('');
      
      expect(template).toBeUndefined();
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates for existing category', () => {
      const level1Templates = templateManager.getTemplatesByCategory('level1');
      
      expect(level1Templates).toHaveLength(2);
      expect(level1Templates[0].id).toBe('hello-world');
      expect(level1Templates[1].id).toBe('variable-declaration');
    });

    it('should return single template for category with one item', () => {
      const level2Templates = templateManager.getTemplatesByCategory('level2');
      
      expect(level2Templates).toHaveLength(1);
      expect(level2Templates[0].id).toBe('if-else');
    });

    it('should return empty array for non-existent category', () => {
      const templates = templateManager.getTemplatesByCategory('non-existent');
      
      expect(templates).toHaveLength(0);
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should handle empty string category id', () => {
      const templates = templateManager.getTemplatesByCategory('');
      
      expect(templates).toHaveLength(0);
    });
  });

  describe('getCategories', () => {
    it('should return all categories', () => {
      const categories = templateManager.getCategories();
      
      expect(categories).toHaveLength(2);
      expect(categories[0].id).toBe('level1');
      expect(categories[1].id).toBe('level2');
    });

    it('should return a copy of categories array', () => {
      const categories1 = templateManager.getCategories();
      const categories2 = templateManager.getCategories();
      
      expect(categories1).not.toBe(categories2);
      expect(categories1).toEqual(categories2);
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates', () => {
      const templates = templateManager.getAllTemplates();
      
      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.id)).toEqual(['hello-world', 'variable-declaration', 'if-else']);
    });

    it('should return a copy of templates array', () => {
      const templates1 = templateManager.getAllTemplates();
      const templates2 = templateManager.getAllTemplates();
      
      expect(templates1).not.toBe(templates2);
      expect(templates1).toEqual(templates2);
    });
  });

  describe('formatTemplate', () => {
    it('should return template code', () => {
      const template = mockTemplates[0];
      const formatted = templateManager.formatTemplate(template);
      
      expect(formatted).toBe(template.code);
      expect(formatted).toContain('#include <stdio.h>');
    });

    it('should handle empty code', () => {
      const emptyTemplate: Template = {
        ...mockTemplates[0],
        code: ''
      };
      const formatted = templateManager.formatTemplate(emptyTemplate);
      
      expect(formatted).toBe('');
    });
  });

  describe('loadTemplates', () => {
    it('should load templates from JSON file successfully', () => {
      const newManager = new TemplateManager();
      
      expect(() => newManager.loadTemplates()).not.toThrow();
      expect(newManager.getCategories().length).toBeGreaterThan(0);
      expect(newManager.getAllTemplates().length).toBeGreaterThan(0);
    });

    it('should handle file loading errors gracefully', () => {
      const newManager = new TemplateManager();
      
      // Mock fs to simulate file error
      const originalReadFileSync = require('fs').readFileSync;
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });
      
      expect(() => newManager.loadTemplates()).not.toThrow();
      expect(newManager.getCategories()).toEqual([]);
      expect(newManager.getAllTemplates()).toEqual([]);
      
      // Restore original function
      require('fs').readFileSync = originalReadFileSync;
    });
  });
});