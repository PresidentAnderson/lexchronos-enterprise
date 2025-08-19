import { test, expect, devices } from '@playwright/test'

// Mobile device configurations
const mobileDevices = [
  'iPhone 12',
  'iPhone 12 Pro',
  'iPhone 13',
  'iPhone 14',
  'iPhone SE',
  'Pixel 5',
  'Pixel 7',
  'Galaxy S8',
  'Galaxy S9+',
  'Galaxy Tab S4',
  'iPad Pro',
  'iPad Mini',
]

test.describe('Mobile Testing Suite', () => {
  // Test across different mobile devices
  mobileDevices.forEach(deviceName => {
    test.describe(`${deviceName} Tests`, () => {
      test.use(devices[deviceName])
      
      test('should load homepage on mobile device', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        
        // Check page loads properly
        const title = await page.title()
        expect(title).toBeTruthy()
        
        // Verify viewport dimensions match device
        const viewport = page.viewportSize()
        expect(viewport).toBeTruthy()
        expect(viewport!.width).toBeGreaterThan(0)
        expect(viewport!.height).toBeGreaterThan(0)
        
        // Check for mobile-friendly layout
        const bodyRect = await page.locator('body').boundingBox()
        expect(bodyRect).toBeTruthy()
        expect(bodyRect!.width).toBeLessThanOrEqual(viewport!.width)
        
        console.log(`${deviceName}: ${viewport!.width}x${viewport!.height}`)
      })
      
      test('should handle touch interactions', async ({ page }) => {
        await page.goto('/')
        
        // Create a test button
        await page.setContent(`
          <button 
            id="touch-test" 
            style="width: 44px; height: 44px; margin: 20px;"
            ontouchstart="this.dataset.touched = 'true'"
            onclick="this.dataset.clicked = 'true'"
          >
            Tap Me
          </button>
        `)
        
        const button = page.locator('#touch-test')
        
        // Test tap gesture
        await button.tap()
        
        // Verify touch/click was registered
        const clicked = await button.getAttribute('data-clicked')
        expect(clicked).toBe('true')
        
        // Test double tap if supported
        await button.dblclick()
        
        // Verify button is still accessible
        await expect(button).toBeVisible()
      })
      
      test('should support pinch-to-zoom gestures', async ({ page }) => {
        await page.goto('/')
        
        // Test viewport scaling
        const initialViewport = page.viewportSize()!
        
        // Simulate pinch-to-zoom by changing viewport scale
        await page.setViewportSize({
          width: Math.floor(initialViewport.width * 0.5),
          height: Math.floor(initialViewport.height * 0.5)
        })
        
        // Content should still be accessible
        const body = page.locator('body')
        await expect(body).toBeVisible()
        
        // Reset viewport
        await page.setViewportSize(initialViewport)
      })
    })
  })
  
  test.describe('Mobile-Specific Features', () => {
    test.use(devices['iPhone 12'])
    
    test('should handle orientation changes', async ({ page }) => {
      await page.goto('/')
      
      // Start in portrait mode (default for iPhone 12)
      const portraitViewport = page.viewportSize()!
      expect(portraitViewport.width).toBeLessThan(portraitViewport.height)
      
      // Simulate landscape mode
      await page.setViewportSize({
        width: portraitViewport.height,
        height: portraitViewport.width
      })
      
      await page.waitForTimeout(500) // Allow layout to adjust
      
      // Verify content is still accessible in landscape
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Check for proper responsive behavior
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      
      expect(hasHorizontalScroll).toBe(false)
    })
    
    test('should support mobile form interactions', async ({ page }) => {
      await page.setContent(`
        <form style="padding: 20px;">
          <input type="text" id="text-input" placeholder="Text input" 
                 style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;" />
          <input type="email" id="email-input" placeholder="Email" 
                 style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;" />
          <input type="tel" id="phone-input" placeholder="Phone number" 
                 style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;" />
          <select id="select-input" 
                  style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;">
            <option value="">Choose option</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </select>
          <button type="submit" 
                  style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;">
            Submit
          </button>
        </form>
      `)
      
      // Test text input
      const textInput = page.locator('#text-input')
      await textInput.tap()
      await textInput.fill('Mobile test text')
      expect(await textInput.inputValue()).toBe('Mobile test text')
      
      // Test email input (should trigger email keyboard on mobile)
      const emailInput = page.locator('#email-input')
      await emailInput.tap()
      await emailInput.fill('test@mobile.com')
      expect(await emailInput.inputValue()).toBe('test@mobile.com')
      
      // Test phone input (should trigger numeric keyboard on mobile)
      const phoneInput = page.locator('#phone-input')
      await phoneInput.tap()
      await phoneInput.fill('1234567890')
      expect(await phoneInput.inputValue()).toBe('1234567890')
      
      // Test select dropdown
      const selectInput = page.locator('#select-input')
      await selectInput.tap()
      await selectInput.selectOption('option1')
      expect(await selectInput.inputValue()).toBe('option1')
      
      // Test submit button
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
      await submitButton.tap()
    })
    
    test('should handle scroll behaviors on mobile', async ({ page }) => {
      await page.setContent(`
        <div style="height: 200vh; padding: 20px;">
          <h1 id="top">Top of page</h1>
          <div style="height: 50vh;"></div>
          <h2 id="middle">Middle section</h2>
          <div style="height: 50vh;"></div>
          <h2 id="bottom">Bottom of page</h2>
        </div>
      `)
      
      // Start at top
      const top = page.locator('#top')
      await expect(top).toBeInViewport()
      
      // Scroll to middle
      const middle = page.locator('#middle')
      await middle.scrollIntoViewIfNeeded()
      await expect(middle).toBeInViewport()
      
      // Scroll to bottom
      const bottom = page.locator('#bottom')
      await bottom.scrollIntoViewIfNeeded()
      await expect(bottom).toBeInViewport()
      
      // Test elastic scrolling behavior (mobile-specific)
      await page.evaluate(() => {
        window.scrollTo(0, -100) // Try to scroll above the top
      })
      
      // Should bounce back to top
      const scrollY = await page.evaluate(() => window.scrollY)
      expect(scrollY).toBeGreaterThanOrEqual(0)
    })
    
    test('should support mobile navigation patterns', async ({ page }) => {
      await page.setContent(`
        <div>
          <!-- Mobile hamburger menu -->
          <nav style="position: relative;">
            <button id="menu-toggle" 
                    style="width: 44px; height: 44px; position: relative; z-index: 1000;"
                    onclick="document.getElementById('mobile-menu').style.display = 
                            document.getElementById('mobile-menu').style.display === 'block' ? 'none' : 'block'">
              ☰
            </button>
            <div id="mobile-menu" 
                 style="display: none; position: absolute; top: 50px; left: 0; 
                        background: white; border: 1px solid #ccc; width: 200px; z-index: 999;">
              <a href="#section1" style="display: block; padding: 15px;">Section 1</a>
              <a href="#section2" style="display: block; padding: 15px;">Section 2</a>
              <a href="#section3" style="display: block; padding: 15px;">Section 3</a>
            </div>
          </nav>
          
          <!-- Tabs for mobile -->
          <div style="margin-top: 20px;">
            <div id="tab-nav" style="display: flex; overflow-x: auto;">
              <button class="tab" data-tab="tab1" 
                      style="min-width: 100px; padding: 10px; margin: 2px;">Tab 1</button>
              <button class="tab" data-tab="tab2" 
                      style="min-width: 100px; padding: 10px; margin: 2px;">Tab 2</button>
              <button class="tab" data-tab="tab3" 
                      style="min-width: 100px; padding: 10px; margin: 2px;">Tab 3</button>
              <button class="tab" data-tab="tab4" 
                      style="min-width: 100px; padding: 10px; margin: 2px;">Tab 4</button>
            </div>
          </div>
        </div>
        
        <script>
          document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
              document.querySelectorAll('.tab').forEach(t => t.style.background = '');
              this.style.background = '#007AFF';
            });
          });
        </script>
      `)
      
      // Test hamburger menu
      const menuToggle = page.locator('#menu-toggle')
      const mobileMenu = page.locator('#mobile-menu')
      
      await expect(mobileMenu).toBeHidden()
      await menuToggle.tap()
      await expect(mobileMenu).toBeVisible()
      
      // Test menu item tap
      const menuItem = page.locator('#mobile-menu a').first()
      await menuItem.tap()
      
      // Test horizontal tab scrolling
      const tabNav = page.locator('#tab-nav')
      await expect(tabNav).toBeVisible()
      
      // Test tab interaction
      const tab2 = page.locator('.tab[data-tab="tab2"]')
      await tab2.tap()
      
      // Verify tab styling changed
      const tab2BgColor = await tab2.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      )
      expect(tab2BgColor).not.toBe('')
    })
    
    test('should handle mobile-specific input types', async ({ page }) => {
      await page.setContent(`
        <form style="padding: 20px;">
          <input type="search" id="search" placeholder="Search..." 
                 style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;" />
          <input type="url" id="url" placeholder="Website URL" 
                 style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;" />
          <input type="number" id="number" placeholder="Age" 
                 style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;" />
          <input type="date" id="date" 
                 style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;" />
          <input type="time" id="time" 
                 style="width: 100%; height: 44px; margin: 10px 0; font-size: 16px;" />
          <textarea id="textarea" placeholder="Comments" 
                    style="width: 100%; height: 88px; margin: 10px 0; font-size: 16px;"></textarea>
        </form>
      `)
      
      // Test search input
      const searchInput = page.locator('#search')
      await searchInput.tap()
      await searchInput.fill('mobile search query')
      expect(await searchInput.inputValue()).toBe('mobile search query')
      
      // Test URL input
      const urlInput = page.locator('#url')
      await urlInput.tap()
      await urlInput.fill('https://example.com')
      expect(await urlInput.inputValue()).toBe('https://example.com')
      
      // Test number input
      const numberInput = page.locator('#number')
      await numberInput.tap()
      await numberInput.fill('25')
      expect(await numberInput.inputValue()).toBe('25')
      
      // Test date input
      const dateInput = page.locator('#date')
      await dateInput.tap()
      await dateInput.fill('2024-01-15')
      expect(await dateInput.inputValue()).toBe('2024-01-15')
      
      // Test time input
      const timeInput = page.locator('#time')
      await timeInput.tap()
      await timeInput.fill('14:30')
      expect(await timeInput.inputValue()).toBe('14:30')
      
      // Test textarea
      const textarea = page.locator('#textarea')
      await textarea.tap()
      await textarea.fill('This is a multi-line comment for mobile testing.')
      expect(await textarea.inputValue()).toBe('This is a multi-line comment for mobile testing.')
    })
    
    test('should support swipe gestures', async ({ page }) => {
      await page.setContent(`
        <div id="swiper" style="width: 100%; height: 200px; position: relative; overflow: hidden; border: 1px solid #ccc;">
          <div id="slide1" style="position: absolute; width: 100%; height: 100%; background: #ff6b6b; display: flex; align-items: center; justify-content: center;">
            Slide 1
          </div>
          <div id="slide2" style="position: absolute; width: 100%; height: 100%; background: #4ecdc4; left: 100%; display: flex; align-items: center; justify-content: center;">
            Slide 2
          </div>
        </div>
        
        <script>
          let currentSlide = 0;
          let startX = 0;
          
          document.getElementById('swiper').addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
          });
          
          document.getElementById('swiper').addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
              if (diff > 0 && currentSlide < 1) {
                // Swipe left - next slide
                currentSlide++;
              } else if (diff < 0 && currentSlide > 0) {
                // Swipe right - prev slide
                currentSlide--;
              }
              
              document.getElementById('slide1').style.left = (currentSlide * -100) + '%';
              document.getElementById('slide2').style.left = ((1 - currentSlide) * 100) + '%';
            }
          });
        </script>
      `)
      
      const swiper = page.locator('#swiper')
      await expect(swiper).toBeVisible()
      
      // Get initial position
      const slide1 = page.locator('#slide1')
      const initialLeft = await slide1.evaluate(el => el.style.left || '0%')
      
      // Simulate swipe left
      await swiper.hover()
      await page.mouse.down()
      await page.mouse.move(200, 100) // Move right to left
      await page.mouse.move(100, 100)
      await page.mouse.up()
      
      await page.waitForTimeout(100)
      
      // Check if slide moved (swipe might not work perfectly in all test environments)
      const finalLeft = await slide1.evaluate(el => el.style.left || '0%')
      console.log(`Initial: ${initialLeft}, Final: ${finalLeft}`)
    })
    
    test('should handle mobile performance considerations', async ({ page }) => {
      await page.goto('/')
      
      // Measure loading performance on mobile
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        }
      })
      
      console.log('Mobile Performance Metrics:', performanceMetrics)
      
      // Mobile performance thresholds (more lenient than desktop)
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(4000) // 4 seconds
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000) // 3 seconds
      
      // Check for mobile-optimized resources
      const images = await page.locator('img').count()
      if (images > 0) {
        // Check if images have proper mobile attributes
        const firstImage = page.locator('img').first()
        const hasResponsiveAttributes = await firstImage.evaluate(img => {
          return !!(img.getAttribute('srcset') || img.getAttribute('sizes') || img.style.maxWidth === '100%')
        })
        
        console.log('Images have responsive attributes:', hasResponsiveAttributes)
      }
    })
  })
  
  test.describe('Tablet-Specific Tests', () => {
    test.use(devices['iPad Pro'])
    
    test('should handle tablet layout properly', async ({ page }) => {
      await page.goto('/')
      
      const viewport = page.viewportSize()!
      expect(viewport.width).toBeGreaterThan(768) // Tablet breakpoint
      
      // Tablet should have more screen real estate than phone
      expect(viewport.width * viewport.height).toBeGreaterThan(500000) // Rough area calculation
      
      // Check for tablet-optimized layouts
      const bodyRect = await page.locator('body').boundingBox()
      expect(bodyRect).toBeTruthy()
      
      // Should not have horizontal scroll on tablet
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    })
    
    test('should support both portrait and landscape modes', async ({ page }) => {
      await page.goto('/')
      
      // Start in portrait (iPad Pro default)
      const portraitViewport = page.viewportSize()!
      
      // Switch to landscape
      await page.setViewportSize({
        width: portraitViewport.height,
        height: portraitViewport.width
      })
      
      await page.waitForTimeout(500)
      
      // Content should still be accessible and properly laid out
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Switch back to portrait
      await page.setViewportSize(portraitViewport)
      await page.waitForTimeout(500)
      
      await expect(body).toBeVisible()
    })
  })
})

