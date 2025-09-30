/**
 * 資料路徑管理服務
 * 負責管理 TextBricks 資料的存儲位置
 */

import * as path from 'path';
import * as os from 'os';
import {
    DataLocationInfo,
    DataLocationOption,
    DataLocationValidation,
    DataLocationConfig,
    DataLocationStats,
    DataMigrationResult
} from '@textbricks/shared';
import { IPlatform } from '../interfaces/IPlatform';

export class DataPathService {
    private static instance: DataPathService | null = null;

    private platform: IPlatform;
    private currentDataPath: string | null = null;
    private config: DataLocationConfig | null = null;

    private constructor(platform: IPlatform) {
        this.platform = platform;
    }

    /**
     * 獲取 DataPathService 單例
     * @param platform - 平台介面
     * @returns DataPathService 實例
     */
    static getInstance(platform: IPlatform): DataPathService {
        if (!DataPathService.instance) {
            DataPathService.instance = new DataPathService(platform);
        }
        return DataPathService.instance;
    }

    /**
     * 重置單例（主要用於測試）
     */
    static resetInstance(): void {
        DataPathService.instance = null;
    }

    /**
     * 初始化服務，載入當前配置
     */
    async initialize(): Promise<void> {
        await this.loadConfiguration();
        if (!this.currentDataPath) {
            await this.initializeDefaultPath();
        }
    }

    /**
     * 自動初始化資料位置，詢問用戶確認
     */
    async autoInitialize(): Promise<boolean> {
        try {
            await this.loadConfiguration();

            // 如果已經有資料路徑且資料存在，則不需要初始化
            if (this.currentDataPath) {
                const validation = await this.validatePath(this.currentDataPath);
                if (validation.isValid) {
                    const hasData = await this.checkExistingData(this.currentDataPath);
                    if (hasData) {
                        return true; // 已經初始化過
                    }
                }
            }

            // 獲取系統預設路徑
            const defaultPath = this.getSystemDefaultPath();

            // 檢查預設路徑是否已有資料
            const hasExistingData = await this.checkExistingData(defaultPath);

            let shouldInitialize = false;
            let shouldMigrate = false;

            if (hasExistingData) {
                // 已有資料，詢問是否使用現有資料
                const useExisting = await this.platform.ui.showInformationMessage(
                    `發現現有的 TextBricks 資料\n\n在系統預設位置找到現有資料：${defaultPath}\n\n是否使用現有資料？`,
                    '使用現有資料', '重新初始化', '取消'
                );

                if (useExisting === '使用現有資料') {
                    shouldInitialize = true;
                } else if (useExisting === '重新初始化') {
                    shouldInitialize = true;
                    shouldMigrate = true;
                } else {
                    return false; // 用戶取消
                }
            } else {
                // 沒有現有資料，詢問是否要初始化
                const initNew = await this.platform.ui.showInformationMessage(
                    `初始化 TextBricks 資料位置\n\nTextBricks 將在以下位置創建資料目錄：${defaultPath}\n\n是否繼續？`,
                    '確定', '選擇其他位置', '取消'
                );

                if (initNew === '確定') {
                    shouldInitialize = true;
                    shouldMigrate = true;
                } else if (initNew === '選擇其他位置') {
                    const customPath = await this.platform.ui.showInputBox({
                        title: '請輸入資料存儲路徑',
                        value: defaultPath,
                        placeholder: defaultPath
                    });
                    if (customPath && customPath !== defaultPath) {
                        const validation = await this.validatePath(customPath);
                        if (validation.isValid) {
                            await this.setDataPath(customPath, { migrateData: true });
                            return true;
                        } else {
                            await this.platform.ui.showErrorMessage(`路徑無效：${validation.errors.join(', ')}`);
                            return false;
                        }
                    }
                    shouldInitialize = true;
                    shouldMigrate = true;
                } else {
                    return false; // 用戶取消
                }
            }

            if (shouldInitialize) {
                this.currentDataPath = defaultPath;
                await this.saveConfiguration();

                if (shouldMigrate) {
                    await this.migrateInitialData();
                }

                await this.platform.ui.showInformationMessage(
                    `TextBricks 資料位置已初始化：${defaultPath}`
                );
                return true;
            }

            return false;
        } catch (error) {
            this.platform.logError?.(error as Error, 'AutoInitialize');
            await this.platform.ui.showErrorMessage(
                `初始化失敗：${error instanceof Error ? error.message : String(error)}`
            );
            return false;
        }
    }

