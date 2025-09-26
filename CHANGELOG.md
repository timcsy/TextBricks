# Changelog

All notable changes to the TextBricks extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-09-26

### ✨ New Features
- **Browsing History Navigation**: Added browser-like back/forward navigation based on actual browsing history
  - Smart history management that automatically clears forward history when navigating to new pages
  - Dynamic button states (enabled/disabled) based on history availability
  - Intelligent tooltips showing target page titles
  - Loading animations and visual feedback for navigation actions
- **Clickable Breadcrumb Navigation**: Enhanced breadcrumb navigation with clickable path elements
  - Click on any breadcrumb segment to navigate directly to that level
  - Uses displayName from managed topics for better readability
  - Integrated with browsing history system
- **Centralized Language Management**: Introduced scope.json for unified language and topic configuration
  - Centralized language definitions with id, name, displayName, tagName, description, fileExtensions, icon, and color
  - Template cards now display short tagNames (C, PY, JS) instead of full language names
  - Added language property to all template files for future language conversion features
- **Hierarchical Topic System Foundation**: Implemented topic.json structure for v0.3.0 architecture
  - Individual topic.json files with id, name, displayName, description, documentation
  - Subtopic hierarchy support with configurable templates/links folder structure
  - Display configuration with icon, color, order, collapsed state, and navigation visibility
  - Cross-topic link system for topic navigation (e.g., basic → advanced topics)
- **Enhanced Template Preview System**: Fixed template card preview functionality
  - Resolved missing language properties causing preview failures
  - Updated JavaScript selectors to handle both .template-title and .card-title formats
  - Added comprehensive null checks and fallback logic for robust preview display

### 🎨 UI/UX Improvements
- **Unified Scrollable Containers**: Standardized all topic areas to use 3.5 card height scrollable containers
  - Consistent scrolling experience across recommended templates and topic areas
  - Improved scrollbar styling integrated with VSCode theme
  - Better space utilization with fixed container heights
- **Navigation Controls Layout**: Enhanced breadcrumb navigation area with integrated history buttons
  - Flexible layout accommodating both breadcrumbs and navigation controls
  - Professional button styling with hover and active states
  - Responsive design maintaining usability across different sidebar widths

### 🔧 Technical Improvements
- **History Management System**: Implemented robust browsing history tracking in WebviewProvider
  - `_browsingHistory` array storing complete navigation path
  - `_historyIndex` for precise history position tracking
  - Prevents duplicate entries and manages history state transitions
- **Enhanced Navigation Logic**:
  - `_handleBackNavigation()` and `_handleForwardNavigation()` for history-based navigation
  - `_getPageTitle()` method for intelligent page title resolution
  - Integration with existing topic navigation system
- **Improved Event Handling**: Updated JavaScript navigation event handlers
  - `handlePageNavigationClick()` for history navigation messages
  - Visual feedback with loading states and opacity changes
  - Better separation of concerns between different navigation types
- **Topic System Architecture**: Established foundation for hierarchical topic management
  - Scope configuration system with `_loadScopeConfig()` and `_getLanguageTagName()` methods
  - Topic.json file structure supporting nested subtopics and configurable folders
  - Link system implementation for cross-topic references and navigation
  - Display configuration management for topic presentation and behavior

### 🎯 Developer Experience
- **Comprehensive Logging**: Added detailed console logging for navigation state tracking
- **Type Safety**: Enhanced TypeScript interfaces for navigation state management
- **Maintainable Code**: Clear separation between UI, business logic, and state management

## [0.2.5] - 2025-09-19

### 🎨 UI/UX Improvements
- **Template Card Display**: Fixed template cards being cut off in the middle due to CSS overflow issues
- **Responsive Layout**: Optimized grid breakpoints for VSCode sidebar - adjusted multi-column layout thresholds (400px → 500px, 600px → 800px)
- **Template Card Sizing**: Increased minimum height (55px → 70px) and improved padding for better content visibility
- **Scrolling Behavior**: Removed restrictive overflow constraints and max-height limitations for smoother scrolling
- **Description Text**: Enhanced text wrapping and removed forced truncation for better readability
- **Visual Hierarchy**: Improved template description color contrast (lighter text for better visual separation)

