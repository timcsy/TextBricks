import { ExtendedTemplate } from '../models/Template';

/**
 * 統一的格式化引擎 - 整合原本散佈在 TemplateManager 中的多個格式化方法
 * 負責處理程式碼縮排、模板格式化和代碼片段格式化
 */
export class FormattingEngine {
    
    /**
     * 格式化模板程式碼
     */
    formatTemplate(template: ExtendedTemplate, targetIndentation?: string): string {
        console.log(`[FORMAT TEMPLATE] Template ID: ${template.id}`);
        console.log(`[FORMAT TEMPLATE] Target indentation: "${targetIndentation}" (length: ${targetIndentation?.length || 0})`);
        
        if (!targetIndentation || targetIndentation.length === 0) {
            console.log(`[FORMAT TEMPLATE] No target indentation, returning original`);
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
        console.log(`[FORMAT TEMPLATE] Formatted result:`, JSON.stringify(result));
        return result;
    }

    /**
     * 格式化程式碼片段（可選模板輔助）
     */
    formatCodeSnippet(code: string, template?: ExtendedTemplate, targetIndentation?: string): string {
        if (targetIndentation === undefined) {
            return code;
        }

        console.log(`[SNIPPET] Processing snippet with template assistance`);
        console.log(`[SNIPPET] Code:`, JSON.stringify(code));
        console.log(`[SNIPPET] Target indentation:`, JSON.stringify(targetIndentation));

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
        console.log(`[SNIPPET BASIC] Target indentation: "${targetIndentation}" (length: ${targetIndentation.length})`);
        
        const lines = code.split('\n');
        if (lines.length === 0) {
            return code;
        }
        
        // 找到第一個非空行作為基準
        let firstLineIndex = -1;
        let firstLineIndent = 0;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().length > 0) {
                firstLineIndex = i;
                const match = lines[i].match(/^(\s*)/);
                firstLineIndent = match ? match[1].length : 0;
                break;
            }
        }
        
        console.log(`[SNIPPET BASIC] First line index: ${firstLineIndex}, indentation: ${firstLineIndent}`);
        
        const formattedLines = lines.map((line, index) => {
            if (line.trim().length === 0) {
                return '';
            }
            
            // 第一個非空行：直接使用內容（VS Code會自動添加縮排）
            if (index === firstLineIndex) {
                console.log(`[SNIPPET BASIC] First line: "${line.trim()}" (no extra indent)`);
                return line.trim();
            }
            
            // 計算相對於第一行的縮排差異
            const lineIndent = line.match(/^(\s*)/)?.[1] || '';
            const relativeIndent = lineIndent.length - firstLineIndent;
            
            let finalIndent = '';
            if (relativeIndent > 0) {
                const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
                const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
                const extraLevels = Math.floor(relativeIndent / indentMultiplier);
                finalIndent = indentUnit.repeat(extraLevels);
            } else if (relativeIndent < 0) {
                console.log(`[SNIPPET BASIC] Line ${index}: less indent than first line -> "${line.trim()}"`);
                return line.trim();
            }
            
            const result = finalIndent + line.trim();
            console.log(`[SNIPPET BASIC] Line ${index}: relative indent ${relativeIndent} -> "${result}"`);
            return result;
        });
        
        const finalResult = formattedLines.join('\n');
        console.log(`[SNIPPET BASIC] Final result:\n${finalResult}`);
        return finalResult;
    }

    /**
     * 使用模板輔助的程式碼片段格式化
     */
    private formatCodeSnippetWithTemplate(code: string, template: ExtendedTemplate, targetIndentation: string): string {
        console.log(`[SNIPPET WITH TEMPLATE] ========== PROCESSING SNIPPET ==========`);
        console.log(`[SNIPPET WITH TEMPLATE] Snippet:\n${JSON.stringify(code)}`);
        console.log(`[SNIPPET WITH TEMPLATE] Template:`, JSON.stringify(template.code));
        console.log(`[SNIPPET WITH TEMPLATE] Target indentation:`, JSON.stringify(targetIndentation));

        // 分析模板的縮排資訊
        const fullTemplateIndentInfo = this.analyzeIndentation(template.code);
        const baseIndentLevel = this.findBaseIndentLevel(fullTemplateIndentInfo);
        
        console.log(`[SNIPPET WITH TEMPLATE] Template indent info:`, fullTemplateIndentInfo);
        console.log(`[SNIPPET WITH TEMPLATE] Base indent level:`, baseIndentLevel);

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
                        console.log(`[SNIPPET WITH TEMPLATE] Restored line ${i} indentation from ${snippetIndentInfo[i]} to ${originalIndent}`);
                        snippetIndentInfo[i] = originalIndent;
                        break;
                    }
                }
            }
        }
        
        console.log(`[SNIPPET WITH TEMPLATE] Snippet indent info:`, snippetIndentInfo);

        // 檢查片段內的一致性
        const nonEmptyIndents = snippetIndentInfo.filter((indent, i) => snippetLines[i].trim().length > 0);
        const allLinesAtSameLevel = nonEmptyIndents.length > 1 && nonEmptyIndents.every(indent => indent === nonEmptyIndents[0]);
        
        console.log(`[SNIPPET WITH TEMPLATE] All lines at same level:`, allLinesAtSameLevel);

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
                    const result = line.trim();
                    console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: FIRST LINE SAME LEVEL -> "${result}"`);
                    return result;
                } else {
                    const result = targetIndentation + line.trim();
                    console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: SUBSEQUENT SAME LEVEL -> "${result}"`);
                    return result;
                }
            } else if (originalIndent === 0) {
                // 沒有縮排的行 - 都應該與第一行保持同層級
                if (index === 0) {
                    console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: first line, no extra indent -> "${line.trim()}"`);
                    return line.trim();
                } else {
                    // 同樣是 0 縮排，應該與第一行同層級，不加額外縮排
                    console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: same level as first line (0 indent) -> "${line.trim()}"`);
                    return line.trim();
                }
            } else if (originalIndent === baseIndentLevel) {
                // 基準層級的行
                if (index === 0) {
                    console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: first line at base level -> "${line.trim()}"`);
                    return line.trim();
                } else {
                    finalIndent = targetIndentation;
                    console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: base level -> target indent only`);
                }
            } else if (originalIndent > baseIndentLevel) {
                // 額外縮排的行
                const extraIndent = originalIndent - baseIndentLevel;
                const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
                const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
                const extraLevels = Math.floor(extraIndent / indentMultiplier);
                finalIndent = targetIndentation + indentUnit.repeat(extraLevels);
                console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: extra indent -> ${extraLevels} extra levels`);
            } else {
                // 比基準層級少縮排
                console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: less than base indent -> "${line.trim()}"`);
                return line.trim();
            }
            
            const result = finalIndent + line.trim();
            console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: "${result}"`);
            return result;
        });
        
        const finalResult = formattedLines.join('\n');
        console.log(`[SNIPPET WITH TEMPLATE] Final result:\n${finalResult}`);
        
        return finalResult;
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