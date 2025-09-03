# TextBricks

A VSCode extension providing structured programming templates for multiple languages (C, Python, JavaScript) to help beginners learn programming efficiently.

<!-- TextBricks Logo -->

## Features

### 🌐 **Multi-Language Support**
TextBricks supports multiple programming languages:
- **C** - Traditional system programming language
- **Python** - Modern, beginner-friendly language
- **JavaScript** - Web development and scripting
- Easily switch between languages with the integrated language selector

### 🎯 **Structured Learning Path**
TextBricks organizes programming concepts into progressive categories:

- **Basic Syntax** - Hello World, Variables, Input/Output fundamentals
- **Control Structures** - Conditional logic, loops, and program flow  
- **Functions & Data** - Function definition, data structures, and modular programming
- **Advanced Applications** - Object-oriented programming, file operations, and complex patterns

### 🚀 **Easy Code Insertion**
- **Click to Insert**: Click any template card to insert code directly into your editor
- **Drag to Insert**: Drag template cards directly into your editor
- **Smart Copy**: Access copy functionality from preview tooltips
- **Interactive Preview**: Hover eye button to see detailed code preview with both copy and insert options
- **Smart Selection**: When text is selected, only the selected portion is copied or inserted
- **Auto-Fallback**: If no active editor is found, code is copied to clipboard with option to create new file

### 🎨 **Clean Interface**
- Integrated sidebar panel in VS Code
- Collapsible category sections
- Template cards with clear descriptions
- Compact language selector in header
- Language tags and visual feedback

### 🛠️ **Advanced Template Management**
- **Template Manager**: Comprehensive CRUD operations for templates, categories, and languages
- **Import/Export**: Backup and share template collections
- **JSON Batch Import**: Quickly add multiple templates using JSON format
- **Template Validation**: Built-in validation for template data integrity

### ⭐ **Smart Recommendation System**
- **Intelligent Recommendations**: AI-powered template suggestions based on your usage patterns
- **Usage Tracking**: Automatic tracking of template usage frequency and timing
- **Visual Indicators**: Recommended templates marked with golden star icons (⭐)
- **Unified Design**: Clean, consistent interface with golden theme for recommendations
- **Context Awareness**: Reserved architecture for future context-based suggestions

### 🧠 **Smart Indentation System** ⭐ New in v0.1.5
- **Intelligent Copy-Paste**: Automatically adjusts template indentation to match your cursor position
- **Context-Aware Formatting**: Preserves relative indentation relationships between code lines
- **Multi-Line Support**: Properly handles complex templates with nested indentation
- **Tooltip Text Selection**: Smart indentation for selected text copied from template previews
- **Seamless Integration**: Works automatically with all copy operations without additional setup
- **GitHub Codespaces Support**: Automatic detection and drag fallbacks for web environments

### 📖 **Documentation System** ⭐ v0.1.4
- **Comprehensive Template Docs**: Rich Markdown documentation for each template with examples and explanations
- **Multiple Doc Types**: Support for embedded Markdown, local files (.md), and external URLs
- **Template Manager Integration**: Edit and preview documentation with modal preview window
- **Intelligent Content Detection**: Automatically distinguish between file paths and Markdown content
- **Side Panel Display**: Documentation opens in editor side panel with syntax highlighting
- **Clean UI Integration**: Documentation buttons integrated into hover tooltips (📖 icon)
- **Standard Format**: Consistent documentation structure with overview, examples, and key concepts
- **Interactive Code Blocks**: Documentation code blocks with insert and copy buttons ⭐ v0.1.6
- **Smart Selection Support**: Select specific portions of code in documentation to insert/copy only that part ⭐ v0.1.6

### 🔧 **Enhanced User Experience** ⭐ New in v0.1.6
- **Improved Insert Functionality**: Primary action changed from copy to insert for better workflow
- **Smart Editor Detection**: Intelligent handling when no active editor is available
- **Auto-Fallback System**: Automatic clipboard copy with option to create new file when no editor is found
- **Documentation Code Actions**: Interactive insert and copy buttons in all documentation code blocks
- **Clean Button Styling**: Improved visual design for all action buttons across the interface

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "TextBricks"
4. Click Install

### Manual Installation
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to launch Extension Development Host
5. Open a C file to see TextBricks panel in sidebar

## Usage