### 🔧 Technical Fixes
- **CSS Syntax**: Fixed malformed CSS rules causing display issues
- **Container Layout**: Improved flexbox layout for better space utilization
- **Grid Overflow**: Changed templates grid from `overflow: hidden` to `overflow: visible` for complete content display
- **Card Dimensions**: Added proper box-sizing and width constraints for consistent rendering

### 🎯 User Experience
- **Content Accessibility**: All template content now fully visible without unexpected cutoffs
- **Better Readability**: Improved text contrast and spacing for easier template browsing
- **Responsive Design**: Optimized layout specifically for VSCode sidebar width constraints
- **Consistent Rendering**: Fixed cross-platform display inconsistencies

## [0.2.4] - 2025-09-15

### 🧹 Major Refactoring & Code Cleanup
- **System-wide Cleanup**: Removed unnecessary components including ContextAnalysisService, over-designed interfaces, and duplicate TemplateProvider
- **Modular Manager Architecture**: Created platform-independent managers: ImportExportManager, SearchManager, ValidationManager
- **Unified Command Service**: Consolidated all command handling into CommandService with integrated validation and search capabilities
- **Code Simplification**: Removed 200+ lines of unimplemented TODO methods and over-engineered features

### 🏗️ Architecture Improvements
- **Platform Abstraction**: Extracted platform-independent business logic from VSCode layer to Core layer
- **Manager Pattern**: New modular managers for import/export, search/filtering, and data validation
- **Responsibility Separation**: Clear separation between UI (VSCode), business logic (Core), and data models (Shared)
- **Future-Ready**: Prepared architecture for hierarchical topics where languages become root nodes

### ✨ Topic System Enhancement (Previous Update)
- **Topic System Refactoring**: Replaced rigid level-based categorization (level1-4) with flexible topic-based system
- **Customizable Topics**: Users can now define custom topic names like "基礎概念", "網頁開發", "演算法" etc.
- **Semantic Topic Names**: Updated from `level1-4` to free-form topic names: "基礎", "控制", "函數", "進階"
- **UI Simplification**: Removed level badges for cleaner interface focused on content
- **TextBricks Manager Enhancement**: Topic input system with text field instead of numeric level restrictions

### 🔧 Technical Enhancements
- **Type Safety**: Complete TypeScript interfaces for all new managers with proper exports
- **Error Handling**: Comprehensive validation and error handling in CommandService
- **Search Capabilities**: Enhanced search with filtering, sorting, and suggestion features
- **Import/Export**: Robust template import/export with validation and error reporting
- **Data Model Update**: Removed `TemplateCategory` entirely, using `Template.topic` string for complete flexibility
- **Forward Compatibility**: Automatic migration from old level-based data to new topic system

### 📦 Removed Components
- **ContextAnalysisService**: Eliminated 200+ lines of unimplemented context analysis methods
- **Over-designed Interfaces**: Removed ProgrammingContext, ContextualRecommendation, UserProfile, LearningContext
- **Duplicate Code**: Removed TemplateProvider that duplicated WebviewProvider functionality
- **Empty Methods**: Cleaned up unused compatibility methods in TextBricksEngine

### 🎯 Development Benefits
- **Cleaner Codebase**: More maintainable and focused codebase without unused complexity
- **Modular Design**: Easy to test, extend, and maintain individual components
- **Platform Independence**: Core business logic can be reused across different platforms
- **Hierarchical Ready**: Architecture prepared for upcoming language-as-root-node topic hierarchy
- **Greater Flexibility**: Educators can create course-specific topics, developers can organize by project needs
- **Better Scalability**: Support for unlimited custom topics instead of fixed 4 levels

