import { Template, TemplateCategory, Language, ExtendedTemplate } from '../models/Template';
import * as path from 'path';
import * as fs from 'fs';

interface TemplateData {
  languages: Language[];
  categories: TemplateCategory[];
  templates: ExtendedTemplate[];
}

export class TemplateManager {
  private languages: Language[] = [];
  private categories: TemplateCategory[] = [];
  private templates: ExtendedTemplate[] = [];

  loadTemplates(): void {
    try {
      const dataPath = path.join(__dirname, '../data/templates.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const data: TemplateData = JSON.parse(rawData);
      
      this.languages = data.languages || [];
      this.categories = data.categories;
      this.templates = data.templates;
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Initialize with empty arrays if loading fails
      this.languages = [];
      this.categories = [];
      this.templates = [];
    }
  }

  getTemplateById(id: string): ExtendedTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  getTemplatesByCategory(categoryId: string): ExtendedTemplate[] {
    return this.templates.filter(template => template.categoryId === categoryId);
  }

  getCategories(): TemplateCategory[] {
    return [...this.categories];
  }

  getAllTemplates(): ExtendedTemplate[] {
    return [...this.templates];
  }

  getLanguages(): Language[] {
    return [...this.languages];
  }

  getLanguageById(id: string): Language | undefined {
    return this.languages.find(language => language.id === id);
  }

  getTemplatesByLanguage(languageId: string): ExtendedTemplate[] {
    return this.templates.filter(template => template.language === languageId);
  }

  getTemplatesByLanguageAndCategory(languageId: string, categoryId: string): ExtendedTemplate[] {
    return this.templates.filter(
      template => template.language === languageId && template.categoryId === categoryId
    );
  }

  formatTemplate(template: ExtendedTemplate, targetIndentation?: string): string {
    // 當複製完整模板時，使用模板的完整縮排資訊來正確處理縮排關係
    const fullTemplateIndentInfo = this.analyzeTemplateIndentation(template.code);
    
    // 找到模板中的基準縮排層級（通常是函數體內的縮排）
    const baseIndentLevel = this.findBaseIndentLevel(fullTemplateIndentInfo);
    
    console.log(`[TEMPLATE DEBUG] Full template code:\n${template.code}`);
    console.log(`[TEMPLATE DEBUG] Full template indent info:`, fullTemplateIndentInfo);
    console.log(`[TEMPLATE DEBUG] Base indent level:`, baseIndentLevel);
    
    return this.formatTemplateWithBaseIndent(template.code, fullTemplateIndentInfo, baseIndentLevel, targetIndentation);
  }

  /**
   * 找到模板中的基準縮排層級
   */
  private findBaseIndentLevel(indentInfo: number[]): number {
    // 找到所有非零縮排的最小值，通常就是基準層級
    const nonZeroIndents = indentInfo.filter(indent => indent > 0);
    return nonZeroIndents.length > 0 ? Math.min(...nonZeroIndents) : 0;
  }

  /**
   * 使用基準縮排層級格式化模板
   */
  private formatTemplateWithBaseIndent(code: string, indentInfo: number[], baseIndentLevel: number, targetIndentation?: string): string {
    if (!targetIndentation) {
      return code;
    }

    const lines = code.split('\n');
    if (lines.length === 0) {
      return code;
    }

    console.log(`[TEMPLATE DEBUG] Target indentation: "${targetIndentation}" (length: ${targetIndentation.length})`);

    // 處理每一行
    const formattedLines = lines.map((line, index) => {
      // 空行直接返回
      if (line.trim().length === 0) {
        return '';
      }
      
      const originalIndent = indentInfo[index];
      
      // 計算相對於基準層級的縮排
      let finalIndent = '';
      
      if (originalIndent === 0) {
        // 沒有縮排的行（如函數宣告、for語句開頭、結束括號）
        // 第一行直接放在游標位置，後續同層級行對齊第一行
        if (index === 0) {
          // 第一行：讓VS Code決定位置
          console.log(`[TEMPLATE DEBUG] Line ${index}: first line, no extra indent -> "${line.trim()}"`);
          return line.trim();
        } else {
          // 後續同層級行：與第一行對齊（使用目標縮排）
          finalIndent = targetIndentation;
          console.log(`[TEMPLATE DEBUG] Line ${index}: same level as first line -> target indent`);
        }
      } else if (originalIndent === baseIndentLevel) {
        // 基準層級的行（如函數體內的語句）- 目標縮排 + 基準層級
        const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
        const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
        const baseIndentLevels = Math.floor(baseIndentLevel / indentMultiplier);
        finalIndent = targetIndentation + indentUnit.repeat(baseIndentLevels);
      } else if (originalIndent > baseIndentLevel) {
        // 比基準層級多縮排的行 - 目標縮排 + 額外層級
        const extraIndent = originalIndent - baseIndentLevel;
        const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
        const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
        const extraLevels = Math.floor(extraIndent / indentMultiplier);
        finalIndent = targetIndentation + indentUnit.repeat(extraLevels);
      } else {
        // 比基準層級少縮排的行 - 這種情況較少見，直接使用內容
        console.log(`[TEMPLATE DEBUG] Line ${index}: less than base indent -> "${line.trim()}"`);
        return line.trim();
      }
      
      const result = finalIndent + line.trim();
      console.log(`[TEMPLATE DEBUG] Line ${index}: original indent ${originalIndent}, final -> "${result}"`);
      return result;
    });
    
    const finalResult = formattedLines.join('\n');
    console.log(`[TEMPLATE DEBUG] Final result:\n${finalResult}`);
    return finalResult;
  }

  /**
   * 分析模板代碼的縮排資訊
   */
  analyzeTemplateIndentation(code: string): number[] {
    const lines = code.split('\n');
    const indentations: number[] = [];
    
    for (const line of lines) {
      if (line.trim().length === 0) {
        indentations.push(0); // 空行
      } else {
        const match = line.match(/^(\s*)/);
        indentations.push(match ? match[1].length : 0);
      }
    }
    
    return indentations;
  }

  /**
   * 使用預先分析的縮排資訊格式化模板
   */
  formatTemplateWithIndentInfo(code: string, targetIndentation?: string, indentInfo?: number[]): string {
    if (!targetIndentation) {
      return code;
    }

    const lines = code.split('\n');
    if (lines.length === 0) {
      return code;
    }

    // 如果沒有提供縮排資訊，回退到原來的邏輯
    if (!indentInfo || indentInfo.length !== lines.length) {
      return this.formatCodeSnippet(code, targetIndentation);
    }

    console.log(`[INDENT DEBUG] Using provided indent info:`, indentInfo);
    console.log(`[INDENT DEBUG] Target indentation: "${targetIndentation}" (length: ${targetIndentation.length})`);

    // 找到第一個非空行
    let firstLineIndex = -1;
    let firstLineIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().length > 0) {
        firstLineIndex = i;
        firstLineIndent = indentInfo[i];
        break;
      }
    }

