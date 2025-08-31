import { Template, TemplateCategory, Language } from '../models/Template';
import * as path from 'path';
import * as fs from 'fs';

interface TemplateData {
  languages: Language[];
  categories: TemplateCategory[];
  templates: Template[];
}

export class TemplateManager {
  private languages: Language[] = [];
  private categories: TemplateCategory[] = [];
  private templates: Template[] = [];

  loadTemplates(): void {
    try {
      const dataPath = path.join(__dirname, '../data/templates.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const data: TemplateData = JSON.parse(rawData);
      
      this.languages = data.languages || [];
      this.categories = data.categories;
      this.templates = data.templates;
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Initialize with empty arrays if loading fails
      this.languages = [];
      this.categories = [];
      this.templates = [];
    }
  }

  getTemplateById(id: string): Template | undefined {
    return this.templates.find(template => template.id === id);
  }

  getTemplatesByCategory(categoryId: string): Template[] {
    return this.templates.filter(template => template.categoryId === categoryId);
  }

  getCategories(): TemplateCategory[] {
    return [...this.categories];
  }

  getAllTemplates(): Template[] {
    return [...this.templates];
  }

  getLanguages(): Language[] {
    return [...this.languages];
  }

  getLanguageById(id: string): Language | undefined {
    return this.languages.find(language => language.id === id);
  }

  getTemplatesByLanguage(languageId: string): Template[] {
    return this.templates.filter(template => template.language === languageId);
  }

  getTemplatesByLanguageAndCategory(languageId: string, categoryId: string): Template[] {
    return this.templates.filter(
      template => template.language === languageId && template.categoryId === categoryId
    );
  }

  formatTemplate(template: Template): string {
    return template.code;
  }
}