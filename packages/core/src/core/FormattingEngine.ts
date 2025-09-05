import { ExtendedTemplate } from '@textbricks/shared';

/**
 * 統一的格式化引擎 - 整合原本散佈在 TemplateManager 中的多個格式化方法
 * 負責處理程式碼縮排、模板格式化和代碼片段格式化
 */
export class FormattingEngine {
    
    /**
     * 格式化模板程式碼
     */
    formatTemplate(template: ExtendedTemplate, targetIndentation?: string): string {
        if (!targetIndentation || targetIndentation.length === 0) {
            return template.code;
        }
        
        const lines = template.code.split('\n');
        
        const formattedLines = lines.map((line, index) => {
            if (line.trim().length === 0) {
                return '';
            }
            
            if (index === 0) {
                return line.trim();
            } else {
                const match = line.match(/^(\s*)/);
                const originalIndent = match ? match[1] : '';
                return targetIndentation + originalIndent + line.trim();
            }
        });
        
        const result = formattedLines.join('\n');
        return result;
    }

    /**
     * 格式化程式碼片段（可選模板輔助）
     */
    formatCodeSnippet(code: string, template?: ExtendedTemplate, targetIndentation?: string): string {
        if (targetIndentation === undefined) {
            return code;
        }

        // 如果有模板輔助，使用進階格式化
        if (template) {
            return this.formatCodeSnippetWithTemplate(code, template, targetIndentation);
        }

        // 否則使用基本格式化
        return this.formatCodeSnippetBasic(code, targetIndentation);
    }

    /**
     * 基本的程式碼片段格式化
     */
    private formatCodeSnippetBasic(code: string, targetIndentation: string): string {
        const lines = code.split('\n');
        if (lines.length === 0) {
            return code;
        }
        
        // 分析原始代碼的縮排結構
        const nonEmptyLines = lines
            .map((line, index) => ({ line, index, indent: line.match(/^(\s*)/)?.[1] || '' }))
            .filter(({ line }) => line.trim().length > 0);
            
        if (nonEmptyLines.length === 0) {
            return code;
        }
        
        // 找到最小縮排作為基準線
        const minIndent = Math.min(...nonEmptyLines.map(({ indent }) => indent.length));
        
        // 確定縮排單位
        const indentUnit = targetIndentation.includes('\t') ? '\t' : 
                          (targetIndentation.length > 0 ? ' '.repeat(targetIndentation.length) : '    ');
        const indentUnitLength = indentUnit === '\t' ? 1 : indentUnit.length;
        
        const formattedLines = lines.map((line, index) => {
            if (line.trim().length === 0) {
                return '';
            }
            
            const currentIndent = line.match(/^(\s*)/)?.[1] || '';
            const relativeIndent = currentIndent.length - minIndent;
            
            // 第一個非空行作為基準（不添加目標縮排）
            if (index === nonEmptyLines[0].index) {
                return line.trim();
            }
            
            // 如果所有行都沒有相對縮排差異，則所有非第一行的行都使用目標縮排
            const hasRelativeIndentation = nonEmptyLines.some(({ indent }) => indent.length !== minIndent);
            
            if (!hasRelativeIndentation) {
                // 所有行都在同一層級，非第一行使用目標縮排
                return targetIndentation + line.trim();
            }
            
            // 有相對縮排差異，計算額外縮排層級
            const extraIndentLevels = Math.max(0, Math.floor(relativeIndent / indentUnitLength));
            const extraIndent = indentUnit.repeat(extraIndentLevels);
            
            return targetIndentation + extraIndent + line.trim();
        });
        
        return formattedLines.join('\n');
    }

