/**
 * TextBricks 核心服務模組
 * 匯出所有平台無關的核心服務
 */

export { TextBricksEngine } from './TextBricksEngine';
export { FormattingEngine } from './FormattingEngine';
export { CodeOperationService, type OperationOptions } from './CodeOperationService';
export { SearchService, type SearchFilters, type SearchOptions, type SearchResult } from './SearchService';
export { DocumentationService } from './DocumentationService';

// 向後兼容別名
export { TextBricksEngine as TemplateEngine } from './TextBricksEngine';