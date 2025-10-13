// Import commands.js using ES2015 syntax:
import './commands'

// Import global styles for component testing
import '../../app/globals.css'

// Import React Testing Library commands
import '@testing-library/cypress/add-commands'

// Component testing specific setup
import { mount } from 'cypress/react18'

// Augment the Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)

// Component testing hooks
beforeEach(() => {
  // Mock window.matchMedia for responsive testing
  cy.window().then((win) => {
    Object.defineProperty(win, 'matchMedia', {
      writable: true,
      value: cy.stub().returns({
        matches: false,
        media: '',
        onchange: null,
        addListener: cy.stub(),
        removeListener: cy.stub(),
        addEventListener: cy.stub(),
        removeEventListener: cy.stub(),
        dispatchEvent: cy.stub(),
      }),
    })
  })

  // Mock ResizeObserver
  cy.window().then((win) => {
    win.ResizeObserver = cy.stub().returns({
      observe: cy.stub(),
      unobserve: cy.stub(),
      disconnect: cy.stub(),
    })
  })

  // Mock IntersectionObserver  
  cy.window().then((win) => {
    win.IntersectionObserver = cy.stub().returns({
      observe: cy.stub(),
      unobserve: cy.stub(),
      disconnect: cy.stub(),
    })
  })
})