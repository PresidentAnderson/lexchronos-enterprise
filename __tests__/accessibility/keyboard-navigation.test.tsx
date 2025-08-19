import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../../components/ui/Button'
import { TimerWidget } from '../../components/ui/TimerWidget'

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

describe('Keyboard Navigation Tests', () => {
  describe('Button Keyboard Navigation', () => {
    it('should be focusable with Tab key', async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
        </div>
      )

      const firstButton = screen.getByText('First Button')
      const secondButton = screen.getByText('Second Button')

      // Tab to first button
      await user.tab()
      expect(firstButton).toHaveFocus()

      // Tab to second button
      await user.tab()
      expect(secondButton).toHaveFocus()
    })

    it('should be activatable with Enter and Space keys', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()

      render(<Button onClick={handleClick}>Clickable Button</Button>)

      const button = screen.getByText('Clickable Button')
      button.focus()

      // Activate with Enter key
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)

      // Activate with Space key
      await user.keyboard(' ')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })

    it('should skip disabled buttons during tab navigation', async () => {
      const user = userEvent.setup()

      render(
        <div>
          <Button>First Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button>Third Button</Button>
        </div>
      )

      const firstButton = screen.getByText('First Button')
      const disabledButton = screen.getByText('Disabled Button')
      const thirdButton = screen.getByText('Third Button')

      await user.tab()
      expect(firstButton).toHaveFocus()

      await user.tab()
      expect(thirdButton).toHaveFocus()
      expect(disabledButton).not.toHaveFocus()
    })

    it('should support reverse tab navigation', async () => {
      const user = userEvent.setup()

      render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
          <Button>Third Button</Button>
        </div>
      )

      const firstButton = screen.getByText('First Button')
      const secondButton = screen.getByText('Second Button')
      const thirdButton = screen.getByText('Third Button')

      // Tab forward to third button
      await user.tab()
      await user.tab()
      await user.tab()
      expect(thirdButton).toHaveFocus()

      // Shift+Tab backward
      await user.tab({ shift: true })
      expect(secondButton).toHaveFocus()

      await user.tab({ shift: true })
      expect(firstButton).toHaveFocus()
    })
  })

  describe('TimerWidget Keyboard Navigation', () => {
    const defaultProps = {
      projects: mockProjects,
      onStartTimer: jest.fn(),
      onStopTimer: jest.fn(),
      onPauseTimer: jest.fn(),
      onResumeTimer: jest.fn(),
      isRunning: false,
      isPaused: false,
    }

    it('should support tab navigation through all interactive elements', async () => {
      const user = userEvent.setup()

      render(<TimerWidget {...defaultProps} />)

      const projectSelect = screen.getByLabelText(/project/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const startButton = screen.getByRole('button', { name: /start timer/i })

      // Tab through elements in order
      await user.tab()
      expect(projectSelect).toHaveFocus()

      await user.tab()
      expect(descriptionInput).toHaveFocus()

      await user.tab()
      expect(startButton).toHaveFocus()
    })

    it('should support keyboard interaction with select dropdown', async () => {
      const user = userEvent.setup()

      render(<TimerWidget {...defaultProps} />)

      const projectSelect = screen.getByLabelText(/project/i)
      projectSelect.focus()

      // Use arrow keys to navigate options
      await user.keyboard('{ArrowDown}')
      expect(projectSelect).toHaveValue('1')

      await user.keyboard('{ArrowDown}')
      expect(projectSelect).toHaveValue('2')

      await user.keyboard('{ArrowUp}')
      expect(projectSelect).toHaveValue('1')
    })

    it('should support Enter key to submit form', async () => {
      const user = userEvent.setup()
      const onStartTimer = jest.fn()

      render(<TimerWidget {...defaultProps} onStartTimer={onStartTimer} />)

      const projectSelect = screen.getByLabelText(/project/i)
      const descriptionInput = screen.getByLabelText(/description/i)

      // Fill out form using keyboard
      await user.selectOptions(projectSelect, '1')
      await user.type(descriptionInput, 'Keyboard test task')

      // Submit using Enter key on button
      const startButton = screen.getByRole('button', { name: /start timer/i })
      startButton.focus()
      await user.keyboard('{Enter}')

      expect(onStartTimer).toHaveBeenCalledWith('1', 'Keyboard test task')
    })

    it('should handle timer controls with keyboard when running', async () => {
      const user = userEvent.setup()
      const onPauseTimer = jest.fn()
      const onStopTimer = jest.fn()

      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          startTime={new Date()}
          onPauseTimer={onPauseTimer}
          onStopTimer={onStopTimer}
        />
      )

      const pauseButton = screen.getByRole('button', { name: /pause timer/i })
      const stopButton = screen.getByRole('button', { name: /stop timer/i })

      // Use keyboard to pause timer
      pauseButton.focus()
      await user.keyboard('{Enter}')
      expect(onPauseTimer).toHaveBeenCalled()

      // Use keyboard to stop timer
      stopButton.focus()
      await user.keyboard(' ') // Use space key
      expect(onStopTimer).toHaveBeenCalled()
    })

    it('should trap focus when timer is running', async () => {
      const user = userEvent.setup()

      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          startTime={new Date()}
        />
      )

      const pauseButton = screen.getByRole('button', { name: /pause timer/i })
      const stopButton = screen.getByRole('button', { name: /stop timer/i })

      // Tab should cycle between available buttons only
      await user.tab()
      expect(pauseButton).toHaveFocus()

      await user.tab()
      expect(stopButton).toHaveFocus()

      // Tab again should cycle back to first button
      await user.tab()
      expect(pauseButton).toHaveFocus()
    })
  })

  describe('Form Keyboard Navigation', () => {
    it('should support keyboard navigation in complex forms', async () => {
      const user = userEvent.setup()

      const FormComponent = () => (
        <form>
          <div>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" />
          </div>
          
          <div>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" />
          </div>
          
          <fieldset>
            <legend>Preferences</legend>
            <div>
              <input type="checkbox" id="newsletter" />
              <label htmlFor="newsletter">Newsletter</label>
            </div>
            <div>
              <input type="radio" name="theme" id="light" value="light" />
              <label htmlFor="light">Light</label>
            </div>
            <div>
              <input type="radio" name="theme" id="dark" value="dark" />
              <label htmlFor="dark">Dark</label>
            </div>
          </fieldset>
          
          <Button type="submit">Submit</Button>
        </form>
      )

      render(<FormComponent />)

      const email = screen.getByLabelText('Email')
      const password = screen.getByLabelText('Password')
      const newsletter = screen.getByLabelText('Newsletter')
      const light = screen.getByLabelText('Light')
      const dark = screen.getByLabelText('Dark')
      const submit = screen.getByRole('button', { name: 'Submit' })

      // Tab through all form elements
      await user.tab()
      expect(email).toHaveFocus()

      await user.tab()
      expect(password).toHaveFocus()

      await user.tab()
      expect(newsletter).toHaveFocus()

      await user.tab()
      expect(light).toHaveFocus()

      await user.tab()
      expect(dark).toHaveFocus()

      await user.tab()
      expect(submit).toHaveFocus()
    })

    it('should support arrow key navigation within radio groups', async () => {
      const user = userEvent.setup()

      const RadioGroupComponent = () => (
        <fieldset>
          <legend>Theme Selection</legend>
          <div>
            <input type="radio" name="theme" id="light" value="light" />
            <label htmlFor="light">Light Theme</label>
          </div>
          <div>
            <input type="radio" name="theme" id="dark" value="dark" />
            <label htmlFor="dark">Dark Theme</label>
          </div>
          <div>
            <input type="radio" name="theme" id="auto" value="auto" />
            <label htmlFor="auto">Auto Theme</label>
          </div>
        </fieldset>
      )

      render(<RadioGroupComponent />)

      const light = screen.getByLabelText('Light Theme')
      const dark = screen.getByLabelText('Dark Theme')
      const auto = screen.getByLabelText('Auto Theme')

      // Tab to first radio button
      await user.tab()
      expect(light).toHaveFocus()

      // Arrow down to navigate within radio group
      await user.keyboard('{ArrowDown}')
      expect(dark).toHaveFocus()
      expect(dark).toBeChecked()

      await user.keyboard('{ArrowDown}')
      expect(auto).toHaveFocus()
      expect(auto).toBeChecked()

      // Arrow up to go backward
      await user.keyboard('{ArrowUp}')
      expect(dark).toHaveFocus()
      expect(dark).toBeChecked()
    })

    it('should support space key for checkboxes and radio buttons', async () => {
      const user = userEvent.setup()

      const CheckboxRadioComponent = () => (
        <div>
          <div>
            <input type="checkbox" id="terms" />
            <label htmlFor="terms">Accept Terms</label>
          </div>
          <div>
            <input type="radio" name="contact" id="email" value="email" />
            <label htmlFor="email">Email</label>
          </div>
          <div>
            <input type="radio" name="contact" id="phone" value="phone" />
            <label htmlFor="phone">Phone</label>
          </div>
        </div>
      )

      render(<CheckboxRadioComponent />)

      const terms = screen.getByLabelText('Accept Terms')
      const email = screen.getByLabelText('Email')

      // Use space to check checkbox
      terms.focus()
      await user.keyboard(' ')
      expect(terms).toBeChecked()

      await user.keyboard(' ')
      expect(terms).not.toBeChecked()

      // Use space to select radio button
      email.focus()
      await user.keyboard(' ')
      expect(email).toBeChecked()
    })
  })

  describe('Modal and Dialog Keyboard Navigation', () => {
    it('should trap focus within modal dialogs', async () => {
      const user = userEvent.setup()

      const ModalComponent = () => {
        const [isOpen, setIsOpen] = React.useState(true)

        return (
          <div>
            <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
            
            {isOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
                <h2 id="modal-title">Modal Title</h2>
                <input type="text" placeholder="Input field" />
                <Button onClick={() => setIsOpen(false)}>Close</Button>
                <Button>Cancel</Button>
              </div>
            )}
          </div>
        )
      }

      render(<ModalComponent />)

      const input = screen.getByPlaceholderText('Input field')
      const closeButton = screen.getByText('Close')
      const cancelButton = screen.getByText('Cancel')

      // Tab should cycle within modal only
      await user.tab()
      expect(input).toHaveFocus()

      await user.tab()
      expect(closeButton).toHaveFocus()

      await user.tab()
      expect(cancelButton).toHaveFocus()

      // Tab again should cycle back to first element
      await user.tab()
      expect(input).toHaveFocus()
    })

    it('should support Escape key to close modals', async () => {
      const user = userEvent.setup()

      const EscapeModalComponent = () => {
        const [isOpen, setIsOpen] = React.useState(true)

        React.useEffect(() => {
          const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
              setIsOpen(false)
            }
          }

          if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            return () => document.removeEventListener('keydown', handleKeyDown)
          }
        }, [isOpen])

        return (
          <div>
            {isOpen && (
              <div role="dialog" aria-modal="true">
                <h2>Escapable Modal</h2>
                <Button>Action Button</Button>
              </div>
            )}
            {!isOpen && <div>Modal is closed</div>}
          </div>
        )
      }

      render(<EscapeModalComponent />)

      expect(screen.getByText('Escapable Modal')).toBeInTheDocument()
      expect(screen.queryByText('Modal is closed')).not.toBeInTheDocument()

      // Press Escape to close modal
      await user.keyboard('{Escape}')

      expect(screen.queryByText('Escapable Modal')).not.toBeInTheDocument()
      expect(screen.getByText('Modal is closed')).toBeInTheDocument()
    })
  })

  describe('Table Keyboard Navigation', () => {
    it('should support arrow key navigation in data tables', async () => {
      const user = userEvent.setup()

      const TableComponent = () => (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td tabIndex={0}>John Doe</td>
              <td tabIndex={0}>Developer</td>
              <td><Button size="sm">Edit</Button></td>
            </tr>
            <tr>
              <td tabIndex={0}>Jane Smith</td>
              <td tabIndex={0}>Designer</td>
              <td><Button size="sm">Edit</Button></td>
            </tr>
          </tbody>
        </table>
      )

      render(<TableComponent />)

      const johnName = screen.getByText('John Doe')
      const johnRole = screen.getByText('Developer')
      const janeRole = screen.getByText('Designer')

      // Tab to first cell
      await user.tab()
      expect(johnName).toHaveFocus()

      // Tab to next cell in same row
      await user.tab()
      expect(johnRole).toHaveFocus()

      // Tab to button
      await user.tab()
      expect(screen.getAllByText('Edit')[0]).toHaveFocus()

      // Continue tabbing to next row
      await user.tab()
      expect(screen.getByText('Jane Smith')).toHaveFocus()
    })

    it('should support sortable table headers with keyboard', async () => {
      const user = userEvent.setup()
      const onSort = jest.fn()

      const SortableTableComponent = () => (
        <table>
          <thead>
            <tr>
              <th>
                <button 
                  onClick={() => onSort('name')}
                  aria-label="Sort by name"
                >
                  Name
                </button>
              </th>
              <th>
                <button 
                  onClick={() => onSort('role')}
                  aria-label="Sort by role"
                >
                  Role
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>Developer</td>
            </tr>
          </tbody>
        </table>
      )

      render(<SortableTableComponent />)

      const nameSort = screen.getByLabelText('Sort by name')
      const roleSort = screen.getByLabelText('Sort by role')

      // Tab to sort buttons
      await user.tab()
      expect(nameSort).toHaveFocus()

      // Activate sort with Enter
      await user.keyboard('{Enter}')
      expect(onSort).toHaveBeenCalledWith('name')

      // Tab to next sort button
      await user.tab()
      expect(roleSort).toHaveFocus()

      // Activate sort with Space
      await user.keyboard(' ')
      expect(onSort).toHaveBeenCalledWith('role')
    })
  })

  describe('Custom Keyboard Shortcuts', () => {
    it('should support application-specific keyboard shortcuts', async () => {
      const user = userEvent.setup()
      const onStartTimer = jest.fn()
      const onStopTimer = jest.fn()

      const ShortcutComponent = () => {
        React.useEffect(() => {
          const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
              switch (event.key) {
                case 's':
                  event.preventDefault()
                  onStartTimer()
                  break
                case 'e':
                  event.preventDefault()
                  onStopTimer()
                  break
              }
            }
          }

          document.addEventListener('keydown', handleKeyDown)
          return () => document.removeEventListener('keydown', handleKeyDown)
        }, [])

        return (
          <div>
            <p>Press Ctrl+S to start timer, Ctrl+E to stop timer</p>
            <Button>Regular Button</Button>
          </div>
        )
      }

      render(<ShortcutComponent />)

      // Use Ctrl+S shortcut
      await user.keyboard('{Control>}s{/Control}')
      expect(onStartTimer).toHaveBeenCalledTimes(1)

      // Use Ctrl+E shortcut
      await user.keyboard('{Control>}e{/Control}')
      expect(onStopTimer).toHaveBeenCalledTimes(1)
    })
  })
})