export interface Language {
  name: string;  // 唯一識別（如 "python", "javascript"）
  title: string;  // 顯示名稱（原 displayName）
  tagName: string;
  description: string;
  fileExtensions: string[];
  icon?: string;
  color?: string;
}

/**
 * Topic 類型別名
 *
 * @deprecated 請使用 TopicConfig（從 '@textbricks/shared' 的 models/Topic.ts 導入）
 * 此別名保留用於向後兼容，將在未來版本中移除
 *
 * Phase 4 重構：統一使用 TopicConfig 作為主要的主題模型
 */
export type Topic = import('./Topic').TopicConfig;

export interface Template {
  type: 'template';
  name: string;  // 檔案名稱，用於路徑識別（如 "hello-world"）
  title: string;  // 顯示標題
  description: string;
  code: string;
  language: string;  // 語言名稱（如 "python"）
  documentation?: string; // Markdown content, local file path, or URL
  // 注意：topic 路徑從檔案系統結構推導，不再儲存
  // 唯一識別路徑格式：{topic_path}/templates/{name}
}

// 統一的卡片介面，支援三種類型
export interface Card {
  type: 'template' | 'topic' | 'link';
  name: string;  // 名稱（用於路徑識別）
  title: string;  // 顯示標題
  description: string;
  language: string;
  topicPath?: string;  // 主題路徑（用於分組，從檔案系統推導）
  originalTopicPath?: string;  // 原始主題路徑（可能是子主題）

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
  templatePath: string;
  score: number;
  reason: string;
}