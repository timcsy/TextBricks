import * as vscode from 'vscode';
import * as path from 'path';
import { ProgrammingContext, ExtendedTemplate, ContextualRecommendation } from '../models/Template';

/**
 * 上下文分析服務
 * 負責分析編程環境、代碼模式和用戶行為，為模板推薦提供智能分析
 * 
 * 這個服務將來可以擴展為：
 * - 機器學習驅動的代碼模式識別
 * - 用戶行為學習和個性化推薦
 * - 項目結構分析和框架檢測
 * - 實時代碼上下文理解
 */
export class ContextAnalysisService {
    private context: vscode.ExtensionContext;
    private patternCache: Map<string, any> = new Map(); // 代碼模式緩存
    private userBehaviorHistory: any[] = []; // 用戶行為歷史

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.initializeService();
    }

    private initializeService() {
        // TODO: 初始化機器學習模型、載入訓練數據等
        console.log('Context Analysis Service initialized');
    }

    // === 核心分析功能 ===

    /**
     * 分析當前編程上下文，計算模板相關性分數
     */
    async analyzeContext(context: ProgrammingContext): Promise<{
        projectTypeScore: number;
        frameworkRelevance: number;
        skillLevelMatch: number;
        codePatternMatch: number;
        recentActivityScore: number;
    }> {
        return {
            projectTypeScore: await this.analyzeProjectType(context),
            frameworkRelevance: await this.analyzeFramework(context),
            skillLevelMatch: this.analyzeSkillLevel(context),
            codePatternMatch: await this.analyzeCodePatterns(context),
            recentActivityScore: this.analyzeRecentActivity(context)
        };
    }

    /**
     * 基於上下文為模板計算智能推薦分數
     */
    async calculateContextualScore(
        template: ExtendedTemplate, 
        context: ProgrammingContext
    ): Promise<number> {
        const analysis = await this.analyzeContext(context);
        
        // 基礎權重分配
        let score = 0;
        
        // 1. 語言匹配 (30%)
        if (context.currentFile?.language === template.language) {
            score += 30;
        }
        
        // 2. 項目類型相關性 (20%)
        score += analysis.projectTypeScore * 20;
        
        // 3. 框架相關性 (15%)
        score += analysis.frameworkRelevance * 15;
        
        // 4. 技能等級匹配 (15%)
        score += analysis.skillLevelMatch * 15;
        
        // 5. 代碼模式匹配 (10%)
        score += analysis.codePatternMatch * 10;
        
        // 6. 最近活動相關性 (10%)
        score += analysis.recentActivityScore * 10;
        
        return Math.min(Math.max(score, 0), 100);
    }

    /**
     * 生成推薦理由說明
     */
    async generateRecommendationReasons(
        template: ExtendedTemplate,
        context: ProgrammingContext
    ): Promise<string[]> {
        const reasons: string[] = [];
        const analysis = await this.analyzeContext(context);
        
        // 基於分析結果生成具體理由
        if (context.currentFile?.language === template.language) {
            reasons.push(`符合當前 ${template.language.toUpperCase()} 檔案`);
        }
        
        if (analysis.projectTypeScore > 0.7) {
            reasons.push(`適用於您的項目類型`);
        }
        
        if (analysis.frameworkRelevance > 0.7) {
            reasons.push(`與您使用的框架相關`);
        }
        
        if (analysis.skillLevelMatch > 0.8) {
            reasons.push(`符合您的技能等級`);
        }
        
        if (analysis.codePatternMatch > 0.6) {
            reasons.push(`與您最近的編程模式匹配`);
        }
        
        if (analysis.recentActivityScore > 0.5) {
            reasons.push(`與您最近的編程活動相關`);
        }
        
        return reasons;
    }

    // === 具體分析方法 (預留實現) ===

    private async analyzeProjectType(context: ProgrammingContext): Promise<number> {
        // TODO: 分析項目類型相關性
        // 例如：Web 項目推薦前端模板，桌面應用推薦 GUI 模板等
        
        if (!context.project) return 0;
        
        // 簡化的項目類型分析
        const projectTypeScore = {
            'web': 0.8,
            'desktop': 0.6,
            'mobile': 0.7,
            'library': 0.5,
            'script': 0.4,
            'unknown': 0.3
        };
        
        return projectTypeScore[context.project.type] || 0;
    }

    private async analyzeFramework(context: ProgrammingContext): Promise<number> {
        // TODO: 分析框架相關性
        // React 項目推薦 React 相關模板，Express 項目推薦 API 模板等
        
        if (!context.project?.framework) return 0;
        
        // TODO: 實現框架特定的模板推薦邏輯
        return 0.5; // 暫時返回中等相關性
    }

    private analyzeSkillLevel(context: ProgrammingContext): number {
        // TODO: 分析技能等級匹配度
        // 基於用戶的模板使用歷史、代碼複雜度等推斷技能等級
        
        if (!context.skillLevel || context.skillLevel.length === 0) {
            return 0.5; // 默認中等匹配度
        }
        
        // 簡化的技能等級分析
        const averageProgress = context.skillLevel.reduce(
            (sum, skill) => sum + (skill.estimatedProgress || 0), 0
        ) / context.skillLevel.length;
        
        return averageProgress / 100; // 轉換為 0-1 分數
    }

    private async analyzeCodePatterns(context: ProgrammingContext): Promise<number> {
        // TODO: 分析代碼模式匹配
        // 使用機器學習檢測代碼中的模式，推薦相關模板
        // 例如：檢測到循環模式推薦循環相關模板，檢測到 API 調用推薦網絡相關模板
        
        if (!context.cursor?.surroundingCode) return 0;
        
        const code = context.cursor.surroundingCode;
        let patternScore = 0;
        
        // 簡單的模式檢測
        if (code.includes('for') || code.includes('while')) {
            patternScore += 0.3; // 檢測到循環模式
        }
        
        if (code.includes('if') || code.includes('else')) {
            patternScore += 0.2; // 檢測到條件模式
        }
        
        if (code.includes('function') || code.includes('def')) {
            patternScore += 0.4; // 檢測到函數定義模式
        }
        
        if (code.includes('class')) {
            patternScore += 0.5; // 檢測到類定義模式
        }
        
        return Math.min(patternScore, 1.0);
    }

    private analyzeRecentActivity(context: ProgrammingContext): number {
        // TODO: 分析最近活動相關性
        // 基於最近編輯的檔案、執行的命令等推斷用戶當前的編程意圖
        
        if (!context.recentActivity) return 0;
        
        const activity = context.recentActivity;
        let activityScore = 0;
        
        // 基於最近檔案活動評分
        if (activity.recentFiles && activity.recentFiles.length > 0) {
            activityScore += 0.3;
        }
        
        // 基於編程模式評分
        if (activity.editingPatterns && activity.editingPatterns.length > 0) {
            activityScore += 0.4;
        }
        
        // 基於搜索歷史評分
        if (activity.recentSearch && activity.recentSearch.length > 0) {
            activityScore += 0.2;
        }
        
        return Math.min(activityScore, 1.0);
    }

    // === 機器學習和數據分析方法 (預留) ===

    /**
     * 記錄用戶行為以供機器學習使用
     */
    recordUserBehavior(event: {
        type: 'template_used' | 'template_rejected' | 'context_change';
        templateId?: string;
        context: ProgrammingContext;
        timestamp: Date;
        outcome?: 'successful' | 'failed' | 'cancelled';
    }) {
        // TODO: 記錄用戶行為數據，用於改進推薦算法
        this.userBehaviorHistory.push(event);
        
        // 限制歷史記錄大小
        if (this.userBehaviorHistory.length > 1000) {
            this.userBehaviorHistory.shift();
        }
        
        // 持久化到 VS Code 存儲
        this.context.globalState.update('userBehaviorHistory', this.userBehaviorHistory);
    }

    /**
     * 訓練和更新推薦模型
     */
    async updateRecommendationModel() {
        // TODO: 實現機器學習模型更新
        // 可以使用 TensorFlow.js 或其他 JavaScript ML 庫
        // 基於用戶行為歷史改進推薦準確性
    }

    /**
     * 預測用戶下一步可能需要的模板
     */
    async predictNextTemplates(context: ProgrammingContext, limit: number = 3): Promise<string[]> {
        // TODO: 實現基於上下文的模板預測
        // 使用序列模型預測用戶接下來可能使用的模板
        return [];
    }

    // === 性能優化方法 ===

    /**
     * 緩存代碼模式分析結果
     */
    private cachePattern(code: string, patterns: any) {
        const cacheKey = this.hashCode(code);
        this.patternCache.set(cacheKey, {
            patterns,
            timestamp: Date.now(),
            expires: Date.now() + 5 * 60 * 1000 // 5分鐘過期
        });
    }

    /**
     * 獲取緩存的模式分析結果
     */
    private getCachedPattern(code: string): any | null {
        const cacheKey = this.hashCode(code);
        const cached = this.patternCache.get(cacheKey);
        
        if (cached && cached.expires > Date.now()) {
            return cached.patterns;
        }
        
        // 清理過期的緩存
        this.patternCache.delete(cacheKey);
        return null;
    }

    /**
     * 簡單的字符串哈希函數
     */
    private hashCode(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 轉換為32位整數
        }
        return hash.toString();
    }
}