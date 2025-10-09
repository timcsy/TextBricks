import { Template, TemplateItem } from '../Template';

describe('Template Model', () => {
  describe('TemplateItem', () => {
    const mockTemplate: Template = {
      type: 'template',
      name: 'hello-world',
      title: 'Hello World',
      description: 'Basic Hello World program',
      code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
      language: 'c'
    };

    let templateItem: TemplateItem;

    beforeEach(() => {
      templateItem = new TemplateItem(mockTemplate);
    });

    it('should create a template item with the given template', () => {
      expect(templateItem.template).toBe(mockTemplate);
    });

    it('should format template code correctly', () => {
      const formatted = templateItem.format();
      expect(formatted).toBe(mockTemplate.code);
      expect(formatted).toContain('#include <stdio.h>');
      expect(formatted).toContain('printf("Hello, World!\\n");');
    });

    it('should copy template code correctly', () => {
      const copied = templateItem.copy();
      expect(copied).toBe(mockTemplate.code);
      expect(copied).toEqual(templateItem.format());
    });

    it('should handle empty code template', () => {
      const emptyTemplate: Template = {
        ...mockTemplate,
        code: ''
      };
      const emptyTemplateItem = new TemplateItem(emptyTemplate);
      
      expect(emptyTemplateItem.format()).toBe('');
      expect(emptyTemplateItem.copy()).toBe('');
    });
  });

  describe('Template interface', () => {
    it('should have all required properties', () => {
      const template: Template = {
        type: 'template',
        name: 'test-template',
        title: 'Test Template',
        description: 'Test description',
        code: 'test code',
        language: 'c'
      };

      expect(template.type).toBe('template');
      expect(template.name).toBe('test-template');
      expect(template.title).toBe('Test Template');
      expect(template.description).toBe('Test description');
      expect(template.code).toBe('test code');
      expect(template.language).toBe('c');
    });
  });
});