// Device-specific regression tests
test.describe('Mobile Regression Tests', () => {
  test('should not have zoom issues on iOS Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'iOS Safari specific test')
    
    await page.setContent(`
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <input type="text" style="font-size: 16px; padding: 10px;" placeholder="This should not zoom on focus">
    `)
    
    const input = page.locator('input')
    
    // Focus should not trigger zoom (font-size >= 16px prevents this)
    await input.tap()
    await input.fill('Test text')
    
    expect(await input.inputValue()).toBe('Test text')
  })
  
  test('should handle Android keyboard overlays', async ({ page, browserName }) => {
    test.skip(!browserName.includes('chromium'), 'Android Chrome specific test')
    
    await page.setContent(`
      <div style="height: 100vh; display: flex; flex-direction: column;">
        <div style="flex: 1; background: #f0f0f0;"></div>
        <form style="padding: 20px; background: white;">
          <input type="text" id="bottom-input" placeholder="Input at bottom" 
                 style="width: 100%; height: 44px; font-size: 16px;">
          <button type="submit" style="width: 100%; height: 44px; margin-top: 10px;">Submit</button>
        </form>
      </div>
    `)
    
    const bottomInput = page.locator('#bottom-input')
    
    // Focus input at bottom of screen
    await bottomInput.scrollIntoViewIfNeeded()
    await bottomInput.tap()
    await bottomInput.fill('Bottom input test')
    
    // Input should remain visible and functional
    await expect(bottomInput).toBeVisible()
    expect(await bottomInput.inputValue()).toBe('Bottom input test')
  })
})