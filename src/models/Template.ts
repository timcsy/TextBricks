export interface Language {
  id: string;
  name: string;
  displayName: string;
  extension: string;
  icon?: string;
}

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

// Template Management related interfaces
export interface TemplateManagementMetadata {
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
  version?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  usage?: number; // 使用次數，未來用於統計
  popularity?: number; // 受歡迎程度，未來用於推薦
}

export interface ExtendedTemplate extends Template {
  metadata?: TemplateManagementMetadata;
}

export interface TemplateImportData {
  templates: ExtendedTemplate[];
  categories?: TemplateCategory[];
  languages?: Language[];
  version?: string;
  exportedAt?: Date;
  exportedBy?: string;
}

// Future expansion interfaces
export interface UserProfile {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  preferences?: {
    favoriteLanguages?: string[];
    skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface LearningContext {
  currentLanguage?: string;
  currentProject?: string;
  recentTemplates?: string[];
  learningObjectives?: string[];
}

export interface TemplateRecommendation {
  templateId: string;
  score: number;
  reason: string;
  context?: LearningContext;
}