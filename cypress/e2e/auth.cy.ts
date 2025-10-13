describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    cy.clearDatabase()
    cy.visit('/')
  })

  describe('User Registration', () => {
    it('should register a new user successfully', () => {
      cy.visit('/register')
      
      // Fill registration form
      cy.getByTestId('firstName-input').type('John')
      cy.getByTestId('lastName-input').type('Doe')
      cy.getByTestId('email-input').type('newuser@example.com')
      cy.getByTestId('password-input').type('SecurePass123!')
      cy.getByTestId('confirmPassword-input').type('SecurePass123!')
      
      // Submit form
      cy.getByTestId('register-button').click()
      
      // Should redirect to dashboard or login
      cy.url().should('not.include', '/register')
      
      // Should show success message
      cy.contains('Registration successful').should('be.visible')
    })

    it('should show validation errors for invalid data', () => {
      cy.visit('/register')
      
      // Submit empty form
      cy.getByTestId('register-button').click()
      
      // Should show validation errors
      cy.contains('First name is required').should('be.visible')
      cy.contains('Last name is required').should('be.visible')
      cy.contains('Email is required').should('be.visible')
      cy.contains('Password is required').should('be.visible')
    })

    it('should validate email format', () => {
      cy.visit('/register')
      
      cy.getByTestId('email-input').type('invalid-email')
      cy.getByTestId('register-button').click()
      
      cy.contains('Invalid email format').should('be.visible')
    })

    it('should validate password strength', () => {
      cy.visit('/register')
      
      cy.getByTestId('password-input').type('weak')
      cy.getByTestId('register-button').click()
      
      cy.contains('Password must be at least 8 characters').should('be.visible')
    })

    it('should validate password confirmation', () => {
      cy.visit('/register')
      
      cy.getByTestId('password-input').type('SecurePass123!')
      cy.getByTestId('confirmPassword-input').type('DifferentPass123!')
      cy.getByTestId('register-button').click()
      
      cy.contains('Passwords do not match').should('be.visible')
    })
  })

  describe('User Login', () => {
    beforeEach(() => {
      // Create a test user
      cy.seedDatabase({
        users: [{
          email: 'testuser@example.com',
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User'
        }]
      })
    })

    it('should login successfully with valid credentials', () => {
      cy.visit('/login')
      
      cy.getByTestId('email-input').type('testuser@example.com')
      cy.getByTestId('password-input').type('TestPass123!')
      cy.getByTestId('login-button').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      
      // Should show user info in navigation
      cy.getByTestId('user-menu').should('contain', 'Test User')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      
      cy.getByTestId('email-input').type('testuser@example.com')
      cy.getByTestId('password-input').type('wrongpassword')
      cy.getByTestId('login-button').click()
      
      cy.contains('Invalid credentials').should('be.visible')
      cy.url().should('include', '/login')
    })

    it('should show error for non-existent user', () => {
      cy.visit('/login')
      
      cy.getByTestId('email-input').type('nonexistent@example.com')
      cy.getByTestId('password-input').type('TestPass123!')
      cy.getByTestId('login-button').click()
      
      cy.contains('Invalid credentials').should('be.visible')
    })

    it('should validate required fields', () => {
      cy.visit('/login')
      
      cy.getByTestId('login-button').click()
      
      cy.contains('Email is required').should('be.visible')
      cy.contains('Password is required').should('be.visible')
    })

    it('should remember user session', () => {
      cy.login('testuser@example.com', 'TestPass123!')
      
      // Refresh page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('include', '/dashboard')
      cy.getByTestId('user-menu').should('be.visible')
    })
  })

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.seedDatabase({
        users: [{
          email: 'testuser@example.com',
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User'
        }]
      })
    })

    it('should request password reset', () => {
      cy.visit('/login')
      cy.contains('Forgot your password?').click()
      
      cy.url().should('include', '/forgot-password')
      
      cy.getByTestId('email-input').type('testuser@example.com')
      cy.getByTestId('reset-button').click()
      
      cy.contains('Password reset email sent').should('be.visible')
    })

    it('should show error for non-existent email', () => {
      cy.visit('/forgot-password')
      
      cy.getByTestId('email-input').type('nonexistent@example.com')
      cy.getByTestId('reset-button').click()
      
      cy.contains('Email not found').should('be.visible')
    })
  })

  describe('User Logout', () => {
    beforeEach(() => {
      cy.login('testuser@example.com', 'TestPass123!')
    })

    it('should logout successfully', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('user-menu').click()
      cy.getByTestId('logout-button').click()
      
      // Should redirect to login page
      cy.url().should('include', '/login')
      
      // Should clear user session
      cy.window().its('localStorage').should('not.have.property', 'accessToken')
    })

    it('should redirect to login when accessing protected routes after logout', () => {
      cy.logout()
      
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
    })
  })

  describe('Authentication Flow', () => {
    it('should redirect to login for protected routes', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
      
      cy.visit('/profile')
      cy.url().should('include', '/login')
      
      cy.visit('/settings')
      cy.url().should('include', '/login')
    })

    it('should redirect to dashboard when accessing login while authenticated', () => {
      cy.login('testuser@example.com', 'TestPass123!')
      
      cy.visit('/login')
      cy.url().should('include', '/dashboard')
    })

    it('should handle token expiration', () => {
      cy.login('testuser@example.com', 'TestPass123!')
      
      // Manually set expired token
      cy.window().then((win) => {
        win.localStorage.setItem('accessToken', 'expired-token')
      })
      
      cy.visit('/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })

  describe('Accessibility', () => {
    it('login page should be accessible', () => {
      cy.visit('/login')
      cy.checkAccessibility()
    })

    it('registration page should be accessible', () => {
      cy.visit('/register')
      cy.checkAccessibility()
    })

    it('should support keyboard navigation on login page', () => {
      cy.visit('/login')
      
      // Tab through form elements
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-testid', 'email-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'password-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-testid', 'login-button')
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.setMobileViewport()
    })

    it('should display login form properly on mobile', () => {
      cy.visit('/login')
      
      cy.getByTestId('login-form').should('be.visible')
      cy.getByTestId('email-input').should('be.visible')
      cy.getByTestId('password-input').should('be.visible')
      cy.getByTestId('login-button').should('be.visible')
    })

    it('should allow login on mobile devices', () => {
      cy.seedDatabase({
        users: [{
          email: 'mobile@example.com',
          password: 'MobilePass123!',
          firstName: 'Mobile',
          lastName: 'User'
        }]
      })
      
      cy.visit('/login')
      
      cy.getByTestId('email-input').type('mobile@example.com')
      cy.getByTestId('password-input').type('MobilePass123!')
      cy.getByTestId('login-button').click()
      
      cy.url().should('include', '/dashboard')
    })
  })
})