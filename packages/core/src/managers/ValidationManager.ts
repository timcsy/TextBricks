import { IPlatform } from '../interfaces/IPlatform';
import { ExtendedTemplate, Language, TemplateImportData } from '@textbricks/shared';

/**
 * 驗證結果介面
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ValidationWarning {
    field: string;
    message: string;
    code: string;
}

export interface TemplateValidationOptions {
    requireDocumentation?: boolean;
    requireTags?: boolean;
    maxCodeLength?: number;
    allowedLanguages?: string[];
    allowedTopics?: string[];
}

export interface ImportValidationOptions {
    allowDuplicates?: boolean;
    validateVersionCompatibility?: boolean;
    requireMetadata?: boolean;
}

/**
 * 驗證管理器 - 平台無關的驗證邏輯
 */
export class ValidationManager {
    constructor(private platform: IPlatform) {}

    /**
     * 驗證單個模板
     */
    validateTemplate(
        template: any,
        options: TemplateValidationOptions = {}
    ): ValidationResult {
        try {
            const errors: ValidationError[] = [];
            const warnings: ValidationWarning[] = [];

            // 基本欄位驗證
            this.validateBasicFields(template, errors);

            // 程式碼驗證
            this.validateCode(template, options, errors, warnings);

            // 元資料驗證
            this.validateMetadata(template, options, errors, warnings);

            // 語言和主題驗證
            this.validateLanguageAndTopic(template, options, errors, warnings);

            // 文檔驗證
            this.validateDocumentation(template, options, warnings);

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            this.platform.logError(error as Error, 'Validate template');
            return {
                isValid: false,
                errors: [{
                    field: 'general',
                    message: `驗證過程中發生錯誤：${error}`,
                    code: 'VALIDATION_ERROR'
                }],
                warnings: []
            };
        }
    }

    /**
     * 驗證模板陣列
     */
    validateTemplates(
        templates: any[],
        options: TemplateValidationOptions = {}
    ): { results: ValidationResult[]; summary: { valid: number; invalid: number; warnings: number } } {
        const results = templates.map(template => this.validateTemplate(template, options));

        const summary = {
            valid: results.filter(r => r.isValid).length,
            invalid: results.filter(r => !r.isValid).length,
            warnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
        };

        return { results, summary };
    }