    /**
     * 獲取當前資料存儲路徑
     */
    async getDataPath(): Promise<string> {
        if (!this.currentDataPath) {
            await this.initialize();
        }
        return this.currentDataPath!;
    }

    /**
     * 獲取指定 scope 的路徑
     */
    async getScopePath(scopeId: string): Promise<string> {
        const dataPath = await this.getDataPath();
        return path.join(dataPath, 'scopes', scopeId);
    }

    /**
     * 設置新的資料存儲路徑
     */
    async setDataPath(newPath: string, options?: {
        migrateData?: boolean,
        createBackup?: boolean
    }): Promise<DataMigrationResult> {
        const validation = await this.validatePath(newPath);
        if (!validation.isValid) {
            throw new Error(`Invalid path: ${validation.errors.join(', ')}`);
        }

        const oldPath = this.currentDataPath;
        const shouldMigrate = options?.migrateData && oldPath && oldPath !== newPath;

        let migrationResult: DataMigrationResult = {
            success: true,
            sourceLocation: oldPath || '',
            targetLocation: newPath,
            migratedFiles: 0,
            totalFiles: 0,
            duration: 0,
            errors: [],
            warnings: []
        };

        if (shouldMigrate) {
            migrationResult = await this.migrateData(oldPath!, newPath);
            if (!migrationResult.success) {
                throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
            }
        }

        this.currentDataPath = newPath;
        await this.saveConfiguration();
        await this.notifyPathChanged(oldPath, newPath);

        return migrationResult;
    }

    /**
     * 獲取系統預設路徑
     */
    getSystemDefaultPath(): string {
        switch (process.platform) {
            case 'darwin':
                return path.join(os.homedir(), 'Library/Application Support/TextBricks');
            case 'win32':
                return path.join(os.homedir(), 'AppData/Roaming/TextBricks');
            case 'linux':
                return path.join(os.homedir(), '.config/TextBricks');
            default:
                return path.join(os.homedir(), '.textbricks');
        }
    }

    /**
     * 獲取可用的存儲位置選項
     */
    async getAvailableLocations(): Promise<DataLocationOption[]> {
        const options: DataLocationOption[] = [];

        // 系統預設位置
        const systemPath = this.getSystemDefaultPath();
        const systemValidation = await this.validatePath(systemPath);
        options.push({
            id: 'system',
            name: '系統預設位置',
            description: `使用作業系統標準應用程式資料目錄`,
            path: systemPath,
            type: 'system',
            recommended: true,
            available: systemValidation.isValid,
            migrationRequired: this.currentDataPath !== systemPath
        });

        // VS Code 全域存儲 - 使用 VS Code 特定的 API
        try {
            // 檢查是否為 VS Code 環境並獲取路徑
            if (typeof (this.platform as any).getGlobalStoragePath === 'function') {
                const vscodeGlobalPath = (this.platform as any).getGlobalStoragePath();
                if (vscodeGlobalPath) {
                    const vscodeValidation = await this.validatePath(vscodeGlobalPath);
                    options.push({
                        id: 'vscode-global',
                        name: 'VS Code 全域存儲',
                        description: 'VS Code 擴展全域存儲目錄',
                        path: vscodeGlobalPath,
                        type: 'vscode',
                        recommended: false,
                        available: vscodeValidation.isValid,
                        migrationRequired: this.currentDataPath !== vscodeGlobalPath
                    });
                }
            }
        } catch (error) {
            // VS Code 路徑不可用
        }

        // 工作區本地存儲
        try {
            if (typeof (this.platform as any).getWorkspaceStoragePath === 'function') {
                const workspacePath = (this.platform as any).getWorkspaceStoragePath();
                if (workspacePath) {
                    const workspaceValidation = await this.validatePath(workspacePath);
                    options.push({
                        id: 'workspace',
                        name: '工作區本地存儲',
                        description: '存儲在當前工作區目錄中',
                        path: workspacePath,
                        type: 'workspace',
                        recommended: false,
                        available: workspaceValidation.isValid,
                        migrationRequired: this.currentDataPath !== workspacePath
                    });
                }
            }
        } catch (error) {
            // 工作區路徑不可用
        }

        return options;
    }

