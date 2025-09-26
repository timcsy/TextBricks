# Manual Tests

This directory contains manual testing scripts for TextBricks development and debugging.

## Files

### `test-cards.js`
Manual testing script for the card loading system. Tests the TextBricksEngine's ability to load and process templates, topics, and links from the data directory.

**Usage:**
```bash
cd tests/manual
node test-cards.js
```

### `test-topic-loading.js`
Simple Node.js script to validate topic.json format and structure. Tests the hierarchical topic system implementation.

**Usage:**
```bash
cd tests/manual
node test-topic-loading.js
```

### `test-topic.json`
Sample topic.json file used for testing the topic loading system. Contains example structure for hierarchical topics with display configuration.

## Purpose

These manual tests are used during development to:
- Verify core functionality outside of the VS Code environment
- Debug data loading and processing logic
- Test new topic.json format implementations
- Validate hierarchical topic system architecture

## Notes

- These tests use relative paths to access the main data directory (`../../data`)
- They require the core packages to be built (`npm run build`)
- They are intended for development and debugging, not automated testing