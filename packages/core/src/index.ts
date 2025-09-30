// Core services
export { TextBricksEngine } from './core/TextBricksEngine';
export { DocumentationService } from './core/DocumentationService';
export { SearchService } from './core/SearchService';
export { CodeOperationService } from './core/CodeOperationService';
export { DataPathService } from './services/DataPathService';
export { RecommendationService, RecommendationConfig } from './services/RecommendationService';

// Core managers
export { ImportExportManager } from './managers/ImportExportManager';
export { SearchManager, SearchFilters, SearchOptions, SearchResult } from './managers/SearchManager';
export { ValidationManager, ValidationResult, ValidationError, ValidationWarning, TemplateValidationOptions, ImportValidationOptions } from './managers/ValidationManager';
export { ScopeManager } from './managers/ScopeManager';
export { TopicManager } from './managers/TopicManager';

// Repositories
export { TemplateRepository } from './repositories/TemplateRepository';

// Platform interfaces
export * from './interfaces/IEditor';
export * from './interfaces/IUI';
export * from './interfaces/IClipboard';
export * from './interfaces/IStorage';
export { 
    IPlatform, 
    PlatformInfo, 
    PlatformConfiguration, 
    IPlatformPlugin, 
    PlatformAdapter,
    IPlatformFactory
} from './interfaces/IPlatform';