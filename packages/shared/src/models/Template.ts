export interface Language {
  id: string;
  name: string;
  displayName: string;
  extension: string;
  icon?: string;
}

export interface Topic {
  id: string;
  name: string;
  displayName?: string; // 顯示名稱，如果不設定就用 name
  description: string; // 簡短描述 (1-2句話)
  documentation?: string; // 詳細說明文件 (Markdown content, local file path, or URL)

  // 資料夾配置
  templates?: string; // 模板資料夾名稱，預設 "templates"
  links?: string; // 連結資料夾名稱，預設 "links"
  subtopics?: string[]; // 子主題名稱陣列

  // 顯示設定
  display?: {
    icon?: string; // 主題圖標
    color?: string; // 主題顏色 (hex)
    order?: number; // 排序權重
    collapsed?: boolean; // 預設收合狀態
    showInNavigation?: boolean; // 導航顯示
    cardStyle?: string; // 卡片樣式
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  topic: string;
  documentation?: string; // Markdown content, local file path, or URL
}

// 統一的卡片介面，支援三種類型
export interface Card {
  type: 'template' | 'topic' | 'link';
  id: string;
  title: string;
  description: string;
  language: string;
  topic: string;

  // template 類型專用
  code?: string;
  documentation?: string;

  // link 類型專用
  target?: string;
}

export interface ExtendedCard extends Card {
  metadata?: TemplateManagementMetadata;
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
  lastUsedAt?: Date; // 最後使用時間，用於推薦算法
  author?: string;
  version?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  usage?: number; // 使用次數，用於統計
  popularity?: number; // 受歡迎程度，用於推薦
}

export interface ExtendedTemplate extends Template {
  metadata?: TemplateManagementMetadata;
}

// Documentation type enumeration
export enum DocumentationType {
  MARKDOWN = 'markdown',
  FILE = 'file', 
  URL = 'url'
}

// Documentation processing result
export interface DocumentationContent {
  type: DocumentationType;
  content: string;
  processedAt?: Date;
  metadata?: any;
  error?: string;
}

export interface TemplateImportData {
  templates: ExtendedTemplate[];
  languages?: Language[];
  version?: string;
  exportedAt?: Date;
  exportedBy?: string;
}

// Basic recommendation interface (保留簡單版本)
export interface TemplateRecommendation {
  templateId: string;
  score: number;
  reason: string;
}