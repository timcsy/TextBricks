# TextBricks

A VS Code extension providing structured programming templates for multiple languages (C, Python, JavaScript) to help beginners learn programming efficiently and boost developer productivity.

> **🚀 Version 0.2.5** - Latest stable release with UI/UX improvements
>
> **🔧 v0.3.0** - Currently in development with major architecture refactoring

## ✨ Features

### 🌐 Multi-Language Support
- **C** - Traditional system programming language
- **Python** - Modern, beginner-friendly language
- **JavaScript** - Web development and scripting
- Easy language switching with integrated selector

### 🎯 Flexible Topic System
Templates organized with complete customization freedom:
- **Customizable Topics** - Create your own topic names like "基礎概念", "網頁開發", "演算法"
- **Hierarchical Organization** - Unlimited nesting with topic.json configuration
- **Path-Based Identification** - Clean paths like `"c/basic/templates/hello-world"`
- **Educational Flexibility** - Perfect for educators to create course-specific topics
- **Project-Based Organization** - Organize templates by development project needs

**Example Topic Organizations:**
- **For Beginners**: "基礎" → "控制" → "迴圈" → templates
- **For Web Development**: "JavaScript" → "React" → "組件模式" → templates
- **For Algorithms**: "演算法" → "排序" → "快速排序" → templates

### 🔧 Scope System
**Trust and Source Management** - Organize templates by source and trust level
- **local scope** - Your trusted personal templates
- **Custom scopes** - Create scopes for projects, courses, or teams
- **Use Cases**:
  - Separate personal vs. team templates
  - Course management - teachers create scopes for students
  - Project-specific template sets
  - Future: Cloud sync and community sharing

### 🚀 Three Integrated Panels

#### 1. Templates Panel (Sidebar)
**Daily usage** - Quick template browsing and insertion
- **Recommendations Tab** - Personalized suggestions based on usage patterns
- **Favorites Tab** - Your bookmarked templates and topics
- **Breadcrumb Navigation** - Easy topic traversal
- **Search & Filter** - Find templates quickly
- **Design Goal**: Beginners can start using with just this panel

#### 2. Manager Panel (Full Panel)
**Template management** - Complete CRUD operations
- **Overview Page** - Quick stats and recent usage
- **Statistics Page** - Usage analytics and insights
- **Favorites Page** - Manage all favorites
- **Content Management** - Full template/topic/link CRUD
- **Languages Page** - Language configuration
- **Settings Page** - Data location management
- **Design Goal**: Complex operations need full space, avoiding sidebar clutter

#### 3. Documentation Panel (Full Panel)
**Learning and reference** - Rich documentation viewer
- **Markdown Rendering** - Full formatting support
- **Interactive Code Blocks** - Copy or insert code directly
- **Syntax Highlighting** - Powered by highlight.js
- **Template Metadata** - Language, topic, description display
- **Design Goal**: Reading documentation needs focused space

### 💡 Smart Indentation System
**Structure-aware code insertion** - FormattingEngine automatically adjusts indentation
- **Context Detection** - Analyzes cursor position and surrounding code
- **Structure Preservation** - Maintains relative indentation of template code
- **Tab/Space Detection** - Respects editor configuration
- **Consistent Behavior** - Works with click, drag, and documentation insertion

**Why not VS Code Snippets?**
- ✅ Beginner-friendly - no need to learn Tab Stop syntax
- ✅ Cross-platform consistency - works the same on Vim/Web (future)
- ✅ Structure-aware - indentation reflects code structure
- ✅ Documentation support - interactive code blocks need smart indentation

### 🧠 Recommendation System
**Personalized suggestions** - Based on your usage patterns
- **Usage Frequency** - 10x weight
- **Recent Usage** - 50x weight, 1.2x boost for last 7 days
- **Favorite Status** - Additional boost
- **Future**: Context-aware, community trends, learning progress

### 📖 Interactive Documentation
**Learn by doing** - Documentation you can interact with
- Rich Markdown rendering with custom parser
- Every code block has Copy/Insert buttons
- Direct insertion into active editor
- **Why custom parser?** Lightweight, interactive features, future extensibility

## 🏗️ Architecture

### Monorepo Structure
```
TextBricks/
├── packages/
│   ├── shared/         # Shared types and models
│   ├── core/           # Platform-agnostic core logic
│   └── vscode/         # VS Code platform adapter
├── assets/             # Webview UI resources (single source)
│   ├── js/
│   │   ├── templates-panel/  # Templates Panel modules (12 files)
│   │   ├── manager/          # Manager Panel modules (21 files)
│   │   ├── documentation/    # Documentation Panel
│   │   └── shared/           # Shared utilities
│   └── css/
│       ├── shared/           # Variables, components, utils
│       ├── templates-panel/  # Panel-specific styles
│       ├── manager/          # Panel-specific styles
│       └── documentation/    # Panel-specific styles
└── data/               # Default template data
    └── local/          # Local scope templates
```

