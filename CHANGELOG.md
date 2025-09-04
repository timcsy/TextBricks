# Changelog

All notable changes to the TextBricks extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-05

### 🏗️ Major Architecture Overhaul - Multi-Platform Foundation

#### ✨ Added
- **Monorepo Structure**: Complete migration to npm workspaces with `packages/core`, `packages/shared`, `packages/vscode`
- **Unified Build System**: Centralized dist/ directory structure supporting multiple platform plugins
- **Platform-Agnostic Core**: TextBricksEngine with full abstraction from VS Code APIs
- **Standard Asset Organization**: Unified assets/ structure following project conventions
- **Enhanced Build Scripts**: Dedicated VS Code build, package, and archive workflows
- **Multi-Platform Ready**: Foundation prepared for Vim, Sublime Text, and other editor plugins

#### 🔧 Changed
- **File Structure**: Reorganized from flat structure to modular monorepo architecture
- **Asset Management**: Moved icons/ and media/ into standardized assets/ directory
- **Build Targets**: Updated TypeScript compilation to target dist/plugins/vscode/current/
- **Documentation**: Consolidated project documentation with comprehensive guides

#### 🛠️ Improved  
- **Type Safety**: Enhanced TypeScript interfaces and platform abstractions
- **Code Organization**: Clear separation between core logic and platform adapters
- **Build Performance**: Optimized compilation and asset copying workflows
- **Version Management**: Automated VSIX archiving and version control

#### 🗂️ Infrastructure
- **Gitignore**: Complete dist/ directory exclusion to prevent large file tracking
- **Package Scripts**: New build:vscode, package:vscode, archive:vscode commands
- **Asset Pipeline**: Automated copying of CSS, JS, and icon resources
- **Documentation**: Updated AGENTS.md, CLAUDE.md, and project guides

## [0.1.8] - 2024-12-XX

### 🏗️ Architecture Refactor - Multi-Platform Support

#### Added
- **Platform Abstraction Layer**: Complete separation of core logic from VS Code APIs
- **Multi-Platform Architecture**: Extensible design for Vim, NeoVim, Chrome, Obsidian, Zed support
- **Core Services**: Platform-agnostic TextBricksEngine, DocumentationService, SearchService, CodeOperationService
- **Adapter Pattern**: VSCode-specific adapters (VSCodeEditor, VSCodeUI, VSCodeStorage, VSCodePlatform)
- **Type-Safe Interfaces**: Comprehensive TypeScript interfaces for all platform integrations

#### Changed
- **Unified Template Engine**: Refactored TemplateEngine → TextBricksEngine with platform abstraction
- **Modular Design**: Clear separation of concerns with layered architecture
- **Code Organization**: Better file structure with dedicated core/ and adapters/ directories

#### Technical Improvements
- **Zero Breaking Changes**: Backward compatibility maintained for existing VS Code functionality
- **Improved Maintainability**: Centralized business logic, reduced code duplication
- **Enhanced Testability**: Core services can be tested independently of platform APIs
- **Future-Proof**: Easy extension to new editor platforms

## [0.1.7] - 2025-01-XX

### 🧠 Smart Indentation System - Major Overhaul

#### Added
- **Unified Indentation System**: Complete rewrite with single `formatCodeSnippetUnified` method handling all insertion scenarios
- **Same-Level Detection**: Intelligent recognition when code lines are at identical indentation levels
- **Smart Cursor Analysis**: Empty line detection prevents unnecessary indentation when inserting at line start (column 0)
- **Template-Assisted Recovery**: Automatic recovery of lost indentation information using original template context
- **Comprehensive Test Suite**: Full test coverage for all indentation scenarios and edge cases

#### Changed
- **Consistent Insertion Behavior**: Tooltip and documentation insertions now use identical logic, eliminating inconsistencies
- **Provider Unification**: Both `WebviewProvider` and `DocumentationProvider` use the same formatting method
- **Improved Algorithm**: Enhanced same-level detection with better handling of mixed indentation scenarios