    /**
     * 驗證匯入資料
     */
    validateImportData(
        importData: any,
        options: ImportValidationOptions = {}
    ): ValidationResult {
        try {
            const errors: ValidationError[] = [];
            const warnings: ValidationWarning[] = [];

            // 基本結構驗證
            this.validateImportStructure(importData, errors);

            // 版本兼容性驗證
            if (options.validateVersionCompatibility) {
                this.validateVersionCompatibility(importData, warnings);
            }

            // 元資料驗證
            if (options.requireMetadata) {
                this.validateImportMetadata(importData, errors, warnings);
            }

            // 模板驗證
            if (importData.templates && Array.isArray(importData.templates)) {
                const templateValidation = this.validateTemplates(importData.templates);

                // 將模板驗證錯誤合併到總體結果中
                templateValidation.results.forEach((result, index) => {
                    result.errors.forEach(error => {
                        errors.push({
                            field: `templates[${index}].${error.field}`,
                            message: error.message,
                            code: error.code
                        });
                    });

                    result.warnings.forEach(warning => {
                        warnings.push({
                            field: `templates[${index}].${warning.field}`,
                            message: warning.message,
                            code: warning.code
                        });
                    });
                });
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            this.platform.logError(error as Error, 'Validate import data');
            return {
                isValid: false,
                errors: [{
                    field: 'general',
                    message: `驗證匯入資料時發生錯誤：${error}`,
                    code: 'IMPORT_VALIDATION_ERROR'
                }],
                warnings: []
            };
        }
    }

    /**
     * 驗證語言設定
     */
    validateLanguage(language: any): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        if (!language.id || typeof language.id !== 'string') {
            errors.push({
                field: 'id',
                message: '語言 ID 不能為空且必須是字串',
                code: 'LANGUAGE_ID_REQUIRED'
            });
        }

        if (!language.displayName || typeof language.displayName !== 'string') {
            errors.push({
                field: 'displayName',
                message: '語言顯示名稱不能為空且必須是字串',
                code: 'LANGUAGE_DISPLAY_NAME_REQUIRED'
            });
        }

        if (language.fileExtensions && !Array.isArray(language.fileExtensions)) {
            errors.push({
                field: 'fileExtensions',
                message: '檔案副檔名必須是陣列',
                code: 'LANGUAGE_FILE_EXTENSIONS_INVALID'
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // ==================== 私有驗證方法 ====================

    private validateBasicFields(template: any, errors: ValidationError[]): void {
        if (!template.title || typeof template.title !== 'string') {
            errors.push({
                field: 'title',
                message: '模板標題不能為空且必須是字串',
                code: 'TITLE_REQUIRED'
            });
        }

        if (!template.description || typeof template.description !== 'string') {
            errors.push({
                field: 'description',
                message: '模板描述不能為空且必須是字串',
                code: 'DESCRIPTION_REQUIRED'
            });
        }

        if (!template.code || typeof template.code !== 'string') {
            errors.push({
                field: 'code',
                message: '模板程式碼不能為空且必須是字串',
                code: 'CODE_REQUIRED'
            });
        }

        if (!template.language || typeof template.language !== 'string') {
            errors.push({
                field: 'language',
                message: '模板語言不能為空且必須是字串',
                code: 'LANGUAGE_REQUIRED'
            });
        }

        if (!template.topic || typeof template.topic !== 'string') {
            errors.push({
                field: 'topic',
                message: '模板主題不能為空且必須是字串',
                code: 'TOPIC_REQUIRED'
            });
        }
    }

    private validateCode(
        template: any,
        options: TemplateValidationOptions,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        if (template.code) {
            if (options.maxCodeLength && template.code.length > options.maxCodeLength) {
                warnings.push({
                    field: 'code',
                    message: `程式碼長度 (${template.code.length}) 超過建議長度 (${options.maxCodeLength})`,
                    code: 'CODE_TOO_LONG'
                });
            }

            // 檢查是否包含潛在的危險程式碼
            const dangerousPatterns = [
                /exec\s*\(/i,
                /eval\s*\(/i,
                /system\s*\(/i,
                /shell_exec\s*\(/i
            ];

            dangerousPatterns.forEach(pattern => {
                if (pattern.test(template.code)) {
                    warnings.push({
                        field: 'code',
                        message: '程式碼中包含潛在危險的函數調用',
                        code: 'DANGEROUS_CODE_PATTERN'
                    });
                }
            });
        }
    }

    private validateMetadata(
        template: any,
        options: TemplateValidationOptions,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        if (template.metadata) {
            if (template.metadata.tags && !Array.isArray(template.metadata.tags)) {
                errors.push({
                    field: 'metadata.tags',
                    message: '標籤必須是陣列',
                    code: 'TAGS_INVALID_TYPE'
                });
            }

            if (template.metadata.createdAt && isNaN(Date.parse(template.metadata.createdAt))) {
                errors.push({
                    field: 'metadata.createdAt',
                    message: '創建時間格式無效',
                    code: 'CREATED_AT_INVALID'
                });
            }

            if (template.metadata.lastUsedAt && isNaN(Date.parse(template.metadata.lastUsedAt))) {
                errors.push({
                    field: 'metadata.lastUsedAt',
                    message: '最後使用時間格式無效',
                    code: 'LAST_USED_AT_INVALID'
                });
            }
        } else if (options.requireTags) {
            warnings.push({
                field: 'metadata',
                message: '建議提供模板元資料，包括標籤等資訊',
                code: 'METADATA_RECOMMENDED'
            });
        }
    }

    private validateLanguageAndTopic(
        template: any,
        options: TemplateValidationOptions,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        if (options.allowedLanguages && template.language) {
            if (!options.allowedLanguages.includes(template.language)) {
                errors.push({
                    field: 'language',
                    message: `不支援的語言：${template.language}`,
                    code: 'LANGUAGE_NOT_ALLOWED'
                });
            }
        }

        if (options.allowedTopics && template.topic) {
            if (!options.allowedTopics.includes(template.topic)) {
                errors.push({
                    field: 'topic',
                    message: `不支援的主題：${template.topic}`,
                    code: 'TOPIC_NOT_ALLOWED'
                });
            }
        }
    }

    private validateDocumentation(
        template: any,
        options: TemplateValidationOptions,
        warnings: ValidationWarning[]
    ): void {
        if (options.requireDocumentation) {
            if (!template.documentation || template.documentation.trim().length === 0) {
                warnings.push({
                    field: 'documentation',
                    message: '建議提供模板說明文檔',
                    code: 'DOCUMENTATION_RECOMMENDED'
                });
            }
        }
    }

    private validateImportStructure(importData: any, errors: ValidationError[]): void {
        if (!importData || typeof importData !== 'object') {
            errors.push({
                field: 'root',
                message: '匯入資料必須是有效的物件',
                code: 'INVALID_IMPORT_STRUCTURE'
            });
            return;
        }

        if (!importData.templates || !Array.isArray(importData.templates)) {
            errors.push({
                field: 'templates',
                message: '匯入資料必須包含模板陣列',
                code: 'TEMPLATES_REQUIRED'
            });
        }
    }

    private validateVersionCompatibility(importData: any, warnings: ValidationWarning[]): void {
        if (importData.version) {
            // 這裡可以加入版本兼容性檢查邏輯
            const currentVersion = '1.0.0';
            if (importData.version !== currentVersion) {
                warnings.push({
                    field: 'version',
                    message: `匯入資料版本 (${importData.version}) 與當前版本 (${currentVersion}) 不同，可能存在兼容性問題`,
                    code: 'VERSION_MISMATCH'
                });
            }
        }
    }

    private validateImportMetadata(
        importData: any,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        if (!importData.exportedAt) {
            warnings.push({
                field: 'exportedAt',
                message: '缺少匯出時間資訊',
                code: 'EXPORT_DATE_MISSING'
            });
        } else if (isNaN(Date.parse(importData.exportedAt))) {
            errors.push({
                field: 'exportedAt',
                message: '匯出時間格式無效',
                code: 'EXPORT_DATE_INVALID'
            });
        }

        if (!importData.exportedBy) {
            warnings.push({
                field: 'exportedBy',
                message: '缺少匯出者資訊',
                code: 'EXPORTER_MISSING'
            });
        }
    }
}