describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    cy.clearDatabase()
    cy.seedDatabase({
      users: [{
        email: 'dashboard@example.com',
        password: 'DashPass123!',
        firstName: 'Dashboard',
        lastName: 'User'
      }],
      projects: [{
        id: 'project-1',
        name: 'Test Project',
        clientId: 'client-1',
        hourlyRate: 100,
        isActive: true
      }],
      clients: [{
        id: 'client-1',
        name: 'Test Client',
        email: 'client@example.com',
        isActive: true
      }],
      timeEntries: [{
        id: 'entry-1',
        projectId: 'project-1',
        description: 'Working on feature',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(),
        billableHours: 1
      }]
    })
    
    cy.login('dashboard@example.com', 'DashPass123!')
  })

  describe('Dashboard Overview', () => {
    it('should display dashboard with key metrics', () => {
      cy.visit('/dashboard')
      
      // Should show welcome message
      cy.contains('Welcome back, Dashboard').should('be.visible')
      
      // Should show key metrics
      cy.getByTestId('total-hours-today').should('be.visible')
      cy.getByTestId('total-revenue-today').should('be.visible')
      cy.getByTestId('active-projects-count').should('be.visible')
      cy.getByTestId('pending-invoices-count').should('be.visible')
    })

    it('should display recent time entries', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('recent-entries-section').should('be.visible')
      cy.getByTestId('recent-entries-list').should('contain', 'Working on feature')
    })

    it('should display active projects', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('active-projects-section').should('be.visible')
      cy.getByTestId('projects-list').should('contain', 'Test Project')
    })

    it('should show time tracking widget', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('time-tracker-widget').should('be.visible')
      cy.getByTestId('start-timer-button').should('be.visible')
    })
  })

  describe('Time Tracking', () => {
    it('should start and stop time tracking', () => {
      cy.visit('/dashboard')
      
      // Start timer
      cy.getByTestId('project-select').select('Test Project')
      cy.getByTestId('task-description-input').type('New task description')
      cy.getByTestId('start-timer-button').click()
      
      // Should show running timer
      cy.getByTestId('timer-status').should('contain', 'Running')
      cy.getByTestId('stop-timer-button').should('be.visible')
      
      // Wait a moment
      cy.wait(2000)
      
      // Stop timer
      cy.getByTestId('stop-timer-button').click()
      
      // Should show stopped status
      cy.getByTestId('timer-status').should('contain', 'Stopped')
      
      // Should create new time entry
      cy.getByTestId('recent-entries-list').should('contain', 'New task description')
    })

    it('should validate timer form before starting', () => {
      cy.visit('/dashboard')
      
      // Try to start without project
      cy.getByTestId('start-timer-button').click()
      
      cy.contains('Project is required').should('be.visible')
    })

    it('should display timer duration while running', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('project-select').select('Test Project')
      cy.getByTestId('task-description-input').type('Timer test')
      cy.getByTestId('start-timer-button').click()
      
      // Should show duration
      cy.getByTestId('timer-duration').should('be.visible')
      cy.getByTestId('timer-duration').should('not.contain', '00:00:00')
    })
  })

  describe('Quick Actions', () => {
    it('should navigate to time entries from quick action', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('view-time-entries-link').click()
      cy.url().should('include', '/time-entries')
    })

    it('should navigate to projects from quick action', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('manage-projects-link').click()
      cy.url().should('include', '/projects')
    })

    it('should navigate to clients from quick action', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('manage-clients-link').click()
      cy.url().should('include', '/clients')
    })

    it('should navigate to invoices from quick action', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('create-invoice-link').click()
      cy.url().should('include', '/invoices')
    })
  })

  describe('Data Refresh', () => {
    it('should refresh data when navigating back to dashboard', () => {
      cy.visit('/dashboard')
      
      // Navigate away and back
      cy.visit('/projects')
      cy.visit('/dashboard')
      
      // Data should be refreshed
      cy.getByTestId('total-hours-today').should('be.visible')
    })

    it('should update metrics in real-time', () => {
      cy.visit('/dashboard')
      
      // Get initial hours count
      cy.getByTestId('total-hours-today').invoke('text').then((initialHours) => {
        // Start and stop a timer
        cy.getByTestId('project-select').select('Test Project')
        cy.getByTestId('task-description-input').type('Real-time test')
        cy.getByTestId('start-timer-button').click()
        
        cy.wait(3000) // Wait 3 seconds
        
        cy.getByTestId('stop-timer-button').click()
        
        // Hours should be updated
        cy.getByTestId('total-hours-today').invoke('text').should('not.equal', initialHours)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to tablet view', () => {
      cy.setTabletViewport()
      cy.visit('/dashboard')
      
      cy.getByTestId('dashboard-grid').should('be.visible')
      cy.getByTestId('time-tracker-widget').should('be.visible')
    })

    it('should adapt to mobile view', () => {
      cy.setMobileViewport()
      cy.visit('/dashboard')
      
      // Should show mobile-friendly layout
      cy.getByTestId('mobile-dashboard-layout').should('be.visible')
      
      // Key elements should still be accessible
      cy.getByTestId('time-tracker-widget').should('be.visible')
      cy.getByTestId('quick-actions-menu').should('be.visible')
    })

    it('should maintain functionality on mobile', () => {
      cy.setMobileViewport()
      cy.visit('/dashboard')
      
      // Should be able to start timer on mobile
      cy.getByTestId('project-select').select('Test Project')
      cy.getByTestId('task-description-input').type('Mobile test')
      cy.getByTestId('start-timer-button').click()
      
      cy.getByTestId('timer-status').should('contain', 'Running')
    })
  })

  describe('Performance', () => {
    it('should load dashboard within acceptable time', () => {
      const start = Date.now()
      
      cy.visit('/dashboard')
      
      cy.getByTestId('dashboard-content').should('be.visible').then(() => {
        const loadTime = Date.now() - start
        expect(loadTime).to.be.lessThan(3000) // 3 seconds
      })
    })

    it('should handle large datasets efficiently', () => {
      // Seed with many entries
      cy.seedDatabase({
        timeEntries: Array.from({ length: 100 }, (_, i) => ({
          id: `entry-${i}`,
          projectId: 'project-1',
          description: `Task ${i}`,
          startTime: new Date(Date.now() - i * 3600000),
          endTime: new Date(Date.now() - i * 3600000 + 1800000),
          billableHours: 0.5
        }))
      })
      
      cy.visit('/dashboard')
      
      // Should still load efficiently
      cy.getByTestId('recent-entries-section').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Intercept API calls and return errors
      cy.intercept('GET', '/api/dashboard/stats', { statusCode: 500 }).as('statsError')
      
      cy.visit('/dashboard')
      
      cy.wait('@statsError')
      
      // Should show error state
      cy.contains('Unable to load dashboard data').should('be.visible')
      cy.getByTestId('retry-button').should('be.visible')
    })

    it('should retry failed requests', () => {
      // First call fails, second succeeds
      cy.intercept('GET', '/api/dashboard/stats', { statusCode: 500 }).as('firstCall')
      
      cy.visit('/dashboard')
      cy.wait('@firstCall')
      
      // Setup successful retry
      cy.intercept('GET', '/api/dashboard/stats', { 
        statusCode: 200,
        body: { totalHours: 8, totalRevenue: 800, activeProjects: 3 }
      }).as('retryCall')
      
      cy.getByTestId('retry-button').click()
      cy.wait('@retryCall')
      
      // Should show data
      cy.getByTestId('total-hours-today').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should meet accessibility standards', () => {
      cy.visit('/dashboard')
      cy.checkAccessibility()
    })

    it('should support keyboard navigation', () => {
      cy.visit('/dashboard')
      
      // Tab through interactive elements
      cy.get('body').tab()
      cy.focused().should('be.visible')
      
      // Should be able to navigate to start timer button
      cy.get('body').tab({ shift: true }).tab().tab().tab()
      cy.focused().should('have.attr', 'data-testid', 'start-timer-button')
    })

    it('should have proper ARIA labels', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('time-tracker-widget').should('have.attr', 'aria-label')
      cy.getByTestId('start-timer-button').should('have.attr', 'aria-label')
      cy.getByTestId('project-select').should('have.attr', 'aria-label')
    })

    it('should announce timer state changes to screen readers', () => {
      cy.visit('/dashboard')
      
      cy.getByTestId('timer-status').should('have.attr', 'aria-live', 'polite')
    })
  })
})