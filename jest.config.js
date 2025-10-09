module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/__tests__/**',
    '!packages/*/src/**/index.ts'
  ],
  moduleNameMapper: {
    '^@textbricks/core$': '<rootDir>/packages/core/src',
    '^@textbricks/shared$': '<rootDir>/packages/shared/src',
    '^@textbricks/vscode$': '<rootDir>/packages/vscode/src'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  }
};
