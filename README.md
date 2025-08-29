# TextBricks

A VSCode extension providing structured C programming templates for beginners to learn programming efficiently.

<!-- TextBricks Logo -->

## Features

### 🎯 **Structured Learning Path**
TextBricks organizes C programming concepts into 4 progressive levels:

- **Level 1: Basic Syntax** - Hello World, Variables, Input/Output
- **Level 2: Control Structures** - If-Else, For Loops, While Loops  
- **Level 3: Functions & Arrays** - Function Definition, 1D/2D Arrays
- **Level 4: Advanced Concepts** - Pointers, Structs, File I/O

### 🚀 **Easy Code Insertion**
- **Click to Copy**: Click any template card to copy code to clipboard
- **Drag to Insert**: Drag template cards directly into your editor
- **Interactive Preview**: Hover eye button to see detailed code preview
- **Tooltip Dragging**: Drag code directly from preview tooltips

### 🎨 **Clean Interface**
- Integrated sidebar panel in VS Code
- Collapsible category sections
- Template cards with clear descriptions
- Language tags and visual feedback

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
2. **Open a C file** (`.c` or `.h`)
3. **Find TextBricks panel** in the activity bar sidebar
4. **Browse templates** organized by learning level
5. **Click or drag** templates to use them

### Template Categories

#### 📚 Level 1: Basic Syntax
```c
// Hello World - Your first C program
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}
```

#### 🔧 Level 2: Control Structures  
```c
// For Loop - Basic iteration
for (int i = 0; i < 10; i++) {
    printf("第 %d 次迴圈\n", i + 1);
}
```

#### ⚙️ Level 3: Functions & Arrays
```c
// Function Definition - Reusable code blocks
int add(int a, int b) {
    return a + b;
}
```

#### 🎖️ Level 4: Advanced Concepts
```c
// Basic Pointer - Memory addresses
int number = 42;
int *ptr = &number;
printf("Value: %d\n", *ptr);
```

## Development

### Project Structure
```
TextBricks-VSCode/
├── src/                    # TypeScript source code
│   ├── extension.ts        # Main extension file
│   ├── commands/           # Command handlers
│   ├── providers/          # Webview and template providers
│   ├── services/           # Business logic services
│   ├── models/             # Data models
│   └── data/               # Template data
├── media/                  # Webview assets
│   ├── main.js             # Frontend JavaScript
│   └── style.css           # UI styling
├── icons/                  # Extension icons
├── package.json            # Extension manifest
└── README.md               # This file
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
- **Webview Panel**: HTML/CSS/JS frontend for template display
- **Template Manager**: Handles loading and formatting of code templates
- **Drag & Drop**: Native VS Code APIs for seamless code insertion

## Contributing

We welcome contributions! Here's how you can help:

### Adding New Templates
1. Edit `src/data/templates.json`
2. Add your template with proper category and metadata
3. Test the template in the webview
4. Submit a pull request

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

- Currently no configurable settings
- Future versions may include customization options

## Known Issues

- Tooltip positioning may need adjustment on different screen sizes
- Some complex templates may require manual formatting after insertion

## Release Notes

### 1.0.0
- Initial release with 4 learning levels
- 13 essential C programming templates
- Click-to-copy and drag-to-insert functionality
- Interactive tooltip previews
- Collapsible category sections

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: See [PRD.md](PRD.md) for detailed specifications
- **Issues**: Report bugs on GitHub Issues
- **Email**: Contact the development team for support

---

**Made with ❤️ for C programming learners**

Happy coding with TextBricks! 🧱✨