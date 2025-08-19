// Coverage-specific test setup
import 'jest-extended'

// Global test setup for coverage collection
beforeAll(() => {
  // Set up coverage tracking
  console.log('🔍 Coverage collection enabled')
  
  // Mock window.location for coverage tests
  delete (window as any).location
  ;(window as any).location = {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  }
  
  // Mock performance API for coverage
  if (!global.performance) {
    global.performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn(() => []),
    } as any
  }
  
  // Mock IntersectionObserver for coverage
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
  
  // Mock ResizeObserver for coverage
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
  
  // Mock media query for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
  
  // Mock canvas for coverage (if used in components)
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(4) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Array(4) })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    imageSmoothingEnabled: true,
  })) as any
})

afterAll(() => {
  // Clean up after coverage tests
  console.log('✅ Coverage collection completed')
})

// Custom matchers for coverage testing
expect.extend({
  toHaveBeenCalledWithValidProps(received, ...expectedProps) {
    const pass = expectedProps.every(prop => 
      received.mock.calls.some(call => 
        call.some(arg => arg && typeof arg === 'object' && prop in arg)
      )
    )
    
    if (pass) {
      return {
        message: () => `Expected function not to have been called with valid props`,
        pass: true,
      }
    } else {
      return {
        message: () => `Expected function to have been called with valid props: ${expectedProps.join(', ')}`,
        pass: false,
      }
    }
  },
  
  toRenderWithoutErrors(received) {
    try {
      const pass = received !== null && received !== undefined
      return {
        message: () => pass 
          ? `Expected component not to render without errors`
          : `Expected component to render without errors`,
        pass,
      }
    } catch (error) {
      return {
        message: () => `Component failed to render: ${error.message}`,
        pass: false,
      }
    }
  },
})

// Global error handling for coverage tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

// Coverage reporter helper
global.coverageReporter = {
  log: (message: string) => {
    console.log(`📊 Coverage: ${message}`)
  },
  
  warn: (message: string) => {
    console.warn(`⚠️ Coverage Warning: ${message}`)
  },
  
  error: (message: string) => {
    console.error(`❌ Coverage Error: ${message}`)
  },
}