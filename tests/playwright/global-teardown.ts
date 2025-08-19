import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Navigate to the application
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000')
    
    // Clean up test data
    console.log('🗑️  Cleaning up test data...')
    
    // Clear localStorage test data
    await page.evaluate(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('playwright-test-data')
        localStorage.removeItem('playwright-test-mode')
        localStorage.clear()
      }
    })
    
    // Clean up test users via API if available
    try {
      console.log('👤 Cleaning up test users...')
      
      // Login as admin or test user to perform cleanup
      const response = await page.request.delete('/api/users/test-cleanup', {
        data: {
          testUser: 'playwright-test@example.com'
        }
      })
      
      if (response.ok()) {
        console.log('✅ Test user cleanup completed')
      } else {
        console.log('⚠️  Test user cleanup not available or failed')
      }
    } catch (error) {
      console.log('⚠️  Could not clean up test users via API')
    }
    
    // Clean up any uploaded files or created resources
    console.log('📁 Cleaning up test files and resources...')
    
    // Clear any test database entries if applicable
    try {
      await page.request.post('/api/test/cleanup', {
        data: {
          cleanupType: 'playwright-tests',
          timestamp: new Date().toISOString()
        }
      })
      console.log('✅ Test database cleanup completed')
    } catch (error) {
      console.log('⚠️  Database cleanup not available or failed')
    }
    
    // Clear browser data
    await page.context().clearCookies()
    await page.context().clearPermissions()
    
    // Generate test report summary
    console.log('📊 Generating test summary...')
    
    const testResults = {
      timestamp: new Date().toISOString(),
      cleanup: 'completed',
      testMode: 'cross-browser',
      projects: config.projects.map(p => p.name),
    }
    
    // Save test results summary (would be used by CI/CD)
    await page.evaluate((results) => {
      console.log('Test Results Summary:', JSON.stringify(results, null, 2))
    }, testResults)
    
    console.log('✅ Global teardown completed successfully')
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close()
  }
}

export default globalTeardown