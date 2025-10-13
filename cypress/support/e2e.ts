// Import commands.js using ES2015 syntax:
import './commands'

// Cypress accessibility plugin
import 'cypress-axe'

// Global configuration and setup
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false prevents Cypress from failing the test
  // Log the error for debugging
  console.error('Uncaught exception:', err)
  
  // Don't fail the test on unhandled promise rejections or other errors
  // that might occur in the application but don't affect the test
  if (err.message.includes('ResizeObserver')) {
    return false
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  
  return true
})

// Global before hook
beforeEach(() => {
  // Clear localStorage and sessionStorage before each test
  cy.clearAllLocalStorage()
  cy.clearAllSessionStorage()
  
  // Clear cookies
  cy.clearCookies()
  
  // Set common viewport
  cy.viewport(1280, 720)
  
  // Inject axe for accessibility testing
  cy.injectAxe()
})

// Global after hook
afterEach(() => {
  // Take screenshot on test failure
  cy.screenshot({ capture: 'runner', onlyOnFailure: true })
})

// Custom Cypress configuration
Cypress.Commands.add('clearAllLocalStorage', () => {
  cy.window().then((window) => {
    window.localStorage.clear()
  })
})

Cypress.Commands.add('clearAllSessionStorage', () => {
  cy.window().then((window) => {
    window.sessionStorage.clear()
  })
})