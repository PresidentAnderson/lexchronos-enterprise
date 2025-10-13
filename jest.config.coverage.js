const baseConfig = require('./jest.config.js')

// Extended Jest configuration specifically for coverage reporting
module.exports = {
  ...baseConfig,
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: [
    'text',           // Console output
    'text-summary',   // Brief summary
    'html',           // HTML report
    'lcov',           // LCOV format for external tools
    'json',           // JSON format
    'json-summary',   // JSON summary
    'clover',         // Clover XML format
    'cobertura',      // Cobertura XML format
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    // Include source files
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
    'src/**/*.{js,jsx,ts,tsx}',
    
    // Exclude files that shouldn't be tested
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/tests/**',
    '!**/cypress/**',
    '!**/test-results/**',
    '!**/.next/**',
    '!**/build/**',
    '!**/dist/**',
    '!**/out/**',
    '!**/public/**',
    '!**/*.config.{js,ts}',
    '!**/*.setup.{js,ts}',
    '!**/coverage.config.{js,ts}',
    
    // Exclude specific files
    '!app/layout.tsx',
    '!app/globals.css',
    '!next.config.ts',
    '!tailwind.config.ts',
    '!postcss.config.mjs',
    '!eslint.config.mjs',
  ],
  
  // Coverage thresholds - enforce minimum coverage levels
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    // Specific thresholds for different directories
    './lib/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    './utils/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
    './components/': {
      statements: 75,
      branches: 70,
      functions: 75,
      lines: 75,
    },
    './app/api/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
  },
  
  // Coverage path ignoring
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/cypress/',
    '/test-results/',
    '/tests/playwright/',
    '/tests/mobile/',
    '\\.config\\.(js|ts)$',
    '\\.setup\\.(js|ts)$',
  ],
  
  // Additional test environment setup for coverage
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/jest.coverage.setup.js'
  ],
}