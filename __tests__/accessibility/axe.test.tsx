import React from 'react'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from '../../components/ui/Button'
import { TimerWidget } from '../../components/ui/TimerWidget'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock projects data
const mockProjects = [
  {
    id: '1',
    name: 'Project Alpha',
    clientId: 'client-1',
    hourlyRate: 100,
  },
  {
    id: '2',
    name: 'Project Beta',
    clientId: 'client-2',
    hourlyRate: 150,
  },
]

describe('Accessibility Tests', () => {
  describe('Button Component Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible with different variants', async () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost'] as const
      
      for (const variant of variants) {
        const { container } = render(
          <Button variant={variant}>Button {variant}</Button>
        )
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      }
    })

    it('should be accessible when disabled', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible with custom aria attributes', async () => {
      const { container } = render(
        <Button
          aria-label="Custom button label"
          aria-describedby="button-description"
          aria-expanded={false}
        >
          Accessible Button
        </Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('TimerWidget Component Accessibility', () => {
    const defaultProps = {
      projects: mockProjects,
      onStartTimer: jest.fn(),
      onStopTimer: jest.fn(),
      onPauseTimer: jest.fn(),
      onResumeTimer: jest.fn(),
      isRunning: false,
      isPaused: false,
    }

    it('should have no accessibility violations', async () => {
      const { container } = render(<TimerWidget {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible when timer is running', async () => {
      const { container } = render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          startTime={new Date()}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible when timer is paused', async () => {
      const { container } = render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          isPaused={true}
          startTime={new Date()}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible when disabled', async () => {
      const { container } = render(
        <TimerWidget {...defaultProps} disabled={true} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible with empty projects', async () => {
      const { container } = render(
        <TimerWidget {...defaultProps} projects={[]} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Components Accessibility', () => {
    it('should be accessible with form elements', async () => {
      const FormComponent = () => (
        <form>
          <div>
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              aria-describedby="email-help"
            />
            <div id="email-help">Enter your email address</div>
          </div>
          
          <div>
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              aria-describedby="password-help"
            />
            <div id="password-help">Enter your password</div>
          </div>
          
          <fieldset>
            <legend>Preferences</legend>
            <div>
              <input type="checkbox" id="newsletter" name="newsletter" />
              <label htmlFor="newsletter">Subscribe to newsletter</label>
            </div>
            <div>
              <input type="radio" id="theme-light" name="theme" value="light" />
              <label htmlFor="theme-light">Light theme</label>
            </div>
            <div>
              <input type="radio" id="theme-dark" name="theme" value="dark" />
              <label htmlFor="theme-dark">Dark theme</label>
            </div>
          </fieldset>
          
          <Button type="submit">Submit Form</Button>
        </form>
      )

      const { container } = render(<FormComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible with error states', async () => {
      const FormWithErrors = () => (
        <form>
          <div>
            <label htmlFor="email-error">Email Address *</label>
            <input
              type="email"
              id="email-error"
              name="email"
              required
              aria-invalid="true"
              aria-describedby="email-error-msg"
            />
            <div id="email-error-msg" role="alert">
              Email address is required
            </div>
          </div>
          
          <div>
            <label htmlFor="password-error">Password *</label>
            <input
              type="password"
              id="password-error"
              name="password"
              required
              aria-invalid="true"
              aria-describedby="password-error-msg"
            />
            <div id="password-error-msg" role="alert">
              Password must be at least 8 characters
            </div>
          </div>
          
          <Button type="submit">Submit Form</Button>
        </form>
      )

      const { container } = render(<FormWithErrors />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Navigation and Layout Accessibility', () => {
    it('should be accessible with navigation structure', async () => {
      const NavigationComponent = () => (
        <div>
          <nav aria-label="Main navigation">
            <ul>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/projects">Projects</a></li>
              <li><a href="/time-entries">Time Entries</a></li>
              <li><a href="/invoices">Invoices</a></li>
            </ul>
          </nav>
          
          <main>
            <h1>Dashboard</h1>
            <section aria-labelledby="recent-entries">
              <h2 id="recent-entries">Recent Time Entries</h2>
              <p>Your recent time tracking entries...</p>
            </section>
          </main>
          
          <aside aria-labelledby="sidebar-title">
            <h2 id="sidebar-title">Quick Actions</h2>
            <Button>Start Timer</Button>
            <Button>Create Project</Button>
          </aside>
        </div>
      )

      const { container } = render(<NavigationComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible with skip links', async () => {
      const SkipLinksComponent = () => (
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <a href="#navigation" className="skip-link">
            Skip to navigation
          </a>
          
          <nav id="navigation" aria-label="Main navigation">
            <ul>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/projects">Projects</a></li>
            </ul>
          </nav>
          
          <main id="main-content">
            <h1>Main Content</h1>
            <p>This is the main content area.</p>
          </main>
        </div>
      )

      const { container } = render(<SkipLinksComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Data Tables Accessibility', () => {
    it('should be accessible with data tables', async () => {
      const DataTableComponent = () => (
        <div>
          <table role="table" aria-labelledby="table-caption">
            <caption id="table-caption">
              Time Entries for January 2024
            </caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Project</th>
                <th scope="col">Description</th>
                <th scope="col">Hours</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2024-01-15</td>
                <td>Project Alpha</td>
                <td>Working on feature X</td>
                <td>8.0</td>
                <td>
                  <Button size="sm">Edit</Button>
                  <Button size="sm" variant="destructive">Delete</Button>
                </td>
              </tr>
              <tr>
                <td>2024-01-14</td>
                <td>Project Beta</td>
                <td>Bug fixes and testing</td>
                <td>6.5</td>
                <td>
                  <Button size="sm">Edit</Button>
                  <Button size="sm" variant="destructive">Delete</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )

      const { container } = render(<DataTableComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible with sortable table headers', async () => {
      const SortableTableComponent = () => (
        <table>
          <caption>Sortable Time Entries</caption>
          <thead>
            <tr>
              <th scope="col">
                <button
                  aria-label="Sort by date"
                  aria-describedby="sort-date-desc"
                >
                  Date
                </button>
                <span id="sort-date-desc" className="sr-only">
                  Currently sorted ascending. Click to sort descending.
                </span>
              </th>
              <th scope="col">
                <button
                  aria-label="Sort by project"
                  aria-describedby="sort-project-desc"
                >
                  Project
                </button>
                <span id="sort-project-desc" className="sr-only">
                  Not sorted. Click to sort ascending.
                </span>
              </th>
              <th scope="col">
                <button
                  aria-label="Sort by hours"
                  aria-describedby="sort-hours-desc"
                >
                  Hours
                </button>
                <span id="sort-hours-desc" className="sr-only">
                  Not sorted. Click to sort ascending.
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024-01-15</td>
              <td>Project Alpha</td>
              <td>8.0</td>
            </tr>
          </tbody>
        </table>
      )

      const { container } = render(<SortableTableComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Modal and Dialog Accessibility', () => {
    it('should be accessible with modal dialogs', async () => {
      const ModalComponent = () => (
        <div>
          <Button>Open Modal</Button>
          
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <div>
              <h2 id="modal-title">Confirm Delete</h2>
              <p id="modal-description">
                Are you sure you want to delete this time entry? This action cannot be undone.
              </p>
              
              <div>
                <Button variant="destructive">Delete</Button>
                <Button variant="outline">Cancel</Button>
              </div>
              
              <button aria-label="Close dialog">×</button>
            </div>
          </div>
        </div>
      )

      const { container } = render(<ModalComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible with alert dialogs', async () => {
      const AlertDialogComponent = () => (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alert-title"
          aria-describedby="alert-description"
        >
          <div>
            <h2 id="alert-title">Error</h2>
            <p id="alert-description">
              Unable to save time entry. Please check your internet connection and try again.
            </p>
            
            <div>
              <Button>Retry</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </div>
        </div>
      )

      const { container } = render(<AlertDialogComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Loading and Status Accessibility', () => {
    it('should be accessible with loading states', async () => {
      const LoadingComponent = () => (
        <div>
          <div role="status" aria-label="Loading content">
            <div aria-hidden="true">Loading...</div>
          </div>
          
          <Button disabled aria-label="Loading, please wait">
            <span aria-hidden="true">⏳</span>
            Saving...
          </Button>
          
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={75}
            aria-label="Upload progress: 75%"
          >
            <div style={{ width: '75%' }} aria-hidden="true" />
          </div>
        </div>
      )

      const { container } = render(<LoadingComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be accessible with status messages', async () => {
      const StatusComponent = () => (
        <div>
          <div role="status" aria-live="polite">
            Time entry saved successfully.
          </div>
          
          <div role="alert" aria-live="assertive">
            Error: Unable to delete project. It has associated time entries.
          </div>
          
          <div role="status" aria-live="polite" aria-atomic="true">
            Timer running: 1 hour 23 minutes
          </div>
        </div>
      )

      const { container } = render(<StatusComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Responsive Design Accessibility', () => {
    it('should be accessible with responsive layouts', async () => {
      const ResponsiveComponent = () => (
        <div>
          <div className="mobile-only" aria-label="Mobile navigation menu">
            <button
              aria-expanded="false"
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
            <div id="mobile-menu" hidden>
              <nav aria-label="Mobile navigation">
                <ul>
                  <li><a href="/dashboard">Dashboard</a></li>
                  <li><a href="/projects">Projects</a></li>
                </ul>
              </nav>
            </div>
          </div>
          
          <div className="desktop-only">
            <nav aria-label="Desktop navigation">
              <ul>
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/projects">Projects</a></li>
              </ul>
            </nav>
          </div>
        </div>
      )

      const { container } = render(<ResponsiveComponent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Custom Rules and Configuration', () => {
    it('should be accessible with custom axe rules', async () => {
      const { container } = render(
        <div>
          <h1>Page Title</h1>
          <TimerWidget {...{
            projects: mockProjects,
            onStartTimer: jest.fn(),
            onStopTimer: jest.fn(),
            onPauseTimer: jest.fn(),
            onResumeTimer: jest.fn(),
            isRunning: false,
            isPaused: false,
          }} />
        </div>
      )

      // Run with specific rules enabled
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-usage': { enabled: true },
          'semantic-structure': { enabled: true },
        }
      })

      expect(results).toHaveNoViolations()
    })

    it('should be accessible excluding specific rules if needed', async () => {
      const { container } = render(
        <div style={{ backgroundColor: '#ccc', color: '#ddd' }}>
          {/* This might have contrast issues but we want to test other aspects */}
          <Button>Low Contrast Button</Button>
        </div>
      )

      // Run axe excluding color-contrast rule for this specific test
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: false }
        }
      })

      expect(results).toHaveNoViolations()
    })
  })
})