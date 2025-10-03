/**
 * 資料位置管理相關的模型定義
 */

export interface DataLocationInfo {
    id: string;
    name: string;
    path: string;
    type: 'vscode' | 'system' | 'custom' | 'workspace';
    isDefault: boolean;
    isActive: boolean;
    size: number;
    freeSpace: number;
    lastAccessed: Date;
    scopes: string[];  // 包含的 scope ID 列表
}

export interface DataLocationOption {
    id: string;
    name: string;
    description: string;
    path: string;
    type: 'vscode' | 'system' | 'custom' | 'workspace';
    recommended: boolean;
    available: boolean;
    migrationRequired: boolean;
    estimatedMigrationTime?: number; // 預估遷移時間（秒）
}

export interface DataMigrationResult {
    success: boolean;
    sourceLocation: string;
    targetLocation: string;
    migratedFiles: number;
    totalFiles: number;
    duration: number; // 遷移耗時（毫秒）
    errors: string[];
    warnings: string[];
}

export interface DataLocationValidation {
    isValid: boolean;
    path: string;
    exists: boolean;
    isWritable: boolean;
    hasPermission: boolean;
    hasSpace: boolean;
    requiredSpace: number;
    availableSpace: number;
    errors: string[];
    warnings: string[];
}

export interface DataLocationConfig {
    currentLocation: string;
    useSystemDefault: boolean;
    customLocation?: string;
    autoBackup: boolean;
    backupLocation?: string;
    migrationHistory: DataMigrationRecord[];
}

export interface DataMigrationRecord {
    id: string;
    fromLocation: string;
    toLocation: string;
    timestamp: Date;
    duration: number;
    filesCount: number;
    success: boolean;
    errors?: string[];
}

export interface DataLocationStats {
    totalSize: number;
    usedSpace: number;
    freeSpace: number;
    scopesCount: number;
    templatesCount: number;
    topicsCount: number;
    lastBackup?: Date;
    lastMigration?: Date;
}

export type DataLocationEventType =
    | 'location_changed'
    | 'migration_started'
    | 'migration_completed'
    | 'migration_failed'
    | 'validation_failed'
    | 'backup_created'
    | 'space_warning';

export interface DataLocationEvent {
    type: DataLocationEventType;
    timestamp: Date;
    data: unknown;
    message?: string;
}