### Getting Started
1. **Install the extension** and restart VS Code
2. **Open a code file** (`.c`, `.py`, `.js`, etc.)
3. **Find TextBricks panel** in the activity bar sidebar
4. **Select your language** using the language selector (🌐)
5. **Browse templates** organized by learning level
6. **Check recommendations** - Look for the "⭐ 推薦" section at the top for personalized suggestions
7. **Use templates** - Click to copy or drag to insert - Usage is tracked for better recommendations
8. **View documentation** - Hover over templates and click 📖 in tooltips to see detailed explanations

### Using Smart Indentation (New in v0.1.5)
1. **Position your cursor** at the desired indentation level in your code
2. **Copy any template** using the copy button or text selection
3. **Paste the code** - Indentation automatically adjusts to match your cursor position
4. **Relative indentation preserved** - All nested code maintains proper structure
5. **Works with selections** - Select text from tooltips and copy with smart indentation
6. **GitHub Codespaces** - Copy and paste works with smart indentation

### Using Documentation (v0.1.4)
1. **Hover over template cards** to see preview tooltip
2. **Click the 📖 icon** in tooltips for templates with documentation
3. **Documentation opens** in side panel next to your editor
4. **Full Markdown support** with syntax highlighting and formatting
5. **Template Manager** allows editing and previewing documentation with modal preview

### Available Commands
- **TextBricks: Open Template Manager** - Launch the comprehensive template management interface
- **TextBricks: Create Template** - Quick template creation from command palette
- **TextBricks: Import Templates** - Import template collections from JSON files
- **TextBricks: Export Templates** - Export your templates to JSON format
- **TextBricks: Refresh Templates** - Reload template data

### Template Examples

#### 📚 Basic Syntax Examples

**C - Hello World**
```c
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}
```

**Python - Hello World**
```python
print("Hello, World!")
```

**JavaScript - Hello World**
```javascript
console.log("Hello, World!");
```

#### 🔧 Control Structure Examples  

**C - For Loop**
```c
for (int i = 0; i < 10; i++) {
    printf("第 %d 次迴圈\n", i + 1);
}
```

**Python - For Loop**
```python
for i in range(10):
    print(f"第 {i + 1} 次迴圈")
```

**JavaScript - For Loop**
```javascript
for (let i = 0; i < 10; i++) {
    console.log(`第 ${i + 1} 次迴圈`);
}
```

### Template Manager Features

The Template Manager provides a comprehensive interface for managing your template collection:

#### 🎛️ **CRUD Operations**
- Create, edit, and delete templates with full validation
- Manage template categories and difficulty levels
- Add and configure programming languages

#### 📦 **Import/Export System**
- **Standard Import**: Use VS Code's file dialog for JSON imports
- **JSON Batch Import**: Paste JSON directly for quick bulk additions
- **Export Filters**: Export specific templates by language or category
- **Data Validation**: Automatic validation of imported data

#### 🔧 **JSON Format for Batch Import**
```json
[
  {
    "title": "Hello World",
    "description": "Basic hello world program",
    "code": "print('Hello, World!')",
    "language": "python",
    "categoryId": "beginner"
  }
]
```

## Development

### Project Structure
```
TextBricks-VSCode/
├── src/                           # TypeScript source code
│   ├── extension.ts               # Main extension file
│   ├── providers/                 # Webview and provider classes
│   │   ├── WebviewProvider.ts     # Main template display panel
│   │   └── TemplateManagerProvider.ts # Template management interface
│   ├── services/                  # Business logic services
│   │   ├── TemplateManager.ts     # Core template operations
│   │   └── TemplateManagementService.ts # CRUD and import/export
│   ├── models/                    # Data models and interfaces
│   │   └── Template.ts            # Template, category, language types
│   └── data/                      # Template data
│       └── templates.json         # Template database
├── media/                         # Webview assets
│   ├── style.css                  # Main panel styling
│   ├── template-manager.css       # Template manager styling
│   ├── main.js                    # Main panel frontend
│   └── template-manager.js        # Template manager frontend
├── icons/                         # Extension icons
├── package.json                   # Extension manifest
└── README.md                      # This file
```