    /**
     * 驗證路徑是否有效
     */
    async validatePath(targetPath: string): Promise<DataLocationValidation> {
        const validation: DataLocationValidation = {
            isValid: false,
            path: targetPath,
            exists: false,
            isWritable: false,
            hasPermission: false,
            hasSpace: false,
            requiredSpace: 0,
            availableSpace: 0,
            errors: [],
            warnings: []
        };

        try {
            const { promises: fs, constants } = await import('fs');
            const { dirname } = await import('path');

            // 檢查父目錄是否存在
            const parentDir = dirname(targetPath);
            try {
                await fs.access(parentDir, constants.F_OK);
                validation.exists = true;
            } catch {
                validation.errors.push('父目錄不存在');
                return validation;
            }

            // 檢查寫入權限
            try {
                await fs.access(parentDir, constants.W_OK);
                validation.hasPermission = true;
            } catch {
                validation.errors.push('沒有寫入權限');
                return validation;
            }

            // 檢查目標路徑
            try {
                await fs.access(targetPath, constants.F_OK);
                validation.exists = true;

                // 檢查是否可寫
                try {
                    await fs.access(targetPath, constants.W_OK);
                    validation.isWritable = true;
                } catch {
                    validation.errors.push('目標路徑不可寫');
                }
            } catch {
                // 路徑不存在，但父目錄可寫，這是OK的
                validation.isWritable = true;
            }

            // 檢查磁碟空間 - 暫時跳過，因為 Node.js 沒有內建的 statfs
            validation.requiredSpace = 10 * 1024 * 1024; // 至少需要 10MB
            validation.availableSpace = validation.requiredSpace * 10; // 假設有足夠空間
            validation.hasSpace = true;
            validation.warnings.push('無法檢查磁碟空間');

            validation.isValid = validation.hasPermission &&
                                validation.isWritable &&
                                validation.hasSpace;

        } catch (error) {
            validation.errors.push(`驗證失敗: ${error instanceof Error ? error.message : String(error)}`);
        }

        return validation;
    }

    /**
     * 獲取當前位置的統計資訊
     */
    async getCurrentLocationInfo(): Promise<DataLocationInfo> {
        const currentPath = await this.getDataPath();
        const stats = await this.getLocationStats(currentPath);

        return {
            id: 'current',
            name: '當前位置',
            path: currentPath,
            type: this.getLocationTypeFromPath(currentPath),
            isDefault: currentPath === this.getSystemDefaultPath(),
            isActive: true,
            size: stats.totalSize,
            freeSpace: stats.freeSpace,
            lastAccessed: new Date(),
            scopes: await this.getScopesList(currentPath)
        };
    }

    /**
     * 重設為系統預設位置
     */
    async resetToSystemDefault(): Promise<DataMigrationResult> {
        const systemPath = this.getSystemDefaultPath();
        return this.setDataPath(systemPath, { migrateData: true, createBackup: true });
    }

    /**
     * 打開資料位置資料夾
     */
    async openDataLocation(): Promise<void> {
        const dataPath = await this.getDataPath();
        // 使用 VS Code 特定的方法打開外部位置
        if (typeof (this.platform as any).openExternal === 'function') {
            const { Uri } = await import('vscode');
            await (this.platform as any).openExternal(Uri.file(dataPath));
        } else {
            this.platform.logInfo?.(`Data location: ${dataPath}`);
        }
    }

    // ==================== 私有方法 ====================

