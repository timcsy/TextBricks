import { Template, TemplateCategory, Language, ExtendedTemplate } from '../models/Template';
import * as path from 'path';
import * as fs from 'fs';

interface TemplateData {
  languages: Language[];
  categories: TemplateCategory[];
  templates: ExtendedTemplate[];
}

export class TemplateManager {
  private languages: Language[] = [];
  private categories: TemplateCategory[] = [];
  private templates: ExtendedTemplate[] = [];

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

  getTemplateById(id: string): ExtendedTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  getTemplatesByCategory(categoryId: string): ExtendedTemplate[] {
    return this.templates.filter(template => template.categoryId === categoryId);
  }

  getCategories(): TemplateCategory[] {
    return [...this.categories];
  }

  getAllTemplates(): ExtendedTemplate[] {
    return [...this.templates];
  }

  getLanguages(): Language[] {
    return [...this.languages];
  }

  getLanguageById(id: string): Language | undefined {
    return this.languages.find(language => language.id === id);
  }

  getTemplatesByLanguage(languageId: string): ExtendedTemplate[] {
    return this.templates.filter(template => template.language === languageId);
  }

  getTemplatesByLanguageAndCategory(languageId: string, categoryId: string): ExtendedTemplate[] {
    return this.templates.filter(
      template => template.language === languageId && template.categoryId === categoryId
    );
  }

  formatTemplate(template: ExtendedTemplate): string {
    return template.code;
  }
}