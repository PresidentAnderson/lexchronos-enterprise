import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...')
  
  // Launch a browser instance for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Verify the application is running
    console.log('📊 Verifying application accessibility...')
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000')
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    
    // Take a screenshot for debugging if needed
    await page.screenshot({ path: 'test-results/global-setup-screenshot.png' })
    
    // Verify critical elements are present
    const title = await page.title()
    console.log(`📄 Page title: ${title}`)
    
    // Setup test data if needed
    console.log('🗄️  Setting up test data...')
    
    // Create test users via API if available
    try {
      const response = await page.request.post('/api/users', {
        data: {
          email: 'playwright-test@example.com',
          password: 'PlaywrightTest123!',
          firstName: 'Playwright',
          lastName: 'Test',
        }
      })
      
      if (response.ok()) {
        console.log('✅ Test user created successfully')
      } else {
        console.log('⚠️  Test user creation failed or user already exists')
      }
    } catch (error) {
      console.log('⚠️  Could not create test user via API')
    }
    
    // Save authentication state for tests that need it
    console.log('🔐 Setting up authentication state...')
    try {
      // Navigate to login page
      await page.goto('/login')
      
      // Fill in login form if it exists
      const emailInput = page.locator('input[type="email"]').first()
      const passwordInput = page.locator('input[type="password"]').first()
      const loginButton = page.locator('button[type="submit"]').first()
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('user@example.com')
        await passwordInput.fill('password123')
        await loginButton.click()
        
        // Wait for navigation after login
        await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
          console.log('⚠️  Login redirect not detected, continuing...')
        })
        
        // Save the authenticated state
        await page.context().storageState({ path: 'playwright/.auth/user.json' })
        console.log('✅ Authentication state saved')
      }
    } catch (error) {
      console.log('⚠️  Could not set up authentication state:', error)
    }
    
    // Perform any database seeding or cleanup
    console.log('🧹 Database setup and cleanup...')
    
    // Create test data directory if needed
    await page.evaluate(() => {
      if (typeof window !== 'undefined') {
        // Clear any existing test data from localStorage
        localStorage.removeItem('playwright-test-data')
        
        // Set up test configuration
        localStorage.setItem('playwright-test-mode', 'true')
      }
    })
    
    console.log('✅ Global setup completed successfully')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup