import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/playwright',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/playwright-report.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Global timeout for each action */
    actionTimeout: 10000,

    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable additional Chrome features for testing
        launchOptions: {
          args: [
            '--enable-web-bluetooth',
            '--enable-features=VaapiVideoDecoder',
            '--disable-features=TranslateUI',
            '--disable-extensions',
          ]
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true,
          }
        }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit-specific settings
      },
    },

    // Microsoft Edge
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },

    // Mobile Browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },

    // Tablet Browsers
    {
      name: 'Tablet Chrome',
      use: {
        ...devices['Galaxy Tab S4'],
      },
    },
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro'],
      },
    },

    // High-DPI Displays
    {
      name: 'Desktop Chrome HiDPI',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
      },
    },

    // Different Screen Sizes
    {
      name: 'Small Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'Large Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Ultra Wide',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3440, height: 1440 },
      },
    },

    // Accessibility Testing
    {
      name: 'Chrome Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Settings for accessibility testing
        reducedMotion: 'reduce',
        forcedColors: 'none',
        colorScheme: 'light',
      },
    },
    {
      name: 'High Contrast',
      use: {
        ...devices['Desktop Chrome'],
        forcedColors: 'active',
        colorScheme: 'dark',
      },
    },

    // Slow Network Testing
    {
      name: 'Chrome Slow Network',
      use: {
        ...devices['Desktop Chrome'],
        // Throttle network to simulate slow connections
        offline: false,
        // This would be set via context options in actual tests
      },
    },

    // Geolocation Testing
    {
      name: 'Chrome with Location',
      use: {
        ...devices['Desktop Chrome'],
        geolocation: { latitude: 40.7128, longitude: -74.0060 }, // New York
        permissions: ['geolocation'],
      },
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/playwright/global-setup.ts'),
  globalTeardown: require.resolve('./tests/playwright/global-teardown.ts'),

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',

  /* Web Server Configuration */
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
    },
  },

  /* Test timeout */
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  /* Configure test metadata */
  metadata: {
    project: 'LexChronos',
    testType: 'cross-browser',
  },
})