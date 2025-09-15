# TextBricks

A multi-editor extension providing structured programming templates for multiple languages (C, Python, JavaScript) to help beginners learn programming efficiently.

> **🚀 Version 0.2.4** - Major refactoring and modularization! System-wide cleanup, modular manager architecture, unified command service, and preparation for hierarchical topics. Cleaner codebase with platform-independent core for future multi-editor expansion.

## ✨ Features

### 🌐 **Multi-Language Support**
- **C** - Traditional system programming language
- **Python** - Modern, beginner-friendly language  
- **JavaScript** - Web development and scripting
- Easy language switching with integrated selector

### 🎯 **Flexible Topic System**
Templates organized with complete customization freedom:
- **Customizable Topics** - Create your own topic names like "基礎概念", "網頁開發", "演算法"
- **Semantic Organization** - Use meaningful names instead of rigid level numbers
- **Educational Flexibility** - Perfect for educators to create course-specific topics
- **Project-Based Organization** - Developers can organize templates by project needs
- **Unlimited Scalability** - No more artificial 4-level restrictions

**Example Topic Organizations:**
- **For Beginners**: "基礎", "控制", "函數", "進階"
- **For Web Development**: "HTML結構", "CSS樣式", "JavaScript互動", "React組件"
- **For Algorithms**: "排序", "搜尋", "動態規劃", "圖形演算法"

### 🚀 **Easy Code Insertion**
- **Click to Insert** - Click template cards to insert code directly into your editor
- **Drag to Insert** - Drag templates into your active editor window
- **Smart Indentation** - Automatic indentation matching your editor's context
- **Interactive Preview** - Hover to see code preview with copy/insert options
- **Multi-Editor Support** - Works seamlessly across different code editors

### 📖 **Documentation System**
- **Rich Documentation** - Detailed explanations for complex templates
- **Interactive Code Blocks** - Insert specific code portions from documentation
- **Smart Selection** - Select and insert only the parts you need

### 🔧 **Multi-Editor Support**
- **VS Code** - Full-featured extension with rich UI (✅ Available)
- **Vim/NeoVim** - Command-line integration (🔄 Coming Soon)
- **Sublime Text** - Plugin support (🔄 Planned)
- **Other Editors** - Extensible architecture for future support

### 🧠 **Intelligent Features**
- **Template Recommendations** - Context-aware suggestions based on usage
- **Smart Copy** - Automatic fallback to clipboard when editor unavailable
- **Template Management** - Create, edit, import/export templates with validation
- **Enhanced Search** - Advanced filtering, sorting, and suggestion capabilities
- **Data Validation** - Comprehensive template and import data validation

## 🚀 Quick Start

### Installation

#### VS Code (Current)
1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=timcsy.textbricks)
2. Reload VS Code
3. Find TextBricks in the Activity Bar