## [0.2.3] - 2025-09-05

### 🐛 Critical Bug Fixes
- **Template Text Selection Insertion**: Completely resolved indentation issues when selecting and inserting partial template content
- **Target Indentation Handling**: Fixed cursor position indentation not being properly considered during code insertion
- **Relative Indentation Logic**: Corrected FormattingEngine to properly combine target indentation with relative indentation levels
- **Edge Cases**: Properly handle closing braces and same-level lines alignment

### 🔧 Technical Improvements
- **FormattingEngine Optimization**: Enhanced `formatCodeSnippetWithTemplate` method with improved logic
- **Indentation Calculation**: Fixed formula to use `targetIndentation + indentUnit.repeat(indentLevels)` instead of just relative indentation
- **User Experience**: Template selection and insertion now works flawlessly with correct indentation preservation
- **Debugging Enhancement**: Added comprehensive logging and error handling for formatting operations

### 📦 Package Updates
- **Version Synchronization**: Updated all packages (@textbricks/shared, @textbricks/core, @textbricks/vscode) to v0.2.3
- **Dependencies**: Synchronized inter-package dependencies to maintain consistency
- **Build System**: Successful VSIX generation (textbricks-0.2.3.vsix, 497.36KB)

### 🎯 Impact
- **Complete Resolution**: Template text selection insertion indentation problem fully solved
- **User Satisfaction**: No more frustrating indentation issues when working with selected template content
- **Code Quality**: Enhanced formatting engine stability and reliability

## [0.2.2] - 2025-09-05

### 🔧 Fixed
- **Template Loading**: Removed hardcoded `info.name === 'Visual Studio Code'` detection that caused failures across different VS Code environments
- **Dynamic Imports**: Replaced synchronous require() with dynamic imports for better compatibility
- **Template Path Resolution**: Added multiple fallback paths for VSIX package template loading
- **Deprecated APIs**: Fixed deprecated `substr()` calls, replaced with `substring()`

### 🏗️ Architecture Improvements  
- **Capability-Based Detection**: Replaced brittle string comparisons with platform capability detection
- **VSIX Path Structure**: Enhanced template loading to support packaged extension paths
- **Robust Fallbacks**: Multiple template location attempts for different deployment scenarios

### 🛠️ Build & Release
- **VSIX Output Structure**: Configured generation to `dist/plugins/vscode/` with versioning support
- **Version Management**: Added `current` → `v0.2.2` symbolic links for release management
- **Cleanup**: Removed unnecessary `jest.config.js` after monorepo migration

## [0.2.1] - 2025-09-05

### 🔧 Fixed
- **TextBricks Manager Layout**: Fixed broken layout caused by incorrect asset paths
- **Resource Loading**: Corrected CSS and JS file loading paths from `media/` to `assets/`
- **Documentation Provider**: Fixed asset path references for proper styling
- **Build System**: Ensured all asset files are correctly copied to build output

### 🛠️ Improved
- **Asset Management**: Unified all media resources under `assets/` directory structure
- **Development Experience**: Removed path confusion between media and assets folders

## [0.2.0] - 2025-09-05

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
- **TextBricks Manager Integration**: Edit and preview documentation with modal preview window
- **Side Panel Display**: Documentation opens in editor side panel with syntax highlighting
- **Smart Content Detection**: Automatically distinguish between file paths, URLs, and Markdown content
- **UI Integration**: Documentation buttons in hover tooltips (📖 icon) for clean interface
- **Standard Format**: Consistent documentation structure with overview, examples, and key concepts
- **Multiple Doc Types**: Support for embedded Markdown, local files (.md), and external URLs

### Fixed
- **TextBricks Manager**: Resolved loading issues and documentation content processing

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
- **TextBricks Manager**: Comprehensive template management interface with CRUD operations
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