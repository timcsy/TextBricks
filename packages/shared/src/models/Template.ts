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
  description: string; // 簡短描述 (1-2句話)
  documentation?: string; // 詳細說明文件 (Markdown content, local file path, or URL)
  color?: string; // 主題顏色 (可選)
  icon?: string;  // 主題圖標 (可選)
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

// 擴展的編程上下文信息
export interface ProgrammingContext {
  // 當前編輯的檔案信息
  currentFile?: {
    path: string;
    language: string;
    extension: string;
    size: number;
  };
  
  // 游標位置和周圍代碼
  cursor?: {
    line: number;
    column: number;
    surroundingCode?: string; // 游標前後的代碼片段
    currentFunction?: string; // 當前所在函數名
    currentClass?: string;   // 當前所在類別名
  };
  
  // 項目環境信息
  project?: {
    type: 'web' | 'desktop' | 'mobile' | 'library' | 'script' | 'unknown';
    framework?: string; // React, Vue, Angular, Express, etc.
    buildTool?: string; // webpack, vite, rollup, etc.
    packageManager?: string; // npm, yarn, pnpm
    dependencies?: string[]; // 主要依賴套件
    hasTests?: boolean;
    hasLinter?: boolean;
  };
  
  // 最近的編程活動
  recentActivity?: {
    recentFiles?: string[]; // 最近編輯的檔案
    recentCommands?: string[]; // 最近執行的 VS Code 命令
    recentSearch?: string[]; // 最近搜索的關鍵字
    editingPatterns?: string[]; // 最近的編輯模式（循環、條件、函數等）
  };
  
  // 工作習慣
  workingStyle?: {
    preferredIndentation?: 'spaces' | 'tabs';
    preferredQuotes?: 'single' | 'double';
    codeStyle?: 'functional' | 'oop' | 'mixed';
    complexityPreference?: 'simple' | 'advanced';
  };
  
  // 學習進度相關
  skillLevel?: {
    language: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedProgress?: number; // 0-100
    weakAreas?: string[]; // 需要加強的領域
    strengths?: string[]; // 擅長的領域
  }[];
}

// 上下文感知推薦結果
export interface ContextualRecommendation extends TemplateRecommendation {
  contextualScore: number; // 基於上下文的分數
  contextReasons: string[]; // 推薦的上下文原因
  relevanceFactors: {
    currentFileRelevance?: number; // 與當前檔案的相關性
    projectTypeRelevance?: number; // 與項目類型的相關性
    skillLevelMatch?: number; // 與技能等級的匹配度
    recentPatternMatch?: number; // 與最近編程模式的匹配度
    frameworkRelevance?: number; // 與框架的相關性
  };
}

export interface TemplateRecommendation {
  templateId: string;
  score: number;
  reason: string;
  context?: LearningContext;
}