### Core Services

#### TextBricksEngine
**Central coordinator** - Manages all core services with dependency injection

#### TopicManager
**Hierarchical topic management** - Build and maintain topic trees
- Load topic.json configurations
- Create TopicHierarchy tree structure
- Path-based identification
- Topic CRUD operations

#### ScopeManager
**Source and trust management** - Manage different template scopes
- Load available scopes
- Switch current scope
- Manage favorites and usage stats (per-scope)
- Import/export scopes

#### FormattingEngine
**Smart indentation** - Structure-aware code formatting
- `formatTemplate()` - Format with template metadata
- `formatCodeSnippet()` - Format standalone code snippets
- Tab/space detection
- Relative structure preservation

#### RecommendationService
**Personalized suggestions** - Usage-based recommendations
- Track template usage and recency
- Calculate recommendation scores
- Filter by language and context

#### DataPathService
**Platform-agnostic storage** - Cross-platform data path management
- Singleton pattern
- System standard directories (macOS: `~/Library/Application Support/TextBricks/`)
- Custom data location support
- Data migration functionality

#### DisplayNameService & PathTransformService
**Abstraction layer** - Internal path ↔ display name conversion
- Unified display name retrieval
- Path and display format conversion
- Foundation for future multi-form transformations

### Platform Adapters

**VS Code Adapters** - Encapsulate VS Code-specific APIs
- `VSCodePlatform` - Platform interface implementation
- `VSCodeEditor` - Editor abstraction
- `VSCodeUI` - User interface abstraction
- `VSCodeStorage` - Storage abstraction
- `VSCodeClipboard` - Clipboard abstraction

**Design Goal**: Prepare for Vim/Neovim, Web, and other platform support

## 📚 Documentation Structure

### Product & Specifications
- **[specs/PRD.md](./specs/PRD.md)** - Product Requirements Document
  - Three-form theory (Sequence-Structure-Topology)
  - Product positioning and core features
  - Future roadmap (v0.4 Blockly, v0.5 Node Flow, v1.0 Community+AI)

### Development Guides
- **[AGENTS.md](./AGENTS.md)** - AI Assistant Development Reference
  - Current architecture state and tech stack
  - SDD/TDD development methodologies
  - Development workflow and checklists
- **[docs/TEMPLATE_GUIDE.md](./docs/TEMPLATE_GUIDE.md)** - Template Writing Guide
  - Template creation methods
  - Language-specific guidelines
  - Best practices

### Change Logs
- **[CHANGELOG.md](./CHANGELOG.md)** - Version change summaries
- **[specs/VERSION_HISTORY.md](./specs/VERSION_HISTORY.md)** - Complete version history
- **[specs/REFACTORING_HISTORY.md](./specs/REFACTORING_HISTORY.md)** - v0.3.0 refactoring records
- **[specs/CODE_REVIEW_HISTORY.md](./specs/CODE_REVIEW_HISTORY.md)** - Code review history

## 🛠️ Development Process

This project follows **Spec-Driven Development (SDD)** and **Test-Driven Development (TDD)**:

### Spec-Driven Development (SDD)
1. **Specification First** - Define requirements and feature specs in `specs/PRD.md`
2. **Interface Definition** - Define clear interfaces using TypeScript
3. **Implementation** - Implement features based on specifications
4. **Documentation Sync** - Keep code and documentation synchronized

### Test-Driven Development (TDD)
1. **Write Tests** - Write failing test cases first
2. **Implement Features** - Write minimal viable code to pass tests
3. **Refactor** - Refactor code under test protection
4. **Continuous Validation** - Ensure all tests continue to pass

For detailed development guidelines, see [AGENTS.md](./AGENTS.md#開發模式與原則)

## 🚀 Quick Start

### Installation

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=timcsy.textbricks)
2. Reload VS Code
3. Find TextBricks icon in the Activity Bar

### Basic Usage

1. **Open a code file** (`.c`, `.py`, `.js`, etc.)
2. **Open TextBricks panel** from the activity bar
3. **Select your language** using the language selector (🌐)
4. **Browse templates** - Navigate topics in the sidebar
5. **Insert templates** - Click cards or drag to editor
6. **Check recommendations** - ⭐ Recommendations tab shows personalized suggestions
7. **Manage favorites** - ⭐ Favorites tab for quick access
8. **Open manager** - Click ⚙️ gear icon for full management interface

