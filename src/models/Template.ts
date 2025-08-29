export interface Template {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  categoryId: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  level: number;
}

export class TemplateItem {
  constructor(
    public readonly template: Template
  ) {}

  format(): string {
    return this.template.code;
  }

  copy(): string {
    return this.template.code;
  }
}