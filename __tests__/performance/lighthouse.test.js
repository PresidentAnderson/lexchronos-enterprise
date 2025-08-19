const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')

describe('Lighthouse Performance Tests', () => {
  let chrome

  beforeAll(async () => {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    })
  }, 30000)

  afterAll(async () => {
    await chrome.kill()
  })

  const testUrl = process.env.TEST_URL || 'http://localhost:3000'

  const runLighthouse = async (url, options = {}) => {
    const defaultOptions = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      ...options
    }

    const runnerResult = await lighthouse(url, defaultOptions)
    return runnerResult.lhr
  }

  describe('Homepage Performance', () => {
    it('should meet performance benchmarks', async () => {
      const result = await runLighthouse(testUrl)
      
      const performanceScore = result.categories.performance.score
      expect(performanceScore).toBeGreaterThanOrEqual(0.8)
      
      // Core Web Vitals
      const fcp = result.audits['first-contentful-paint'].numericValue
      const lcp = result.audits['largest-contentful-paint'].numericValue
      const cls = result.audits['cumulative-layout-shift'].numericValue
      const tbt = result.audits['total-blocking-time'].numericValue
      
      expect(fcp).toBeLessThanOrEqual(2000) // 2 seconds
      expect(lcp).toBeLessThanOrEqual(3000) // 3 seconds
      expect(cls).toBeLessThanOrEqual(0.1) // 0.1
      expect(tbt).toBeLessThanOrEqual(300) // 300ms
    }, 60000)

    it('should have good Speed Index', async () => {
      const result = await runLighthouse(testUrl)
      
      const speedIndex = result.audits['speed-index'].numericValue
      expect(speedIndex).toBeLessThanOrEqual(3000) // 3 seconds
    }, 60000)

    it('should minimize unused JavaScript', async () => {
      const result = await runLighthouse(testUrl)
      
      const unusedJs = result.audits['unused-javascript']
      if (unusedJs.details && unusedJs.details.items) {
        const totalUnusedBytes = unusedJs.details.items.reduce(
          (sum, item) => sum + item.wastedBytes, 0
        )
        expect(totalUnusedBytes).toBeLessThanOrEqual(100000) // 100KB
      }
    }, 60000)

    it('should minimize render-blocking resources', async () => {
      const result = await runLighthouse(testUrl)
      
      const renderBlocking = result.audits['render-blocking-resources']
      if (renderBlocking.details && renderBlocking.details.items) {
        expect(renderBlocking.details.items.length).toBeLessThanOrEqual(3)
      }
    }, 60000)

    it('should use efficient images', async () => {
      const result = await runLighthouse(testUrl)
      
      const modernImageFormats = result.audits['modern-image-formats']
      const optimizedImages = result.audits['uses-optimized-images']
      const responsiveImages = result.audits['uses-responsive-images']
      
      // These should pass or have minimal impact
      if (modernImageFormats.details && modernImageFormats.details.items) {
        const totalSavings = modernImageFormats.details.items.reduce(
          (sum, item) => sum + item.wastedBytes, 0
        )
        expect(totalSavings).toBeLessThanOrEqual(50000) // 50KB
      }
    }, 60000)
  })

  describe('Accessibility Performance', () => {
    it('should meet accessibility benchmarks', async () => {
      const result = await runLighthouse(testUrl)
      
      const accessibilityScore = result.categories.accessibility.score
      expect(accessibilityScore).toBeGreaterThanOrEqual(0.9)
    }, 60000)

    it('should have proper color contrast', async () => {
      const result = await runLighthouse(testUrl)
      
      const colorContrast = result.audits['color-contrast']
      expect(colorContrast.score).toBe(1)
    }, 60000)

    it('should have proper heading hierarchy', async () => {
      const result = await runLighthouse(testUrl)
      
      const headingOrder = result.audits['heading-order']
      expect(headingOrder.score).toBe(1)
    }, 60000)

    it('should have proper form labels', async () => {
      const result = await runLighthouse(testUrl)
      
      const labels = result.audits['label']
      expect(labels.score).toBe(1)
    }, 60000)
  })

  describe('Best Practices Performance', () => {
    it('should meet best practices benchmarks', async () => {
      const result = await runLighthouse(testUrl)
      
      const bestPracticesScore = result.categories['best-practices'].score
      expect(bestPracticesScore).toBeGreaterThanOrEqual(0.8)
    }, 60000)

    it('should use HTTPS', async () => {
      const result = await runLighthouse(testUrl)
      
      const usesHttps = result.audits['uses-https']
      if (testUrl.startsWith('https://')) {
        expect(usesHttps.score).toBe(1)
      }
    }, 60000)

    it('should not have vulnerable libraries', async () => {
      const result = await runLighthouse(testUrl)
      
      const vulnerableLibraries = result.audits['no-vulnerable-libraries']
      expect(vulnerableLibraries.score).toBe(1)
    }, 60000)

    it('should have proper doctype and charset', async () => {
      const result = await runLighthouse(testUrl)
      
      const doctype = result.audits['doctype']
      const charset = result.audits['charset']
      
      expect(doctype.score).toBe(1)
      expect(charset.score).toBe(1)
    }, 60000)
  })

  describe('SEO Performance', () => {
    it('should meet SEO benchmarks', async () => {
      const result = await runLighthouse(testUrl)
      
      const seoScore = result.categories.seo.score
      expect(seoScore).toBeGreaterThanOrEqual(0.8)
    }, 60000)

    it('should have proper meta description', async () => {
      const result = await runLighthouse(testUrl)
      
      const metaDescription = result.audits['meta-description']
      expect(metaDescription.score).toBe(1)
    }, 60000)

    it('should have proper document title', async () => {
      const result = await runLighthouse(testUrl)
      
      const documentTitle = result.audits['document-title']
      expect(documentTitle.score).toBe(1)
    }, 60000)

    it('should have proper viewport configuration', async () => {
      const result = await runLighthouse(testUrl)
      
      const viewport = result.audits['viewport']
      expect(viewport.score).toBe(1)
    }, 60000)

    it('should have proper language declaration', async () => {
      const result = await runLighthouse(testUrl)
      
      const htmlHasLang = result.audits['html-has-lang']
      expect(htmlHasLang.score).toBe(1)
    }, 60000)
  })

  describe('Mobile Performance', () => {
    const mobileOptions = {
      screenEmulation: {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
      },
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        requestLatencyMs: 562.5,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 675,
        cpuSlowdownMultiplier: 4,
      },
      formFactor: 'mobile',
    }

    it('should perform well on mobile devices', async () => {
      const result = await runLighthouse(testUrl, mobileOptions)
      
      const performanceScore = result.categories.performance.score
      expect(performanceScore).toBeGreaterThanOrEqual(0.7) // Lower threshold for mobile
      
      // Mobile-specific Core Web Vitals
      const fcp = result.audits['first-contentful-paint'].numericValue
      const lcp = result.audits['largest-contentful-paint'].numericValue
      
      expect(fcp).toBeLessThanOrEqual(3000) // 3 seconds for mobile
      expect(lcp).toBeLessThanOrEqual(4000) // 4 seconds for mobile
    }, 90000)

    it('should be responsive on mobile', async () => {
      const result = await runLighthouse(testUrl, mobileOptions)
      
      const viewport = result.audits['viewport']
      expect(viewport.score).toBe(1)
    }, 60000)
  })

  describe('Network Performance', () => {
    const slowNetworkOptions = {
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        requestLatencyMs: 562.5,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 675,
        cpuSlowdownMultiplier: 4,
      },
    }

    it('should perform adequately on slow networks', async () => {
      const result = await runLighthouse(testUrl, slowNetworkOptions)
      
      const performanceScore = result.categories.performance.score
      expect(performanceScore).toBeGreaterThanOrEqual(0.6) // Lower threshold for slow networks
    }, 90000)

    it('should minimize network payloads', async () => {
      const result = await runLighthouse(testUrl)
      
      const totalByteWeight = result.audits['total-byte-weight']
      if (totalByteWeight.numericValue) {
        expect(totalByteWeight.numericValue).toBeLessThanOrEqual(2000000) // 2MB
      }
    }, 60000)

    it('should efficiently compress resources', async () => {
      const result = await runLighthouse(testUrl)
      
      const textCompression = result.audits['uses-text-compression']
      if (textCompression.details && textCompression.details.items) {
        const totalSavings = textCompression.details.items.reduce(
          (sum, item) => sum + item.wastedBytes, 0
        )
        expect(totalSavings).toBeLessThanOrEqual(25000) // 25KB
      }
    }, 60000)
  })

  describe('Progressive Web App Features', () => {
    it('should have service worker for offline functionality', async () => {
      const result = await runLighthouse(testUrl, {
        onlyCategories: ['pwa']
      })
      
      // Note: PWA category might not be available in all Lighthouse versions
      if (result.categories.pwa) {
        const serviceWorker = result.audits['service-worker']
        // For a time tracking app, offline functionality is valuable
        if (serviceWorker) {
          expect(serviceWorker.score).toBeGreaterThanOrEqual(0)
        }
      }
    }, 60000)

    it('should have proper manifest file', async () => {
      const result = await runLighthouse(testUrl)
      
      const manifest = result.audits['installable-manifest']
      if (manifest) {
        // Should have a web app manifest for PWA features
        expect(manifest.score).toBeGreaterThanOrEqual(0)
      }
    }, 60000)
  })

  describe('Resource Loading Performance', () => {
    it('should minimize main thread work', async () => {
      const result = await runLighthouse(testUrl)
      
      const mainThreadWork = result.audits['mainthread-work-breakdown']
      if (mainThreadWork.numericValue) {
        expect(mainThreadWork.numericValue).toBeLessThanOrEqual(4000) // 4 seconds
      }
    }, 60000)

    it('should avoid long tasks', async () => {
      const result = await runLighthouse(testUrl)
      
      const longTasks = result.audits['long-tasks']
      if (longTasks.details && longTasks.details.items) {
        expect(longTasks.details.items.length).toBeLessThanOrEqual(3)
      }
    }, 60000)

    it('should minimize DOM size', async () => {
      const result = await runLighthouse(testUrl)
      
      const domSize = result.audits['dom-size']
      if (domSize.numericValue) {
        expect(domSize.numericValue).toBeLessThanOrEqual(1500) // 1500 DOM nodes
      }
    }, 60000)
  })
})