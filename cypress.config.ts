import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    fixturesFolder: 'cypress/fixtures',
    
    // Network settings
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test isolation
    testIsolation: true,
    
    // Experimental features
    experimentalSessionAndOrigin: true,
    
    setupNodeEvents(on, config) {
      // Task plugins
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        
        clearDatabase() {
          // In a real app, this would clear the test database
          console.log('Database cleared')
          return null
        },
        
        seedDatabase(data) {
          // In a real app, this would seed the test database
          console.log('Database seeded with:', data)
          return null
        },
      })

      // Browser launch options
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--disable-gpu')
          launchOptions.args.push('--no-sandbox')
          launchOptions.args.push('--disable-dev-shm-usage')
        }
        
        return launchOptions
      })

      return config
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },

  // Global configuration
  chromeWebSecurity: false,
  watchForFileChanges: true,
  
  // Environment variables
  env: {
    API_URL: 'http://localhost:3000/api',
    TEST_USER_EMAIL: 'test@example.com',
    TEST_USER_PASSWORD: 'TestPassword123!',
  },

  // Retry configuration
  retries: {
    runMode: 2,
    openMode: 0,
  },
})