    /**
     * 使用模板輔助的程式碼片段格式化
     */
    private formatCodeSnippetWithTemplate(code: string, template: ExtendedTemplate, targetIndentation: string): string {
        // 分析模板的縮排資訊
        const fullTemplateIndentInfo = this.analyzeIndentation(template.code);
        const baseIndentLevel = this.findBaseIndentLevel(fullTemplateIndentInfo);

        // 分析代碼片段的縮排
        const snippetLines = code.split('\n');
        let snippetIndentInfo = this.analyzeIndentation(code);
        
        // 嘗試從模板中恢復丟失的縮排資訊
        const templateLines = template.code.split('\n');
        for (let i = 0; i < snippetLines.length; i++) {
            const snippetLine = snippetLines[i].trim();
            if (snippetLine && snippetIndentInfo[i] === 0) {
                // 在模板中查找匹配的行
                for (let j = 0; j < templateLines.length; j++) {
                    if (templateLines[j].trim() === snippetLine) {
                        const originalIndent = fullTemplateIndentInfo[j];
                        snippetIndentInfo[i] = originalIndent;
                        break;
                    }
                }
            }
        }

        // 檢查片段內的一致性
        const nonEmptyIndents = snippetIndentInfo.filter((indent, i) => snippetLines[i].trim().length > 0);
        const allLinesAtSameLevel = nonEmptyIndents.length > 1 && nonEmptyIndents.every(indent => indent === nonEmptyIndents[0]);

        // 處理每一行
        const formattedLines = snippetLines.map((line, index) => {
            if (line.trim().length === 0) {
                return '';
            }

            const originalIndent = snippetIndentInfo[index];
            let finalIndent = '';
            
            // 如果所有行都在同一層級，統一處理
            if (allLinesAtSameLevel) {
                if (index === 0) {
                    return line.trim();
                } else {
                    return targetIndentation + line.trim();
                }
            } else if (originalIndent === 0) {
                // 沒有縮排的行
                const firstLineIndent = snippetIndentInfo[0];
                if (index === 0) {
                    // 第一行不添加目標縮排
                    return line.trim();
                } else if (originalIndent === firstLineIndent) {
                    // 與第一行同層級的行，使用目標縮排
                    return targetIndentation + line.trim();
                } else {
                    // 其他情況，保持原樣
                    return line.trim();
                }
            } else if (originalIndent === baseIndentLevel) {
                // 基準層級的行
                if (index === 0) {
                    return line.trim();
                } else {
                    // 計算相對於第一行的縮排差異
                    const firstLineIndent = snippetIndentInfo[0];
                    const relativeIndent = originalIndent - firstLineIndent;
                    
                    if (relativeIndent > 0) {
                        // 有相對縮排，在目標縮排基礎上保持這個差異
                        const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
                        const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
                        const indentLevels = Math.floor(relativeIndent / indentMultiplier);
                        finalIndent = targetIndentation + indentUnit.repeat(indentLevels);
                    } else {
                        // 沒有相對縮排差異，使用目標縮排
                        finalIndent = targetIndentation;
                    }
                }
            } else if (originalIndent > baseIndentLevel) {
                // 額外縮排的行
                const extraIndent = originalIndent - baseIndentLevel;
                const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
                const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
                const extraLevels = Math.floor(extraIndent / indentMultiplier);
                finalIndent = targetIndentation + indentUnit.repeat(extraLevels);
            } else {
                // 比基準層級少縮排
                return line.trim();
            }
            
            return finalIndent + line.trim();
        });
        
        return formattedLines.join('\n');
    }

    /**
     * 分析程式碼的縮排資訊
     */
    private analyzeIndentation(code: string): number[] {
        const lines = code.split('\n');
        const indentations: number[] = [];
        
        for (const line of lines) {
            if (line.trim().length === 0) {
                indentations.push(0);
            } else {
                const match = line.match(/^(\s*)/);
                indentations.push(match ? match[1].length : 0);
            }
        }
        
        return indentations;
    }

    /**
     * 找到程式碼中的基準縮排層級
     */
    private findBaseIndentLevel(indentInfo: number[]): number {
        const nonZeroIndents = indentInfo.filter(indent => indent > 0);
        return nonZeroIndents.length > 0 ? Math.min(...nonZeroIndents) : 0;
    }

    /**
     * 檢測程式碼中使用的縮排單位
     */
    private detectIndentUnit(code: string): string {
        const lines = code.split('\n');
        const indentedLines = lines.filter(line => line.match(/^\s+/) && line.trim().length > 0);
        
        if (indentedLines.length === 0) {
            return '    ';
        }
        
        const hasTab = indentedLines.some(line => line.startsWith('\t'));
        if (hasTab) {
            return '\t';
        }
        
        const spaceCounts = indentedLines.map(line => {
            const match = line.match(/^( +)/);
            return match ? match[1].length : 0;
        }).filter(count => count > 0);
        
        if (spaceCounts.length === 0) {
            return '    ';
        }
        
        const minSpaces = Math.min(...spaceCounts);
        const possibleUnits = [2, 3, 4, 8];
        
        for (const unit of possibleUnits) {
            if (minSpaces % unit === 0 && spaceCounts.every(count => count % unit === 0)) {
                return ' '.repeat(unit);
            }
        }
        
        return '    ';
    }
}