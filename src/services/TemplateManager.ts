import { Template, TemplateCategory } from '../models/Template';
import * as path from 'path';
import * as fs from 'fs';

interface TemplateData {
  categories: TemplateCategory[];
  templates: Template[];
}

export class TemplateManager {
  private categories: TemplateCategory[] = [];
  private templates: Template[] = [];

  loadTemplates(): void {
    try {
      const dataPath = path.join(__dirname, '../data/templates.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const data: TemplateData = JSON.parse(rawData);
      
      this.categories = data.categories;
      this.templates = data.templates;
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Initialize with empty arrays if loading fails
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

  formatTemplate(template: Template): string {
    return template.code;
  }
}