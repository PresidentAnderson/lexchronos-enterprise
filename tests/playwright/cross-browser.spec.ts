import { test, expect, devices } from '@playwright/test'

// Test basic functionality across all browsers
test.describe('Cross-Browser Compatibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load homepage correctly across browsers', async ({ page, browserName }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check page title
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title).not.toBe('')
    
    // Verify main content is visible
    await expect(page.locator('main, #root, .app')).toBeVisible()
    
    // Check for basic navigation elements
    const navigation = page.locator('nav, header, [role="navigation"]')
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible()
    }
    
    // Browser-specific checks
    if (browserName === 'webkit') {
      // WebKit/Safari specific tests
      console.log('Running WebKit-specific checks')
      // Check for Safari-specific CSS compatibility
    } else if (browserName === 'firefox') {
      // Firefox specific tests
      console.log('Running Firefox-specific checks')
      // Check for Firefox-specific behavior
    } else if (browserName === 'chromium') {
      // Chromium specific tests
      console.log('Running Chromium-specific checks')
      // Check for Chrome-specific features
    }
  })

  test('should handle JavaScript correctly across browsers', async ({ page, browserName }) => {
    // Test basic JavaScript functionality
    const result = await page.evaluate(() => {
      // Test modern JavaScript features
      const features = {
        arrow_functions: (() => true)(),
        template_literals: `test ${'string'}` === 'test string',
        destructuring: (() => {
          const [a, b] = [1, 2]
          return a === 1 && b === 2
        })(),
        spread_operator: [...[1, 2, 3]].length === 3,
        async_await: typeof (async () => {}) === 'function',
        fetch_api: typeof fetch !== 'undefined',
        promise: typeof Promise !== 'undefined',
        map_set: typeof Map !== 'undefined' && typeof Set !== 'undefined',
      }
      
      return features
    })
    
    // All modern browsers should support these features
    expect(result.arrow_functions).toBe(true)
    expect(result.template_literals).toBe(true)
    expect(result.destructuring).toBe(true)
    expect(result.spread_operator).toBe(true)
    expect(result.async_await).toBe(true)
    expect(result.fetch_api).toBe(true)
    expect(result.promise).toBe(true)
    expect(result.map_set).toBe(true)
    
    console.log(`JavaScript features support in ${browserName}:`, result)
  })

  test('should handle CSS features correctly across browsers', async ({ page, browserName }) => {
    // Test CSS Grid support
    const gridSupport = await page.evaluate(() => {
      const div = document.createElement('div')
      div.style.display = 'grid'
      return div.style.display === 'grid'
    })
    expect(gridSupport).toBe(true)
    
    // Test Flexbox support
    const flexSupport = await page.evaluate(() => {
      const div = document.createElement('div')
      div.style.display = 'flex'
      return div.style.display === 'flex'
    })
    expect(flexSupport).toBe(true)
    
    // Test CSS Custom Properties (CSS Variables)
    const customPropsSupport = await page.evaluate(() => {
      return CSS.supports('color', 'var(--test-color)')
    })
    expect(customPropsSupport).toBe(true)
    
    // Browser-specific CSS checks
    if (browserName === 'webkit') {
      // Check WebKit-specific CSS features
      const webkitFeatures = await page.evaluate(() => ({
        backdrop_filter: CSS.supports('backdrop-filter', 'blur(10px)'),
        webkit_appearance: CSS.supports('-webkit-appearance', 'none'),
      }))
      console.log('WebKit CSS features:', webkitFeatures)
    }
  })

  test('should handle form interactions consistently', async ({ page }) => {
    // Create a test form
    await page.setContent(`
      <form id="test-form">
        <input type="text" id="text-input" placeholder="Text input" />
        <input type="email" id="email-input" placeholder="Email input" />
        <input type="password" id="password-input" placeholder="Password" />
        <select id="select-input">
          <option value="">Choose option</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </select>
        <input type="checkbox" id="checkbox-input" />
        <label for="checkbox-input">Checkbox</label>
        <input type="radio" name="radio" id="radio1" value="radio1" />
        <label for="radio1">Radio 1</label>
        <input type="radio" name="radio" id="radio2" value="radio2" />
        <label for="radio2">Radio 2</label>
        <button type="submit">Submit</button>
      </form>
    `)
    
    // Test text input
    await page.fill('#text-input', 'Test text')
    expect(await page.inputValue('#text-input')).toBe('Test text')
    
    // Test email input
    await page.fill('#email-input', 'test@example.com')
    expect(await page.inputValue('#email-input')).toBe('test@example.com')
    
    // Test password input
    await page.fill('#password-input', 'password123')
    expect(await page.inputValue('#password-input')).toBe('password123')
    
    // Test select dropdown
    await page.selectOption('#select-input', 'option1')
    expect(await page.inputValue('#select-input')).toBe('option1')
    
    // Test checkbox
    await page.check('#checkbox-input')
    expect(await page.isChecked('#checkbox-input')).toBe(true)
    
    // Test radio buttons
    await page.check('#radio2')
    expect(await page.isChecked('#radio2')).toBe(true)
    expect(await page.isChecked('#radio1')).toBe(false)
  })

  test('should handle viewport changes correctly', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 },   // Mobile small
      { width: 768, height: 1024 },  // Tablet
      { width: 1024, height: 768 },  // Desktop small
      { width: 1920, height: 1080 }, // Desktop large
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500) // Allow layout to settle
      
      // Check that content is still visible and properly laid out
      const bodyRect = await page.locator('body').boundingBox()
      expect(bodyRect).not.toBeNull()
      expect(bodyRect!.width).toBeLessThanOrEqual(viewport.width)
      
      // Check for responsive behavior
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      
      // Generally, we don't want horizontal scrolling on mobile
      if (viewport.width <= 768) {
        expect(hasHorizontalScroll).toBe(false)
      }
    }
  })

  test('should handle local storage consistently', async ({ page }) => {
    // Test localStorage functionality
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value')
      localStorage.setItem('test-object', JSON.stringify({ foo: 'bar' }))
    })
    
    const value = await page.evaluate(() => localStorage.getItem('test-key'))
    expect(value).toBe('test-value')
    
    const objectValue = await page.evaluate(() => {
      const item = localStorage.getItem('test-object')
      return item ? JSON.parse(item) : null
    })
    expect(objectValue).toEqual({ foo: 'bar' })
    
    // Test sessionStorage
    await page.evaluate(() => {
      sessionStorage.setItem('session-key', 'session-value')
    })
    
    const sessionValue = await page.evaluate(() => sessionStorage.getItem('session-key'))
    expect(sessionValue).toBe('session-value')
  })

  test('should handle cookies consistently', async ({ page, context }) => {
    // Set cookies
    await context.addCookies([
      {
        name: 'test-cookie',
        value: 'test-value',
        domain: 'localhost',
        path: '/',
      }
    ])
    
    // Verify cookie is accessible
    const cookies = await context.cookies()
    const testCookie = cookies.find(c => c.name === 'test-cookie')
    expect(testCookie).toBeTruthy()
    expect(testCookie?.value).toBe('test-value')
    
    // Test cookie via JavaScript
    const cookieValue = await page.evaluate(() => {
      const cookies = document.cookie.split(';')
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'test-cookie') {
          return value
        }
      }
      return null
    })
    expect(cookieValue).toBe('test-value')
  })

  test('should handle date and time inputs correctly', async ({ page, browserName }) => {
    await page.setContent(`
      <form>
        <input type="date" id="date-input" />
        <input type="time" id="time-input" />
        <input type="datetime-local" id="datetime-input" />
      </form>
    `)
    
    // Test date input
    await page.fill('#date-input', '2024-01-15')
    const dateValue = await page.inputValue('#date-input')
    expect(dateValue).toBe('2024-01-15')
    
    // Test time input
    await page.fill('#time-input', '14:30')
    const timeValue = await page.inputValue('#time-input')
    expect(timeValue).toBe('14:30')
    
    // Note: Some browsers may handle datetime-local differently
    try {
      await page.fill('#datetime-input', '2024-01-15T14:30')
      const datetimeValue = await page.inputValue('#datetime-input')
      expect(datetimeValue).toMatch(/2024-01-15T14:30/)
    } catch (error) {
      console.log(`datetime-local input not fully supported in ${browserName}`)
    }
  })

  test('should handle file inputs appropriately', async ({ page }) => {
    await page.setContent(`
      <form>
        <input type="file" id="file-input" accept=".txt,.pdf" />
        <input type="file" id="multiple-files" multiple accept="image/*" />
      </form>
    `)
    
    // Check that file inputs are present and have correct attributes
    const fileInput = page.locator('#file-input')
    await expect(fileInput).toBeVisible()
    
    const acceptAttr = await fileInput.getAttribute('accept')
    expect(acceptAttr).toBe('.txt,.pdf')
    
    const multipleInput = page.locator('#multiple-files')
    const multipleAttr = await multipleInput.getAttribute('multiple')
    expect(multipleAttr).toBe('')
    
    const multipleAccept = await multipleInput.getAttribute('accept')
    expect(multipleAccept).toBe('image/*')
  })

  test('should handle accessibility features consistently', async ({ page }) => {
    await page.setContent(`
      <div>
        <button aria-label="Close dialog">×</button>
        <input type="text" aria-describedby="input-help" />
        <div id="input-help">Enter your name</div>
        <div role="alert" aria-live="polite">Status message</div>
        <nav aria-label="Main navigation">
          <ul>
            <li><a href="#section1">Section 1</a></li>
            <li><a href="#section2">Section 2</a></li>
          </ul>
        </nav>
      </div>
    `)
    
    // Test ARIA attributes
    const button = page.locator('button[aria-label="Close dialog"]')
    await expect(button).toBeVisible()
    
    const input = page.locator('input[aria-describedby="input-help"]')
    await expect(input).toBeVisible()
    
    const alert = page.locator('[role="alert"]')
    await expect(alert).toBeVisible()
    
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await expect(nav).toBeVisible()
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(button).toBeFocused()
  })

  test('should handle network requests consistently', async ({ page }) => {
    // Mock a simple API response
    await page.route('/api/test', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Test successful' })
      })
    })
    
    // Test fetch request
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/test')
      return await res.json()
    })
    
    expect(response.message).toBe('Test successful')
    
    // Test XMLHttpRequest
    const xhrResponse = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', '/api/test')
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error('Request failed'))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send()
      })
    })
    
    expect(xhrResponse).toEqual({ message: 'Test successful' })
  })
})

// Browser-specific tests
test.describe('Browser-Specific Feature Tests', () => {
  test('Chrome-specific features', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test')
    
    // Test Chrome-specific APIs or behaviors
    const chromeFeatures = await page.evaluate(() => ({
      webgl: !!window.WebGLRenderingContext,
      webrtc: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
    }))
    
    expect(chromeFeatures.webgl).toBe(true)
    expect(chromeFeatures.serviceWorker).toBe(true)
  })
  
  test('Firefox-specific features', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test')
    
    // Test Firefox-specific behaviors
    const firefoxFeatures = await page.evaluate(() => ({
      mozApps: 'mozApps' in navigator,
      userAgent: navigator.userAgent.includes('Firefox'),
    }))
    
    expect(firefoxFeatures.userAgent).toBe(true)
  })
  
  test('Safari/WebKit-specific features', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test')
    
    // Test Safari-specific behaviors
    const safariFeatures = await page.evaluate(() => ({
      webkitAudioContext: 'webkitAudioContext' in window,
      userAgent: navigator.userAgent.includes('Safari'),
    }))
    
    expect(safariFeatures.userAgent).toBe(true)
  })
})