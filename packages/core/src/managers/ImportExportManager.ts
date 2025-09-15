import { IPlatform } from '../interfaces/IPlatform';
import { TemplateImportData, ExtendedTemplate } from '@textbricks/shared';

/**
 * 匯入匯出管理器 - 平台無關的核心邏輯
 */
export class ImportExportManager {
    constructor(private platform: IPlatform) {}

    /**
     * 匯出模板資料
     */
    async exportTemplates(
        templates: ExtendedTemplate[],
        languages?: any[],
        topics?: any[]
    ): Promise<TemplateImportData> {
        try {
            const exportData: TemplateImportData = {
                templates,
                languages: languages || [],
                version: '1.0.0',
                exportedAt: new Date(),
                exportedBy: 'TextBricks Manager'
            };

            // 添加 topics 如果提供
            if (topics) {
                (exportData as any).topics = topics;
            }

            return exportData;
        } catch (error) {
            this.platform.logError(error as Error, 'Export templates');
            throw error;
        }
    }

    /**
     * 匯入模板資料
     */
    async importTemplates(
        importData: TemplateImportData,
        options: {
            overwriteExisting: boolean;
            mergeTopics: boolean;
            mergeLanguages: boolean;
        }
    ): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }> {
        try {
            const result = {
                imported: 0,
                skipped: 0,
                errors: [] as string[]
            };

            // 驗證匯入資料
            if (!importData.templates || !Array.isArray(importData.templates)) {
                throw new Error('無效的匯入資料：缺少 templates 陣列');
            }

            // 驗證每個模板
            for (const template of importData.templates) {
                try {
                    this.validateTemplate(template);
                } catch (error) {
                    result.errors.push(`模板 "${template.title}" 驗證失敗：${error}`);
                    continue;
                }
            }

            // 這裡的實際匯入邏輯會由使用此管理器的服務來實現
            // ImportExportManager 只負責資料處理和驗證

            return result;
        } catch (error) {
            this.platform.logError(error as Error, 'Import templates');
            throw error;
        }
    }

    /**
     * 驗證模板資料
     */
    private validateTemplate(template: any): void {
        if (!template.title || typeof template.title !== 'string') {
            throw new Error('模板標題不能為空');
        }

        if (!template.description || typeof template.description !== 'string') {
            throw new Error('模板描述不能為空');
        }

        if (!template.code || typeof template.code !== 'string') {
            throw new Error('模板程式碼不能為空');
        }

        if (!template.language || typeof template.language !== 'string') {
            throw new Error('模板語言不能為空');
        }

        if (!template.topic || typeof template.topic !== 'string') {
            throw new Error('模板主題不能為空');
        }
    }

    /**
     * 格式化匯出資料為 JSON 字串
     */
    formatExportData(exportData: TemplateImportData): string {
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 解析匯入資料
     */
    parseImportData(jsonString: string): TemplateImportData {
        try {
            const data = JSON.parse(jsonString);

            // 基本結構驗證
            if (!data || typeof data !== 'object') {
                throw new Error('無效的 JSON 格式');
            }

            return data as TemplateImportData;
        } catch (error) {
            this.platform.logError(error as Error, 'Parse import data');
            throw new Error(`解析匯入資料失敗：${error}`);
        }
    }
}