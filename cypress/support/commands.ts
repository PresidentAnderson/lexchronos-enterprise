/// <reference types="cypress" />

// Custom command declarations
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      logout(): Chainable<void>
      clearAllLocalStorage(): Chainable<void>
      clearAllSessionStorage(): Chainable<void>
      seedDatabase(data: any): Chainable<void>
      clearDatabase(): Chainable<void>
      checkAccessibility(context?: string, options?: any): Chainable<void>
      getByTestId(selector: string): Chainable<JQuery<HTMLElement>>
      typeSlowly(text: string, options?: any): Chainable<void>
    }
  }
}

// Authentication commands
Cypress.Commands.add('login', (
  email = Cypress.env('TEST_USER_EMAIL'),
  password = Cypress.env('TEST_USER_PASSWORD')
) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.getByTestId('email-input').type(email)
    cy.getByTestId('password-input').type(password)
    cy.getByTestId('login-button').click()
    
    // Wait for login to complete
    cy.url().should('not.include', '/login')
    cy.window().its('localStorage').should('have.property', 'accessToken')
  })
})

Cypress.Commands.add('logout', () => {
  cy.window().then((window) => {
    window.localStorage.removeItem('accessToken')
    window.localStorage.removeItem('refreshToken')
    window.localStorage.removeItem('user')
  })
  
  cy.visit('/login')
})

// Database commands
Cypress.Commands.add('seedDatabase', (data) => {
  cy.task('seedDatabase', data)
})

Cypress.Commands.add('clearDatabase', () => {
  cy.task('clearDatabase')
})

// Accessibility testing
Cypress.Commands.add('checkAccessibility', (context, options) => {
  cy.checkA11y(context, options, (violations) => {
    violations.forEach((violation) => {
      const nodes = Cypress.$(violation.nodes.map(node => node.target).join(','))
      
      Cypress.log({
        name: 'a11y error!',
        consoleProps: () => violation,
        $el: nodes,
        message: `${violation.id} on ${violation.nodes.length} element${violation.nodes.length === 1 ? '' : 's'}`
      })
    })
  })
})

// Utility commands
Cypress.Commands.add('getByTestId', (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`)
})

Cypress.Commands.add('typeSlowly', { prevSubject: 'element' }, (subject, text, options = {}) => {
  cy.wrap(subject).type(text, { delay: 100, ...options })
})

// Custom assertions
Cypress.Commands.add('shouldBeVisible', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible')
})

Cypress.Commands.add('shouldContainText', { prevSubject: 'element' }, (subject, text) => {
  cy.wrap(subject).should('contain.text', text)
})

// API testing helpers
Cypress.Commands.add('apiRequest', (method: string, url: string, body?: any, headers?: any) => {
  const token = localStorage.getItem('accessToken')
  
  return cy.request({
    method,
    url: `${Cypress.env('API_URL')}${url}`,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    failOnStatusCode: false,
  })
})

// Form helpers
Cypress.Commands.add('fillForm', (formData: Record<string, string>) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.getByTestId(`${field}-input`).clear().type(value)
  })
})

Cypress.Commands.add('submitForm', (formTestId = 'form') => {
  cy.getByTestId(formTestId).submit()
})

// Wait helpers
Cypress.Commands.add('waitForPageLoad', () => {
  cy.window().should('have.property', 'document')
  cy.document().should('have.property', 'readyState', 'complete')
})

Cypress.Commands.add('waitForApiCall', (alias: string) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204])
  })
})

// Mobile testing helpers
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport('iphone-x')
})

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport('ipad-2')
})

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720)
})