#### Fixed
- **Indentation Inconsistency**: Fixed bug where tooltip insertions and documentation insertions behaved differently
- **Empty Line Handling**: Fixed excessive indentation when inserting code at the start of empty lines
- **Selection Recovery**: Fixed issue where selected text from documentation lost proper indentation context

#### Technical Improvements
- **Code Duplication Elimination**: Unified codebase with single source of truth for indentation logic
- **Backward Compatibility**: Maintained existing `formatCodeSnippetWithTemplate` method for compatibility
- **Architecture Simplification**: Cleaner provider structure with shared formatting infrastructure

### 🔧 Other Improvements

#### Added
- **GitHub Codespaces Optimization**: Enhanced experience for GitHub Codespaces environment
- **Enhanced Test Coverage**: Comprehensive testing for edge cases and boundary conditions

#### Changed  
- **Code Quality**: Streamlined codebase with improved maintainability
- **Performance**: Optimized formatting algorithms and reduced redundant processing

## [0.1.6] - 2024-XX-XX

### Added
- **Interactive Code Blocks**: Documentation code blocks with insert and copy buttons
- **Smart Selection Support**: Select specific portions of code in documentation to insert/copy only that part
- **Enhanced User Experience**: Improved tooltip interactions and visual feedback

## [0.1.5] - 2024-XX-XX

### Added
- **Smart Indentation System**: Initial intelligent copy-paste with automatic indentation adjustment
- **Context-Aware Formatting**: Preserves relative indentation relationships between code lines
- **Multi-Line Template Support**: Proper handling of complex templates with nested indentation
- **Tooltip Text Selection**: Smart indentation for selected text copied from template previews
- **Seamless Integration**: Automatic operation with all copy operations without additional setup
- **Enhanced Copy Experience**: Template copying adapts to cursor position and maintains code structure

## [0.1.4] - 2024-XX-XX

### Added
- **Documentation System**: Rich Markdown documentation for templates with examples and explanations
- **Template Manager Integration**: Edit and preview documentation with modal preview window
- **Side Panel Display**: Documentation opens in editor side panel with syntax highlighting
- **Smart Content Detection**: Automatically distinguish between file paths, URLs, and Markdown content
- **UI Integration**: Documentation buttons in hover tooltips (📖 icon) for clean interface
- **Standard Format**: Consistent documentation structure with overview, examples, and key concepts
- **Multiple Doc Types**: Support for embedded Markdown, local files (.md), and external URLs

### Fixed
- **Template Manager**: Resolved loading issues and documentation content processing

## [0.1.3] - 2024-XX-XX

### Added
- **Smart Recommendation System**: AI-powered template suggestions based on usage patterns
- **Usage Tracking**: Automatic tracking of template frequency and timing
- **Visual Indicators**: Recommended templates marked with golden star icons (⭐)
- **Dynamic UI**: Smooth animations and visual feedback for better user experience
- **Golden Theme**: Unified design for recommendation sections

## [0.1.2] - 2024-XX-XX

### Added
- **Multi-Language Support**: Added Python and JavaScript templates alongside C
- **Template Manager**: Comprehensive template management interface with CRUD operations
- **JSON Batch Import**: Quick bulk template addition feature with validation
- **Import/Export**: Full template collection backup and sharing capabilities
- **Enhanced Validation**: Real-time validation for template data integrity
- **Language Selector**: Easy switching between programming languages
- **Extensible Architecture**: Built for future expansion and customization

### Changed
- **Improved UI**: Compact header design and optimized space utilization
- **Updated Repository**: Correct GitHub repository links and metadata

## [0.1.1] - 2024-XX-XX

### Added
- Initial multi-language release with template management features

## [0.1.0] - 2024-XX-XX

### Added
- Initial release of TextBricks
- Basic C language templates
- VSCode sidebar integration
- Template insertion functionality