# Smart Indentation System v0.1.7

## Overview

The TextBricks Smart Indentation System underwent a major overhaul in version 0.1.7, introducing a unified approach to code insertion that ensures consistent behavior across all insertion methods (tooltips, documentation, templates).

## Architecture

### Core Method: `formatCodeSnippetUnified`

Located in `src/services/TemplateManager.ts`, this method is the single source of truth for all code formatting operations.

```typescript
formatCodeSnippetUnified(code: string, template?: ExtendedTemplate, targetIndentation?: string): string
```

### Key Features

#### 1. Same-Level Detection
The system intelligently detects when all lines in a code snippet are at the same indentation level:

```typescript
const allLinesAtSameLevel = nonEmptyIndents.length > 1 && 
  nonEmptyIndents.every(indent => indent === nonEmptyIndents[0]);
```

**Behavior:**
- **First line**: Returns `line.trim()` (let VS Code handle cursor position indentation)
- **Subsequent lines**: Returns `targetIndentation + line.trim()` (manual indentation alignment)

#### 2. Smart Cursor Analysis
Empty line detection prevents unnecessary indentation when inserting at line start:

```typescript
// In DocumentationProvider._getCurrentIndentation()
if (position.character === 0 && lineText.trim() === '') {
    return ''; // No target indentation needed
}
```

#### 3. Template-Assisted Recovery
When text selection loses indentation context, the system attempts to recover it from the original template:

```typescript
// Match snippet lines with template lines to restore lost indentation
for (let j = 0; j < templateLines.length; j++) {
  if (templateLines[j].trim() === snippetLine) {
    const originalIndent = fullTemplateIndentInfo[j];
    snippetIndentInfo[i] = originalIndent;
    break;
  }
}
```

## Provider Integration

### Unified Approach
Both `WebviewProvider` (tooltips) and `DocumentationProvider` (documentation) use the same formatting method:

```typescript
// WebviewProvider
formattedCode = this.templateManager.formatCodeSnippetUnified(code, template, targetIndentation);

// DocumentationProvider  
formattedCode = this.templateManager.formatCodeSnippetUnified(code, template, targetIndentation);
```

### Target Indentation Calculation
Both providers use consistent logic for determining target indentation:

```typescript
private _getCurrentIndentation(): string {
  const editor = vscode.window.activeTextEditor;
  const position = editor.selection.active;
  const currentLine = editor.document.lineAt(position.line);
  
  // Empty line at column 0 = no target indentation
  if (position.character === 0 && currentLine.text.trim() === '') {
    return '';
  }
  
  // Extract existing line indentation
  const match = currentLine.text.match(/^(\s*)/);
  return match ? match[1] : '';
}
```

## Test Coverage

### Test Structure
Located in `src/services/__tests__/TemplateManager.test.ts`:

```typescript
describe('formatCodeSnippetUnified (統一片段格式化方法)', () => {
  // Same-level logic tests
  // Complex indentation scenario tests  
  // Template matching logic tests
  // Edge case tests
  // Backward compatibility tests
})
```

### Key Test Scenarios

#### Same-Level Detection
```typescript
it('應該正確處理同一層級的片段（無模板）', () => {
  const code = 'printf("Hello, World!\\n");\nreturn 0;';
  const targetIndentation = '  '; // 2 spaces
  
  const formatted = templateManager.formatCodeSnippetUnified(code, undefined, targetIndentation);
  const lines = formatted.split('\n');
  
  expect(lines[0]).toBe('printf("Hello, World!\\n");'); // First line: trimmed
  expect(lines[1]).toBe('  return 0;'); // Second line: target indent + trimmed
});
```

#### Empty Line Handling
```typescript
it('應該正確處理空目標縮排（cursor在空行開頭）', () => {
  const code = 'printf("Hello, World!\\n");\nreturn 0;';
  const targetIndentation = ''; // Empty string
  
  const formatted = templateManager.formatCodeSnippetUnified(code, undefined, targetIndentation);
  const lines = formatted.split('\n');
  
  expect(lines[0]).toBe('printf("Hello, World!\\n");'); // No indentation
  expect(lines[1]).toBe('return 0;'); // No indentation
});
```

#### Template Recovery
```typescript
it('應該從模板恢復丟失的縮排信息', () => {
  const code = 'printf("Hello, World!\\n");\nreturn 0;'; // No indentation
  const formatted = templateManager.formatCodeSnippetUnified(code, sampleTemplate, targetIndentation);
  
  // Should recover indentation from template and treat as same-level
  expect(lines[0]).toBe('printf("Hello, World!\\n");');
  expect(lines[1]).toBe('  return 0;');
});
```

## Migration Guide

### For Extension Developers

The old `formatCodeSnippetWithTemplate` method is maintained for backward compatibility but now internally calls the unified method:

```typescript
// Old method (still works)
formatCodeSnippetWithTemplate(code: string, template: ExtendedTemplate, targetIndentation?: string): string {
  return this.formatCodeSnippetUnified(code, template, targetIndentation);
}

// New unified method (recommended)
formatCodeSnippetUnified(code: string, template?: ExtendedTemplate, targetIndentation?: string): string {
  // Unified implementation
}
```

### Breaking Changes
None. The system maintains full backward compatibility while providing enhanced functionality.

## Performance Considerations

### Optimization Features
- **Single Processing Pass**: Code is analyzed once and processed efficiently
- **Intelligent Caching**: Template indentation information is calculated once per template
- **Minimal Memory Overhead**: Processing happens in-place where possible

### Debug Output
Comprehensive debug logging helps troubleshoot indentation issues:
```typescript
console.log(`[SNIPPET WITH TEMPLATE] *** Line ${index}: FIRST LINE SAME LEVEL -> "${result}"`);
console.log(`[SNIPPET WITH TEMPLATE] *** Line ${index}: SUBSEQUENT SAME LEVEL (with target indent) -> "${result}"`);
```

## Future Enhancements

### Planned Improvements
- **Language-Specific Indentation**: Detect and respect language-specific indentation conventions
- **Auto-Indentation Detection**: Automatically determine optimal indentation style from existing code
- **Advanced Template Context**: More sophisticated template matching for complex scenarios

### Extension Points
The unified architecture provides a solid foundation for future indentation enhancements without breaking existing functionality.