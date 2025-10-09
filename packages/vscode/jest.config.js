module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/extension.ts'
  ],
  moduleNameMapper: {
    '^@textbricks/core$': '<rootDir>/../core/src',
    '^@textbricks/shared$': '<rootDir>/../shared/src',
    '^vscode$': '<rootDir>/src/__mocks__/vscode.ts'
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