    /**
     * 載入配置
     */
    private async loadConfiguration(): Promise<void> {
        try {
            // 從 VS Code 配置讀取
            if (typeof (this.platform as any).getWorkspaceConfiguration === 'function') {
                const vscodeConfig = (this.platform as any).getWorkspaceConfiguration('textbricks');
                if (vscodeConfig) {
                    const customPath = vscodeConfig.get('dataLocation') as string;
                    const useSystemDefault = vscodeConfig.get('useSystemDefault') as boolean;

                    if (!useSystemDefault && customPath) {
                        this.currentDataPath = customPath;
                    } else {
                        this.currentDataPath = this.getSystemDefaultPath();
                    }
                } else {
                    this.currentDataPath = this.getSystemDefaultPath();
                }
            } else {
                this.currentDataPath = this.getSystemDefaultPath();
            }
        } catch (error) {
            this.platform.logError?.(error as Error, 'DataPathService.loadConfiguration');
            this.currentDataPath = this.getSystemDefaultPath();
        }
    }

    /**
     * 儲存配置到全局設定
     */
    private async saveConfiguration(): Promise<void> {
        try {
            if (typeof (this.platform as any).getWorkspaceConfiguration === 'function' && this.currentDataPath) {
                const vscodeConfig = (this.platform as any).getWorkspaceConfiguration('textbricks');
                if (vscodeConfig && typeof vscodeConfig.update === 'function') {
                    const systemDefault = this.getSystemDefaultPath();

                    // 使用全局配置目標 (ConfigurationTarget.Global = 1)
                    const globalTarget = 1; // vscode.ConfigurationTarget.Global

                    if (this.currentDataPath === systemDefault) {
                        await vscodeConfig.update('useSystemDefault', true, globalTarget);
                        await vscodeConfig.update('dataLocation', '', globalTarget);
                    } else {
                        await vscodeConfig.update('useSystemDefault', false, globalTarget);
                        await vscodeConfig.update('dataLocation', this.currentDataPath, globalTarget);
                    }

                    this.platform.logInfo?.(`Saved global configuration: dataLocation=${this.currentDataPath}, useSystemDefault=${this.currentDataPath === systemDefault}`);
                }
            }
        } catch (error) {
            this.platform.logError?.(error as Error, 'DataPathService.saveConfiguration');
        }
    }

    /**
     * 檢查指定路徑是否已有 TextBricks 資料
     */
    private async checkExistingData(dataPath: string): Promise<boolean> {
        try {
            const { access, constants, stat } = await import('fs/promises');

            // 檢查基本目錄結構
            await access(dataPath, constants.F_OK);

            // 檢查 scopes 目錄
            const scopesPath = path.join(dataPath, 'scopes');
            try {
                await access(scopesPath, constants.F_OK);
                const scopesStat = await stat(scopesPath);
                if (!scopesStat.isDirectory()) {
                    return false;
                }
            } catch {
                return false;
            }

            // 檢查 local scope
            const localScopePath = path.join(scopesPath, 'local');
            try {
                await access(localScopePath, constants.F_OK);
                const localStat = await stat(localScopePath);
                if (!localStat.isDirectory()) {
                    return false;
                }
            } catch {
                return false;
            }

            // 檢查是否有任何模板資料（至少要有一個語言目錄）
            const { readdir } = await import('fs/promises');
            const localContents = await readdir(localScopePath);
            const hasLanguageDirs = localContents.some(item =>
                !item.startsWith('.') && item !== 'README.md'
            );

            return hasLanguageDirs;
        } catch {
            return false;
        }
    }

    /**
     * 初始化預設路徑
     */
    private async initializeDefaultPath(): Promise<void> {
        this.currentDataPath = this.getSystemDefaultPath();

        // 確保目錄存在
        try {
            const { promises: fs } = await import('fs');
            await fs.mkdir(this.currentDataPath, { recursive: true });
            await fs.mkdir(path.join(this.currentDataPath, 'scopes'), { recursive: true });

            // 創建默認的 local scope 目錄
            const localScopePath = path.join(this.currentDataPath, 'scopes', 'local');
            await fs.mkdir(localScopePath, { recursive: true });

            // 如果存在舊的 data/local 資料，嘗試從擴展目錄複製
            await this.migrateInitialData();
        } catch (error) {
            this.platform.logError?.(error as Error, 'DataPathService.initializeDefaultPath');
        }
    }