### Building from Source
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Package extension
vsce package
```

### Architecture

- **Extension Host**: Main TypeScript extension running in Node.js
- **Webview Panels**: 
  - **Main Panel**: Template browsing and selection interface
  - **Management Panel**: Comprehensive template administration interface
- **Service Layer**: 
  - **TemplateManager**: Core template loading and organization
  - **TemplateManagementService**: Advanced CRUD operations and data management
- **Data Layer**: JSON-based template storage with validation
- **Multi-Language Support**: Dynamic language switching and template filtering

## Contributing

We welcome contributions! Here's how you can help:

### Adding New Templates

#### Method 1: Using Template Manager (Recommended)
1. Open TextBricks Template Manager via command palette
2. Use "新增模板" button or JSON batch import
3. Fill in template details with validation
4. Test the template in the main panel

#### Method 2: Direct JSON Editing
1. Edit `src/data/templates.json`
2. Add your template with proper category and metadata
3. Ensure proper language and category IDs
4. Test the template in the webview
5. Submit a pull request

### Reporting Issues
- Use GitHub Issues to report bugs
- Include VS Code version and extension version
- Provide steps to reproduce the issue

### Development Guidelines
- Follow TypeScript and ESLint configurations
- Write tests for new features
- Update documentation for changes
- Maintain compatibility with VS Code API

## Requirements

- **VS Code**: Version 1.60.0 or higher
- **Node.js**: Version 16 or higher (for development)
- **TypeScript**: Version 4.4 or higher (for development)

## Extension Settings

This extension contributes the following settings:

- **Language Preference**: Automatically saved when switching languages
- **Template Manager**: Access via command palette or menu
- Currently no additional configurable settings
- Future versions may include theme and behavior customization

## Known Issues

- Template Manager modal may require multiple clicks to close in some VS Code themes
- Very long template names may be truncated in narrow sidebar widths
- JSON batch import validation messages appear briefly for valid input

## Release Notes

### 0.1.5 ⭐ Latest
- **Smart Indentation System**: Intelligent copy-paste with automatic indentation adjustment
- **Context-Aware Formatting**: Preserves relative indentation relationships between code lines
- **Multi-Line Template Support**: Proper handling of complex templates with nested indentation
- **Tooltip Text Selection**: Smart indentation for selected text copied from template previews
- **Seamless Integration**: Works automatically with all copy operations without additional setup
- **Enhanced Copy Experience**: Template copying now adapts to cursor position and maintains code structure

### 0.1.4
- **Documentation System**: Rich Markdown documentation for templates with examples and explanations
- **Template Manager Integration**: Edit and preview documentation with modal preview window
- **Side Panel Display**: Documentation opens in editor side panel with syntax highlighting
- **Smart Content Detection**: Automatically distinguish between file paths, URLs, and Markdown content
- **UI Integration**: Documentation buttons in hover tooltips (📖 icon) for clean interface
- **Standard Format**: Consistent documentation structure with overview, examples, and key concepts
- **Multiple Doc Types**: Support for embedded Markdown, local files (.md), and external URLs
- **Bug Fixes**: Resolved Template Manager loading issues and documentation content processing

### 0.1.3
- **Smart Recommendation System**: AI-powered template suggestions based on usage patterns
- **Usage Tracking**: Automatic tracking of template frequency and timing
- **Visual Indicators**: Recommended templates marked with golden star icons (⭐)
- **Dynamic UI**: Smooth animations and visual feedback for better user experience
- **Golden Theme**: Unified design for recommendation sections

### 0.1.2
- **Multi-Language Support**: Added Python and JavaScript templates alongside C
- **Template Manager**: Comprehensive template management interface with CRUD operations
- **JSON Batch Import**: Quick bulk template addition feature with validation
- **Improved UI**: Compact header design and optimized space utilization
- **Import/Export**: Full template collection backup and sharing capabilities
- **Enhanced Validation**: Real-time validation for template data integrity
- **Language Selector**: Easy switching between programming languages
- **Extensible Architecture**: Built for future expansion and customization
- **Updated Repository**: Correct GitHub repository links and metadata

### 0.1.1
- Initial multi-language release with template management features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: See [PRD.md](PRD.md) for detailed specifications
- **Issues**: Report bugs on [GitHub Issues](https://github.com/timcsy/TextBricks-VSCode/issues)
- **Repository**: View source code on [GitHub](https://github.com/timcsy/TextBricks-VSCode)

---

**Made with ❤️ for C programming learners**

Happy coding with TextBricks! 🧱✨