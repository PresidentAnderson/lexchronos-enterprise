// Appium configuration for native mobile app testing
// This would be used if LexChronos has native mobile apps

module.exports = {
  // Appium server configuration
  host: 'localhost',
  port: 4723,
  logLevel: 'info',
  
  // Common capabilities
  commonCapabilities: {
    platformName: 'Android', // or 'iOS'
    automationName: 'UiAutomator2', // or 'XCUITest' for iOS
    newCommandTimeout: 300,
    fullReset: false,
    noReset: true,
    unicodeKeyboard: true,
    resetKeyboard: true,
  },
  
  // Test configurations for different devices
  configurations: [
    // Android Configurations
    {
      name: 'Android Emulator - Pixel 5',
      capabilities: {
        platformName: 'Android',
        platformVersion: '11.0',
        deviceName: 'Pixel_5_API_30',
        avd: 'Pixel_5_API_30',
        automationName: 'UiAutomator2',
        app: './apps/lexchrono-android.apk', // Path to Android APK
        appPackage: 'com.lexchrono.app',
        appActivity: 'com.lexchrono.app.MainActivity',
        autoGrantPermissions: true,
        chromedriverExecutable: '/usr/local/bin/chromedriver',
      }
    },
    {
      name: 'Android Real Device - Samsung Galaxy S21',
      capabilities: {
        platformName: 'Android',
        platformVersion: '12',
        deviceName: 'Samsung Galaxy S21',
        udid: 'DEVICE_UDID_HERE', // Real device UDID
        automationName: 'UiAutomator2',
        app: './apps/lexchrono-android.apk',
        appPackage: 'com.lexchrono.app',
        appActivity: 'com.lexchrono.app.MainActivity',
        autoGrantPermissions: true,
      }
    },
    
    // iOS Configurations
    {
      name: 'iOS Simulator - iPhone 14',
      capabilities: {
        platformName: 'iOS',
        platformVersion: '16.0',
        deviceName: 'iPhone 14',
        automationName: 'XCUITest',
        app: './apps/LexChronos.app', // Path to iOS app
        bundleId: 'com.lexchrono.app',
        simulator: true,
        autoAcceptAlerts: true,
        autoDismissAlerts: false,
      }
    },
    {
      name: 'iOS Real Device - iPhone 14 Pro',
      capabilities: {
        platformName: 'iOS',
        platformVersion: '16.0',
        deviceName: 'iPhone 14 Pro',
        udid: 'DEVICE_UDID_HERE', // Real device UDID
        automationName: 'XCUITest',
        app: './apps/LexChronos.app',
        bundleId: 'com.lexchrono.app',
        xcodeOrgId: 'YOUR_TEAM_ID',
        xcodeSigningId: 'iPhone Developer',
        updatedWDABundleId: 'com.lexchrono.WebDriverAgentRunner',
      }
    },
    
    // Tablet Configurations
    {
      name: 'iPad Air Simulator',
      capabilities: {
        platformName: 'iOS',
        platformVersion: '16.0',
        deviceName: 'iPad Air (5th generation)',
        automationName: 'XCUITest',
        app: './apps/LexChronos.app',
        bundleId: 'com.lexchrono.app',
        simulator: true,
        orientation: 'LANDSCAPE',
      }
    },
    {
      name: 'Android Tablet - Galaxy Tab S8',
      capabilities: {
        platformName: 'Android',
        platformVersion: '12',
        deviceName: 'Galaxy Tab S8',
        automationName: 'UiAutomator2',
        app: './apps/lexchrono-android.apk',
        appPackage: 'com.lexchrono.app',
        appActivity: 'com.lexchrono.app.MainActivity',
        orientation: 'LANDSCAPE',
      }
    }
  ],
  
  // Mobile browser testing (WebView/Browser apps)
  webConfigurations: [
    {
      name: 'Chrome Mobile - Android',
      capabilities: {
        platformName: 'Android',
        platformVersion: '11.0',
        deviceName: 'Pixel_5_API_30',
        browserName: 'Chrome',
        automationName: 'UiAutomator2',
        chromeOptions: {
          args: ['--disable-web-security', '--allow-running-insecure-content'],
          w3c: false,
        },
      }
    },
    {
      name: 'Safari Mobile - iOS',
      capabilities: {
        platformName: 'iOS',
        platformVersion: '16.0',
        deviceName: 'iPhone 14',
        browserName: 'Safari',
        automationName: 'XCUITest',
        simulator: true,
      }
    }
  ],
  
  // Test execution settings
  testSettings: {
    timeout: 60000,
    retries: 2,
    parallel: false, // Set to true for parallel execution
    screenshotPath: './test-results/mobile-screenshots',
    videoPath: './test-results/mobile-videos',
  },
  
  // Desired capabilities for different test types
  testTypes: {
    smoke: {
      timeout: 30000,
      retries: 1,
    },
    regression: {
      timeout: 120000,
      retries: 2,
    },
    performance: {
      timeout: 180000,
      retries: 0,
      collectPerformanceMetrics: true,
    }
  },
  
  // Custom hooks and utilities
  hooks: {
    beforeSession: async (capabilities) => {
      console.log('Setting up mobile test session for:', capabilities.deviceName)
      // Custom setup logic
    },
    afterSession: async (capabilities) => {
      console.log('Cleaning up mobile test session for:', capabilities.deviceName)
      // Custom cleanup logic
    },
    beforeTest: async (test) => {
      console.log('Starting mobile test:', test.title)
      // Per-test setup
    },
    afterTest: async (test, result) => {
      console.log('Completed mobile test:', test.title, 'Result:', result.status)
      // Per-test cleanup and reporting
    }
  },
  
  // Services and plugins
  services: [
    'appium',
    'shared-store',
    'timeline',
  ],
  
  // Reporters
  reporters: [
    'spec',
    ['junit', {
      outputDir: './test-results/mobile',
      outputFileFormat: function(options) {
        return `mobile-${options.cid}.${options.capabilities.deviceName}.xml`
      }
    }],
    ['html-nice', {
      outputDir: './test-results/mobile-reports',
      filename: 'mobile-test-report.html',
      reportTitle: 'LexChronos Mobile Test Report',
    }]
  ],
  
  // Framework configuration
  framework: 'mocha',
  mochaOpts: {
    timeout: 120000,
    compilers: ['js:@babel/register'],
  },
  
  // Spec patterns
  specs: [
    './tests/mobile/specs/**/*.spec.js'
  ],
  
  // Exclude patterns
  exclude: [
    './tests/mobile/specs/**/skip-*.spec.js'
  ],
  
  // Maximum instances to run
  maxInstances: 1, // Mobile testing is typically sequential
  
  // Base URL for web-based mobile tests
  baseUrl: 'http://localhost:3000',
  
  // Wait timeout for elements
  waitforTimeout: 20000,
  
  // Connection retry count
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  
  // Custom commands directory
  commandsDir: './tests/mobile/commands',
  
  // Page objects directory
  pageObjectsDir: './tests/mobile/pageobjects',
}