### Smart Indentation

- **Auto-adjusts** to your cursor position
- **Preserves structure** of nested code
- **Handles empty lines** intelligently
- **Consistent behavior** across all insertion methods (click/drag/documentation)

### Template Management

**Creating Templates:**
1. Click ⚙️ gear icon to open Manager
2. Navigate to "Content Management" page
3. Click "Create Template" button
4. Fill in template details (name, code, documentation)
5. Save template

**Importing/Exporting:**
- Import: Use command palette → "TextBricks: Import Templates"
- Export: Use command palette → "TextBricks: Export Templates"
- Format: Structured JSON with scope configuration

**Organizing Topics:**
- Use Manager's tree navigation to browse topics
- Create nested topics for hierarchical organization
- Customize topic icons, colors, and display order
- Use links to reference templates across topics

## 📋 Commands

Access via Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

- `TextBricks: Open TextBricks Manager` - Launch full management interface
- `TextBricks: Create New Template` - Quick template creation
- `TextBricks: Import Templates` - Import from JSON files
- `TextBricks: Export Templates` - Export to JSON format
- `TextBricks: Show Template Documentation` - View documentation panel
- `TextBricks: Refresh Templates` - Reload template data
- `TextBricks: Open Data Storage Location` - Open data folder
- `TextBricks: Change Data Storage Location` - Set custom data location
- `TextBricks: Reset to System Default Location` - Reset to default path

## 📚 Template Examples

### C - Hello World
```c
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
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

- **Data Location** - Custom data storage path (empty = system default)
- **Use System Default** - Toggle system default location

**Default Data Locations:**
- **macOS**: `~/Library/Application Support/TextBricks/`
- **Windows**: `%APPDATA%\TextBricks\`
- **Linux**: `~/.config/TextBricks/`

## 🔧 What's New in v0.3.0 (In Development)

### 🏗️ Core Architecture Overhaul
- **Hierarchical Topic System**: topic.json-based nested topics replacing flat structure
- **TopicManager Integration**: Centralized topic hierarchy management
- **TemplateRepository Extraction**: Clean separation of template data access
- **RecommendationService**: Unified recommendation system
- **DataPathService Singleton**: Consistent data path access
- **TextBricksEngine**: Reduced from 1,203 → 1,027 lines (-14.6%)

### 🎨 UI Layer Refactoring
- **Shared Utilities Library**: utils.js (338 lines) - DOM, events, formatting
- **CSS Component System**: variables.css + components.css (479 lines)
- **Card Template System**: Reusable template card rendering
- **Event Delegation**: Efficient event handling architecture

### 🔨 Modularization
- **Manager.js**: Split into 21 modules (~5,753 → ~2,300 lines)
  - Core: state-manager, message-handler, event-coordinator
  - UI: modal-manager, form-generator, 6 renderers
  - Handlers: 8 specialized handlers
  - Utils: data-helpers, path-helpers
- **Templates Panel**: Split into 12 functional modules
  - drag-drop-handler, tooltip-manager, navigation-handler, etc.
- **CSS Reorganization**: Panel-specific structure for better maintainability

### 🧹 Code Quality Improvements
- **Unified Recommendation Management**: Consolidated across panels
- **Platform Logging**: console.log → platform abstraction
- **Type Safety Enhancement**: Removed `any` types, added strict typing

## 🐛 Troubleshooting

### Common Issues
- **Templates not showing**: Try `TextBricks: Refresh Templates` command
- **Indentation problems**: Check your editor tab/space settings
- **Insert not working**: Ensure you have an active editor window
- **Language not detected**: Manually select language using selector (🌐)

### Reporting Issues
- Check [GitHub Issues](https://github.com/timcsy/TextBricks/issues)
- Include VS Code version and extension version
- Describe steps to reproduce
- Provide error messages from Developer Console

## 🤝 Contributing

We welcome contributions! See our [GitHub repository](https://github.com/timcsy/TextBricks) for:
- Source code and development setup
- Issue reporting and bug fixes
- Feature requests
- Documentation improvements
- Template contributions

**Development Setup:**
1. Clone repository: `git clone https://github.com/timcsy/TextBricks.git`
2. Install dependencies: `npm install`
3. Build packages: `npm run build`
4. Open in VS Code and press F5 to launch extension

See [AGENTS.md](./AGENTS.md) for detailed development guidelines.

## 📄 License

This project is licensed under the MIT License.

---

**Made with ❤️ for programming learners and developers**

Happy coding with TextBricks! 🧱✨