    /**
     * 遷移初始資料（從項目的 data/local 到新位置）
     */
    private async migrateInitialData(): Promise<void> {
        try {
            // 獲取擴展路徑
            const extensionPath = typeof (this.platform as any).getExtensionPath === 'function'
                ? (this.platform as any).getExtensionPath()
                : (this.platform as any).getExtensionContext?.()?.extensionPath;

            if (!extensionPath || !this.currentDataPath) {
                return;
            }

            const { promises: fs } = await import('fs');

            // 在開發模式下，extensionPath 通常是 packages/vscode/dist
            // 我們需要找到項目根目錄的 data/local
            let projectRootDataPath = path.join(extensionPath, '..', '..', '..', 'data', 'local');

            // 如果上面的路徑不存在，嘗試其他可能的路徑
            try {
                await fs.access(projectRootDataPath);
            } catch {
                // 嘗試從 packages/vscode 向上查找
                projectRootDataPath = path.join(extensionPath, '..', '..', 'data', 'local');
                try {
                    await fs.access(projectRootDataPath);
                } catch {
                    // 最後嘗試相對於當前目錄
                    projectRootDataPath = path.resolve(process.cwd(), 'data', 'local');
                }
            }

            // 檢查打包後的 data/local（發布模式）
            const distDataPath = path.join(extensionPath, 'data', 'local');

            const newLocalScopePath = path.join(this.currentDataPath, 'scopes', 'local');

            // 先嘗試項目根目錄的資料（開發模式）
            let sourceDataPath = projectRootDataPath;
            try {
                await fs.access(projectRootDataPath);
                this.platform.logInfo?.(`Found development data at ${projectRootDataPath}`);
            } catch {
                // 如果開發資料不存在，嘗試發布資料
                try {
                    await fs.access(distDataPath);
                    sourceDataPath = distDataPath;
                    this.platform.logInfo?.(`Found distribution data at ${distDataPath}`);
                } catch {
                    // 兩個都不存在，這是正常的新安裝
                    this.platform.logInfo?.('No existing data found, starting fresh');
                    return;
                }
            }

            // 檢查新位置是否已經有資料
            try {
                const newDirContents = await fs.readdir(newLocalScopePath);
                if (newDirContents.length === 0) {
                    // 複製資料到新位置
                    const migrationResult = {
                        success: false,
                        sourceLocation: sourceDataPath,
                        targetLocation: newLocalScopePath,
                        migratedFiles: 0,
                        totalFiles: 0,
                        duration: 0,
                        errors: [],
                        warnings: []
                    };

                    await this.copyDirectory(sourceDataPath, newLocalScopePath, migrationResult);
                    this.platform.logInfo?.(`Migrated initial data from ${sourceDataPath} to ${newLocalScopePath}. Files: ${migrationResult.migratedFiles}`);
                }
            } catch {
                // 新目錄讀取失敗，可能需要重新創建
                await fs.mkdir(newLocalScopePath, { recursive: true });
            }
        } catch (error) {
            this.platform.logError?.(error as Error, 'DataPathService.migrateInitialData');
        }
    }

    /**
     * 遷移資料
     */
    private async migrateData(fromPath: string, toPath: string): Promise<DataMigrationResult> {
        const startTime = Date.now();
        const result: DataMigrationResult = {
            success: false,
            sourceLocation: fromPath,
            targetLocation: toPath,
            migratedFiles: 0,
            totalFiles: 0,
            duration: 0,
            errors: [],
            warnings: []
        };

        try {
            const { promises: fs } = await import('fs');

            // 確保目標目錄存在
            await fs.mkdir(toPath, { recursive: true });

            // 複製檔案
            await this.copyDirectory(fromPath, toPath, result);

            result.success = result.errors.length === 0;
            result.duration = Date.now() - startTime;

        } catch (error) {
            result.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
        }

        return result;
    }