    console.log(`[INDENT DEBUG] First line index: ${firstLineIndex}, original indentation: ${firstLineIndent}`);

    // 處理每一行
    const formattedLines = lines.map((line, index) => {
      // 空行直接返回
      if (line.trim().length === 0) {
        return '';
      }
      
      // 第一個非空行：直接使用內容（讓VS Code決定縮排）
      if (index === firstLineIndex) {
        console.log(`[INDENT DEBUG] First line: "${line.trim()}" (no extra indent)`);
        return line.trim();
      }
      
      // 後續行：使用提供的縮排資訊計算相對縮排
      const originalIndent = indentInfo[index];
      const relativeIndent = originalIndent - firstLineIndent;
      
      let finalIndent = '';
      if (relativeIndent > 0) {
        // 比第一行多縮排：目標縮排 + 相對差異
        const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
        const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
        const extraLevels = Math.floor(relativeIndent / indentMultiplier);
        finalIndent = targetIndentation + indentUnit.repeat(extraLevels);
      } else if (relativeIndent < 0) {
        // 比第一行少縮排：從目標縮排中減少
        const reduceAmount = Math.abs(relativeIndent);
        if (reduceAmount >= targetIndentation.length) {
          finalIndent = '';
        } else {
          finalIndent = targetIndentation.substring(0, targetIndentation.length - reduceAmount);
        }
      } else {
        // 和第一行縮排相同：使用目標縮排
        finalIndent = targetIndentation;
      }
      
      const result = finalIndent + line.trim();
      console.log(`[INDENT DEBUG] Line ${index}: original indent ${originalIndent}, relative ${relativeIndent} -> "${result}"`);
      return result;
    });
    
