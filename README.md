# TextBricks

A multi-editor extension providing structured programming templates for multiple languages (C, Python, JavaScript) to help beginners learn programming efficiently.

> **🎉 Version 0.2.3** - Critical bug fixes for template insertion indentation! Completely resolved text selection insertion issues and enhanced smart indentation system for perfect code formatting.

## ✨ Features

### 🌐 **Multi-Language Support**
- **C** - Traditional system programming language
- **Python** - Modern, beginner-friendly language  
- **JavaScript** - Web development and scripting
- Easy language switching with integrated selector

### 🎯 **Structured Learning Path**
Templates organized into progressive categories:
- **Basic Syntax** - Hello World, Variables, Input/Output
- **Control Structures** - Conditionals, loops, program flow
- **Functions & Data** - Function definition, data structures
- **Advanced Applications** - OOP, file operations, complex patterns

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
- **Template Management** - Create, edit, import/export templates

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
4. **Browse templates** by category
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

- `TextBricks: Open Template Manager` - Launch template management interface
- `TextBricks: Create Template` - Quick template creation
- `TextBricks: Import Templates` - Import from JSON files  
- `TextBricks: Export Templates` - Export to JSON format
- `TextBricks: Refresh Templates` - Reload template data

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
2. Or create via Template Manager interface
3. Support for custom categories and documentation

### Import/Export
- **Import**: JSON files with template collections
- **Export**: Share your templates with others
- **Format**: Structured JSON with metadata support

### Organization
- **Categories**: Group templates by learning level
- **Tags**: Add searchable metadata
- **Documentation**: Rich Markdown descriptions

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