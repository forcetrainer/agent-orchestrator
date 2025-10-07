const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock react-markdown and remark-gfm (ESM-only packages)
    '^react-markdown$': '<rootDir>/__mocks__/react-markdown.tsx',
    '^remark-gfm$': '<rootDir>/__mocks__/remark-gfm.ts',
    // Mock uuid (ESM-only package)
    '^uuid$': '<rootDir>/__mocks__/uuid.ts',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  // Use jsdom by default for component tests
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.test.ts',
    '<rootDir>/**/__tests__/**/*.test.tsx',
    '<rootDir>/**/__tests__/**/*.integration.test.ts',
  ],
  globalSetup: undefined,
  globalTeardown: undefined,
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