    const finalResult = formattedLines.join('\n');
    console.log(`[INDENT DEBUG] Final result:\n${finalResult}`);
    return finalResult;
  }

  formatTemplateForDrag(template: ExtendedTemplate, targetIndentation?: string): string {
    return this.formatTemplateCode(template.code, targetIndentation, true);
  }

  private formatTemplateCode(code: string, targetIndentation?: string, alignFirstLine: boolean = false): string {
    // If no target indentation is provided, return as is
    if (!targetIndentation) {
      return code;
    }
    
    // Split code into lines
    const lines = code.split('\n');
    if (lines.length <= 1) {
      return code;
    }
    
    // Find the minimum indentation in the code (excluding empty lines)
    let minIndent = Infinity;
    for (const line of lines) {
      if (line.trim().length === 0) continue; // Skip empty lines
      const match = line.match(/^(\s*)/);
      if (match) {
        minIndent = Math.min(minIndent, match[1].length);
      }
    }
    
    // If all lines have no indentation, minIndent will be 0
    if (minIndent === Infinity) minIndent = 0;
    
    // Process each line
    const formattedLines = lines.map((line, index) => {
      // For copy-paste (not drag), keep first line as is (it will be placed at cursor position)
      if (index === 0 && !alignFirstLine) {
        return line;
      }
      
      // For empty lines, return empty or target indentation
      if (line.trim().length === 0) {
        return '';
      }
      
      // Get current line indentation
      const lineIndent = line.match(/^(\s*)/)?.[1] || '';
      const relativeIndent = lineIndent.length - minIndent;
      
      // Create new indentation: target + relative indentation
      let newIndent = targetIndentation;
      if (relativeIndent > 0) {
        // Only add extra indentation if the relative difference is significant
        // (more than half an indent unit to avoid small formatting differences)
        const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
        const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
        const threshold = indentMultiplier / 2;
        
        if (relativeIndent > threshold) {
          const extraLevels = Math.floor(relativeIndent / indentMultiplier);
          if (extraLevels > 0) {
            newIndent += indentUnit.repeat(extraLevels);
          }
        }
      }
      
      // Return line with new indentation
      return newIndent + line.substring(lineIndent.length);
    });
    
    return formattedLines.join('\n');
  }

  formatCodeSnippet(code: string, targetIndentation?: string): string {
    // If no target indentation is provided, return as is
    if (!targetIndentation) {
      return code;
    }
    
    console.log(`[INDENT DEBUG] Target indentation: "${targetIndentation}" (length: ${targetIndentation.length})`);
    console.log(`[INDENT DEBUG] Original code:\n${code}`);
    
    // Split code into lines
    const lines = code.split('\n');
    if (lines.length === 0) {
      return code;
    }
    
    // === 簡單的縮排處理 ===
    // 找到第一個非空行作為基準行
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
    
    console.log(`[INDENT DEBUG] First line index: ${firstLineIndex}, indentation: ${firstLineIndent}`);
    
    // 處理每一行
    const formattedLines = lines.map((line, index) => {
      // 空行直接返回
      if (line.trim().length === 0) {
        return '';
      }
      
      // 第一個非空行：直接使用內容（讓VS Code決定縮排）
      if (index === firstLineIndex) {
        console.log(`[INDENT DEBUG] First line: "${line.trim()}" (no extra indent)`);
        return line.trim();
      }
      
      // 後續行：計算相對於第一行的縮排差異
      const lineIndent = line.match(/^(\s*)/)?.[1] || '';
      const relativeIndent = lineIndent.length - firstLineIndent;
      
      let finalIndent = '';
      if (relativeIndent > 0) {
        // 比第一行多縮排：目標縮排 + 相對差異
        const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
        const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
        const extraLevels = Math.floor(relativeIndent / indentMultiplier);
        finalIndent = targetIndentation + indentUnit.repeat(extraLevels);
      } else if (relativeIndent < 0) {
        // 比第一行少縮排：從目標縮排中減少
        const reduceAmount = Math.abs(relativeIndent);
        if (reduceAmount >= targetIndentation.length) {
          finalIndent = '';
        } else {
          finalIndent = targetIndentation.substring(0, targetIndentation.length - reduceAmount);
        }
      } else {
        // 和第一行縮排相同：使用目標縮排
        finalIndent = targetIndentation;
      }
      
      const result = finalIndent + line.trim();
      console.log(`[INDENT DEBUG] Line ${index}: relative indent ${relativeIndent} -> "${result}"`);
      return result;
    });
    
    const finalResult = formattedLines.join('\n');
    console.log(`[INDENT DEBUG] Final result:\n${finalResult}`);
    return finalResult;
  }

  /**
   * 偵測代碼中使用的縮排單位
   */
  private detectIndentUnit(code: string): string {
    const lines = code.split('\n');
    const indentedLines = lines.filter(line => line.match(/^\s+/) && line.trim().length > 0);
    
    if (indentedLines.length === 0) {
      return '    '; // 默認4個空格
    }
    
    // 檢查是否使用Tab
    const hasTab = indentedLines.some(line => line.startsWith('\t'));
    if (hasTab) {
      return '\t';
    }
    
    // 分析空格縮排模式
    const spaceCounts = indentedLines.map(line => {
      const match = line.match(/^( +)/);
      return match ? match[1].length : 0;
    }).filter(count => count > 0);
    
    if (spaceCounts.length === 0) {
      return '    '; // 默認4個空格
    }
    
    // 找最小的正數縮排，通常就是縮排單位
    const minSpaces = Math.min(...spaceCounts);
    const possibleUnits = [2, 3, 4, 8];
    
    for (const unit of possibleUnits) {
      if (minSpaces % unit === 0 && spaceCounts.every(count => count % unit === 0)) {
        return ' '.repeat(unit);
      }
    }
    
    return '    '; // 默認4個空格
  }

  /**
   * 使用模板資訊格式化代碼片段
   */
  formatCodeSnippetWithTemplate(code: string, template: ExtendedTemplate, targetIndentation?: string): string {
    if (!targetIndentation) {
      return code;
    }

    console.log(`[SNIPPET WITH TEMPLATE] Processing snippet with template context`);
    console.log(`[SNIPPET WITH TEMPLATE] Snippet:\n${code}`);
    console.log(`[SNIPPET WITH TEMPLATE] Template:\n${template.code}`);

    // 分析模板的縮排資訊以了解基準層級
    const fullTemplateIndentInfo = this.analyzeTemplateIndentation(template.code);
    const baseIndentLevel = this.findBaseIndentLevel(fullTemplateIndentInfo);
    
    console.log(`[SNIPPET WITH TEMPLATE] Template indent info:`, fullTemplateIndentInfo);
    console.log(`[SNIPPET WITH TEMPLATE] Base indent level:`, baseIndentLevel);

    // 分析代碼片段的縮排
    const snippetLines = code.split('\n');
    let snippetIndentInfo = this.analyzeTemplateIndentation(code);
    
    // 修復選取文字時首行縮排丟失的問題
    // 嘗試在模板中找到匹配的行來恢復原始縮排
    const templateLines = template.code.split('\n');
    for (let i = 0; i < snippetLines.length; i++) {
      const snippetLine = snippetLines[i].trim();
      if (snippetLine && snippetIndentInfo[i] === 0) {
        // 如果片段行沒有縮排但內容不為空，在模板中查找匹配的行
        for (let j = 0; j < templateLines.length; j++) {
          if (templateLines[j].trim() === snippetLine) {
            const originalIndent = fullTemplateIndentInfo[j];
            console.log(`[SNIPPET WITH TEMPLATE] Restored line ${i} indentation from ${snippetIndentInfo[i]} to ${originalIndent} (matched template line ${j})`);
            snippetIndentInfo[i] = originalIndent;
            break;
          }
        }
      }
    }
    
    console.log(`[SNIPPET WITH TEMPLATE] Snippet indent info:`, snippetIndentInfo);
    
    // Debug: 顯示每一行的原始內容和縮排
    console.log(`[SNIPPET WITH TEMPLATE] Line by line analysis:`);
    snippetLines.forEach((line, i) => {
      console.log(`  Line ${i}: ${snippetIndentInfo[i]} spaces | "${line}"`);
    });

    // 檢查片段內的一致性
    const nonEmptyIndents = snippetIndentInfo.filter((indent, i) => snippetLines[i].trim().length > 0);
    const allLinesAtSameLevel = nonEmptyIndents.length > 1 && nonEmptyIndents.every(indent => indent === nonEmptyIndents[0]);
    
    console.log(`[SNIPPET WITH TEMPLATE] Consistency check: all lines at same level = ${allLinesAtSameLevel}, indents = [${nonEmptyIndents.join(', ')}]`);

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
          // 第一行：讓VS Code決定位置
          console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: first line in consistent group -> "${line.trim()}"`);
          return line.trim();
        } else {
          // 後續行：與第一行對齊
          finalIndent = targetIndentation;
          console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: consistent group member -> align with first line`);
        }
      } else if (originalIndent === 0) {
        // 沒有縮排的行（如for語句、結束括號）
        if (index === 0) {
          // 第一行：讓VS Code決定位置
          console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: first line, no extra indent -> "${line.trim()}"`);
          return line.trim();
        } else {
          // 後續同層級行：與第一行對齊
          finalIndent = targetIndentation;
          console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: same level as first line -> target indent`);
        }
      } else if (originalIndent === baseIndentLevel) {
        // 基準層級的行：與第一行對齊（只使用目標縮排）
        if (index === 0) {
          // 第一行：讓VS Code決定位置
          console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: first line at base level, no extra indent -> "${line.trim()}"`);
          return line.trim();
        } else {
          // 後續基準層級行：與第一行對齊
          finalIndent = targetIndentation;
          console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: base level (${originalIndent}) -> target indent only`);
        }
      } else if (originalIndent > baseIndentLevel) {
        // 檢查是否所有行都有相同的縮排層級（片段內一致性）
        const allLinesAtSameLevel = snippetIndentInfo.every(indent => 
          indent === 0 || indent === originalIndent
        );
        
        if (allLinesAtSameLevel && index > 0) {
          // 如果片段中的所有非首行都有相同縮排，讓它們與第一行對齊
          finalIndent = targetIndentation;
          console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: consistent level with other lines (${originalIndent}) -> align with first line`);
        } else {
          // 原有的邏輯：處理真正的額外縮排
          // 比基準層級多縮排
          const extraIndent = originalIndent - baseIndentLevel;
          const indentUnit = targetIndentation.includes('\t') ? '\t' : '    ';
          const indentMultiplier = indentUnit === '\t' ? 1 : indentUnit.length;
          const extraLevels = Math.floor(extraIndent / indentMultiplier);
          finalIndent = targetIndentation + indentUnit.repeat(extraLevels);
          console.log(`[SNIPPET WITH TEMPLATE] Line ${index}: extra indent (${extraIndent}) -> ${extraLevels} extra levels`);
        }
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
}