#### Other Editors (Coming Soon)
- **Vim/NeoVim**: Plugin installation via package managers
- **Sublime Text**: Package Control integration
- **Manual Installation**: Download from [GitHub Releases](https://github.com/timcsy/textbricks-extensions/releases)

### Basic Usage (VS Code)
1. **Open a code file** (`.c`, `.py`, `.js`, etc.)
2. **Open TextBricks panel** from the activity bar
3. **Select your language** using the language selector (🌐)
4. **Browse templates** by topic
5. **Click templates** to insert or **drag** to editor
6. **Check recommendations** (⭐ section) for personalized suggestions

### Usage in Other Editors
Support for additional editors is under development with the same core functionality adapted to each editor's interface.

### Smart Indentation
- **Auto-adjusts** to your cursor position
- **Preserves structure** of nested code
- **Handles empty lines** intelligently
- **Consistent behavior** across all insertion methods

### Documentation
- **Hover templates** to see preview tooltips
- **Click 📖 icon** for detailed documentation
- **Interactive blocks** - click to insert specific code portions
- **Full Markdown support** with syntax highlighting

## 📋 Commands

- `TextBricks: Open TextBricks Manager` - Launch template management interface
- `TextBricks: Create Template` - Quick template creation with validation
- `TextBricks: Import Templates` - Import from JSON files with comprehensive validation
- `TextBricks: Export Templates` - Export to JSON format with metadata
- `TextBricks: Search Templates` - Advanced search with filtering and sorting
- `TextBricks: Validate Template` - Validate current file against template standards
- `TextBricks: Refresh Templates` - Reload template data
- `TextBricks: Show Documentation` - View template documentation

## 📚 Template Examples

### C - Hello World
```c
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
```

### Python - For Loop
```python
for i in range(10):
    print(f"Number: {i}")
```

### JavaScript - Function
```javascript
function greet(name) {
    return `Hello, ${name}!`;
}

console.log(greet("World"));
```

## ⚙️ Configuration

Access settings via `File > Preferences > Settings > Extensions > TextBricks`:

- **Language Preference** - Default language selection
- **Indentation Settings** - Customize indentation behavior  
- **Recommendation Engine** - Enable/disable smart suggestions
- **Documentation Display** - Control documentation panel behavior

## 🛠️ Template Management

### Creating Templates
1. Use `TextBricks: Create Template` command
2. Or create via TextBricks Manager interface
3. Support for custom topics and documentation

### Import/Export
- **Import**: JSON files with template collections and comprehensive validation
- **Export**: Share your templates with others including metadata and topics
- **Format**: Structured JSON with enhanced metadata support and error handling
- **Validation**: Automatic validation of imported data with detailed error reporting

### Organization
- **Flexible Topics**: Create unlimited custom topic names for perfect organization
- **Semantic Naming**: Use meaningful topic names instead of artificial level numbers
- **Educational Support**: Perfect for creating course-specific topic structures
- **Project Organization**: Organize templates by development project needs
- **Tags**: Add searchable metadata for enhanced discoverability
- **Documentation**: Rich Markdown descriptions with interactive code blocks

## 🐛 Troubleshooting

### Common Issues
- **Templates not showing**: Try `TextBricks: Refresh Templates`
- **Indentation problems**: Check your editor tab/space settings
- **Insert not working**: Ensure you have an active editor
- **Language not detected**: Manually select language in panel

### Reporting Issues
- Include VS Code and extension version
- Describe steps to reproduce
- Check [GitHub Issues](https://github.com/timcsy/textbricks-extensions/issues)

## 🔧 What's New in v0.2.4

### 🏗️ Major Architecture Improvements
- **Modular Manager System**: Separated platform-independent business logic into specialized managers (ImportExportManager, SearchManager, ValidationManager)
- **Unified Command Service**: Consolidated all command handling with integrated validation and enhanced error handling
- **Code Cleanup**: Removed 200+ lines of unimplemented features and over-designed interfaces for a cleaner, more maintainable codebase
- **Platform Abstraction**: Enhanced separation between UI layer (VSCode) and business logic (Core) for future multi-editor support

### ✨ Enhanced Features
- **Advanced Search**: Improved search capabilities with filtering, sorting, and intelligent suggestions
- **Comprehensive Validation**: Template and import data validation with detailed error reporting
- **Flexible Topic System**: Revolutionary topic system replacing rigid level-based categorization with customizable topic names
- **Custom Topics**: Create meaningful topic names like "基礎概念", "網頁開發", "演算法" instead of generic levels
- **Enhanced UI**: Cleaner interface without level badges, focusing on content and semantic organization
- **Error Handling**: Enhanced error handling and user feedback throughout the application

### 🎯 Developer Benefits
- **Cleaner Architecture**: Easier to maintain, test, and extend
- **Type Safety**: Complete TypeScript interfaces for all new components
- **Future-Ready**: Prepared for hierarchical topics and cross-platform expansion
- **Better Performance**: Optimized code structure and reduced complexity

## 🤝 Contributing

We welcome contributions! See our [GitHub repository](https://github.com/timcsy/textbricks-extensions) for:
- Source code and multi-editor development
- Issue reporting and bug fixes
- Feature requests for new editors
- Documentation improvements
- Template contributions for all languages

## 📄 License

This project is licensed under the MIT License.

---

**Made with ❤️ for programming learners**

Happy coding with TextBricks! 🧱✨