    /**
     * 複製目錄
     */
    private async copyDirectory(source: string, target: string, result: DataMigrationResult): Promise<void> {
        const { promises: fs } = await import('fs');

        try {
            const entries = await fs.readdir(source, { withFileTypes: true });

            for (const entry of entries) {
                const sourcePath = path.join(source, entry.name);
                const targetPath = path.join(target, entry.name);

                try {
                    if (entry.isDirectory()) {
                        await fs.mkdir(targetPath, { recursive: true });
                        await this.copyDirectory(sourcePath, targetPath, result);
                    } else {
                        await fs.copyFile(sourcePath, targetPath);
                        result.migratedFiles++;
                    }
                    result.totalFiles++;
                } catch (error) {
                    result.errors.push(`Failed to copy ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        } catch (error) {
            result.errors.push(`Failed to read directory ${source}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 獲取位置統計資訊
     */
    private async getLocationStats(locationPath: string): Promise<DataLocationStats> {
        const stats: DataLocationStats = {
            totalSize: 0,
            usedSpace: 0,
            freeSpace: 0,
            scopesCount: 0,
            templatesCount: 0,
            topicsCount: 0
        };

        try {
            const { promises: fs } = await import('fs');

            // 計算目錄大小
            stats.totalSize = await this.getDirectorySize(locationPath);
            stats.usedSpace = stats.totalSize;

            // 計算可用空間 - 暫時使用預設值，因為 Node.js 沒有內建的 statfs
            stats.freeSpace = 1024 * 1024 * 1024; // 假設有 1GB 可用空間

            // 計算 scopes 數量
            const scopesPath = path.join(locationPath, 'scopes');
            try {
                const scopes = await fs.readdir(scopesPath);
                stats.scopesCount = scopes.length;
            } catch {
                stats.scopesCount = 0;
            }

        } catch (error) {
            this.platform.logError?.(error as Error, 'DataPathService.getLocationStats');
        }

        return stats;
    }

    /**
     * 計算目錄大小
     */
    private async getDirectorySize(dirPath: string): Promise<number> {
        let totalSize = 0;

        try {
            const { promises: fs } = await import('fs');
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    totalSize += await this.getDirectorySize(entryPath);
                } else {
                    const stats = await fs.stat(entryPath);
                    totalSize += stats.size;
                }
            }
        } catch {
            // 忽略錯誤
        }

        return totalSize;
    }

    /**
     * 獲取 scopes 列表
     */
    private async getScopesList(locationPath: string): Promise<string[]> {
        try {
            const { promises: fs } = await import('fs');
            const scopesPath = path.join(locationPath, 'scopes');

            // 檢查 scopes 目錄是否存在
            try {
                await fs.access(scopesPath);
            } catch {
                // 如果 scopes 目錄不存在，創建它並返回默認 scope
                await fs.mkdir(scopesPath, { recursive: true });
                return ['local'];
            }

            const entries = await fs.readdir(scopesPath, { withFileTypes: true });
            const scopes = entries
                .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
                .map(entry => entry.name);

            // 如果沒有找到任何 scope，返回默認的 local scope
            return scopes.length > 0 ? scopes : ['local'];
        } catch (error) {
            this.platform.logError?.(error as Error, 'DataPathService.getScopesList');
            return ['local'];
        }
    }

    /**
     * 從路徑判斷位置類型
     */
    private getLocationTypeFromPath(path: string): 'vscode' | 'system' | 'custom' | 'workspace' {
        const systemPath = this.getSystemDefaultPath();
        if (path === systemPath) {
            return 'system';
        }

        if (path.includes('vscode') || path.includes('Code')) {
            return 'vscode';
        }

        if (path.includes('workspace') || path.includes('.vscode')) {
            return 'workspace';
        }

        return 'custom';
    }

    /**
     * 通知路徑變更
     */
    private async notifyPathChanged(oldPath: string | null, newPath: string): Promise<void> {
        try {
            // 這裡可以發送事件給其他服務
            this.platform.logInfo?.(`Data path changed from ${oldPath} to ${newPath}`);
        } catch (error) {
            this.platform.logError?.(error as Error, 'DataPathService.notifyPathChanged');
        }
    }
}