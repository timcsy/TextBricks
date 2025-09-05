/**
 * VS Code 編輯器適配器
 * 實現 IEditor 接口，提供 VS Code 特定的編輯器功能
 */

import * as vscode from 'vscode';
import { IEditor, Position, Selection, IndentationInfo, EditOperation } from '@textbricks/core';

export class VSCodeEditor implements IEditor {
    
    // ==================== 位置和選取 ====================

    async getCurrentPosition(): Promise<Position> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const position = editor.selection.active;
        return {
            line: position.line,
            character: position.character
        };
    }

    async getCurrentSelection(): Promise<Selection | null> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            return null;
        }

        return {
            start: {
                line: selection.start.line,
                character: selection.start.character
            },
            end: {
                line: selection.end.line,
                character: selection.end.character
            },
            text: editor.document.getText(selection)
        };
    }

    async setPosition(position: Position): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const vscodePosition = new vscode.Position(position.line, position.character);
        editor.selection = new vscode.Selection(vscodePosition, vscodePosition);
        editor.revealRange(new vscode.Range(vscodePosition, vscodePosition));
    }

    async setSelection(start: Position, end: Position): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const startPos = new vscode.Position(start.line, start.character);
        const endPos = new vscode.Position(end.line, end.character);
        editor.selection = new vscode.Selection(startPos, endPos);
        editor.revealRange(new vscode.Range(startPos, endPos));
    }

    async applyEdits(edits: EditOperation[]): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        await editor.edit(editBuilder => {
            for (const edit of edits) {
                const pos = new vscode.Position(edit.position.line, edit.position.character);
                
                if (edit.replace) {
                    // 需要替換選取的內容（假設當前有選取）
                    const selection = editor.selection;
                    if (!selection.isEmpty) {
                        editBuilder.replace(selection, edit.text);
                    } else {
                        editBuilder.insert(pos, edit.text);
                    }
                } else {
                    editBuilder.insert(pos, edit.text);
                }
            }
        });
    }

    async getCurrentFilePath(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }

        return editor.document.uri.fsPath;
    }

    async focus(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await vscode.window.showTextDocument(editor.document);
        }
    }

    // ==================== 文檔操作 ====================

    async insertText(text: string, position?: Position): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const insertPosition = position ? 
            new vscode.Position(position.line, position.character) :
            editor.selection.active;

        await editor.edit(editBuilder => {
            editBuilder.insert(insertPosition, text);
        });
    }

    async getLineContent(lineNumber: number): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const document = editor.document;
        if (lineNumber < 0 || lineNumber >= document.lineCount) {
            throw new Error(`Line number ${lineNumber} is out of range`);
        }

        return document.lineAt(lineNumber).text;
    }

    async replaceText(start: Position, end: Position, newText: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const range = new vscode.Range(
            new vscode.Position(start.line, start.character),
            new vscode.Position(end.line, end.character)
        );

        await editor.edit(editBuilder => {
            editBuilder.replace(range, newText);
        });
    }

    async deleteText(start: Position, end: Position): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const range = new vscode.Range(
            new vscode.Position(start.line, start.character),
            new vscode.Position(end.line, end.character)
        );

        await editor.edit(editBuilder => {
            editBuilder.delete(range);
        });
    }

    // ==================== 編輯器狀態 ====================

    isEditorActive(): boolean {
        return vscode.window.activeTextEditor !== undefined;
    }

    async getCurrentLanguage(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return 'plaintext';
        }

        return editor.document.languageId;
    }

    async getIndentationInfo(): Promise<IndentationInfo> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return { 
                unit: '    ', 
                size: 4,
                current: ''
            };
        }

        const options = editor.options;
        const useSpaces = options.insertSpaces as boolean || true;
        const size = options.tabSize as number || 4;
        const unit = useSpaces ? ' '.repeat(size) : '\t';
        
        // 計算當前行的縮排
        const position = editor.selection.active;
        const currentLine = editor.document.lineAt(position.line);
        const currentMatch = currentLine.text.match(/^(\s*)/);
        const current = currentMatch?.[1] || '';

        return {
            unit,
            size,
            current
        };
    }

    async calculateTargetIndentation(position?: Position): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }

        const document = editor.document;
        const targetPosition = position ? 
            new vscode.Position(position.line, position.character) :
            editor.selection.active;

        // 取得目前行
        const currentLine = document.lineAt(targetPosition.line);
        const lineText = currentLine.text;
        const cursorColumn = targetPosition.character;

        // 取得行縮排
        const indentMatch = lineText.match(/^(\s*)/);
        const lineIndentation = indentMatch?.[1] || '';

        // 游標在行首或縮排內
        if (cursorColumn <= lineIndentation.length) {
            return lineIndentation;
        }

        // 非空行，使用行縮排
        if (lineText.trim().length > 0) {
            return lineIndentation;
        }

        // 空行，使用前一行縮排
        if (targetPosition.line > 0) {
            const prevLine = document.lineAt(targetPosition.line - 1);
            const prevIndentMatch = prevLine.text.match(/^(\s*)/);
            return prevIndentMatch?.[1] || '';
        }

        return '';
    }

    // ==================== 文檔資訊 ====================

    async getDocumentText(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        return editor.document.getText();
    }

    async getLineCount(): Promise<number> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return 0;
        }

        return editor.document.lineCount;
    }

    async getFileName(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }

        return editor.document.fileName;
    }

    async getFilePath(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }

        return editor.document.uri.fsPath;
    }

    // ==================== 檔案操作 ====================

    async createNewFile(content?: string): Promise<void> {
        const newDoc = await vscode.workspace.openTextDocument();
        const newEditor = await vscode.window.showTextDocument(newDoc);
        
        if (content) {
            await newEditor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), content);
            });
        }
    }

    async openFile(filePath: string): Promise<void> {
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
    }

    async saveCurrentFile(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        await editor.document.save();
    }

    // ==================== 搜尋和導航 ====================

    async findText(searchText: string, options?: {
        caseSensitive?: boolean;
        wholeWord?: boolean;
        regex?: boolean;
    }): Promise<Position[]> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return [];
        }

        const document = editor.document;
        const text = document.getText();
        const results: Position[] = [];

        let searchRegex: RegExp;
        
        if (options?.regex) {
            try {
                const flags = options.caseSensitive ? 'g' : 'gi';
                searchRegex = new RegExp(searchText, flags);
            } catch {
                return []; // Invalid regex
            }
        } else {
            let pattern = options?.regex ? searchText : searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (options?.wholeWord) {
                pattern = `\\b${pattern}\\b`;
            }
            const flags = options?.caseSensitive ? 'g' : 'gi';
            searchRegex = new RegExp(pattern, flags);
        }

        const lines = text.split('\n');
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            let match;
            
            while ((match = searchRegex.exec(line)) !== null) {
                results.push({
                    line: lineIndex,
                    character: match.index
                });
                
                // Prevent infinite loop for zero-width matches
                if (match.index === searchRegex.lastIndex) {
                    searchRegex.lastIndex++;
                }
            }
        }

        return results;
    }

    async goToPosition(position: Position): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const vscodePosition = new vscode.Position(position.line, position.character);
        editor.selection = new vscode.Selection(vscodePosition, vscodePosition);
        editor.revealRange(new vscode.Range(vscodePosition, vscodePosition));
    }

    // ==================== 編輯器事件 ====================

    onDidChangeActiveEditor(listener: (editor: any) => void): { dispose(): void } {
        return vscode.window.onDidChangeActiveTextEditor(listener);
    }

    onDidChangeTextDocument(listener: (event: any) => void): { dispose(): void } {
        return vscode.workspace.onDidChangeTextDocument(listener);
    }

    onDidSaveTextDocument(listener: (document: any) => void): { dispose(): void } {
        return vscode.workspace.onDidSaveTextDocument(listener);
    }
}