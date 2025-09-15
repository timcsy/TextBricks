// Core services
export { TextBricksEngine } from './core/TextBricksEngine';
export { DocumentationService } from './core/DocumentationService';
export { SearchService } from './core/SearchService';
export { CodeOperationService } from './core/CodeOperationService';

// Core managers
export { ImportExportManager } from './managers/ImportExportManager';
export { SearchManager, SearchFilters, SearchOptions, SearchResult } from './managers/SearchManager';
export { ValidationManager, ValidationResult, ValidationError, ValidationWarning, TemplateValidationOptions, ImportValidationOptions } from './managers/ValidationManager';

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