import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { TimerWidget, Project } from '../../components/ui/TimerWidget'

expect.extend(toHaveNoViolations)

const mockProjects: Project[] = [
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

const defaultProps = {
  projects: mockProjects,
  onStartTimer: jest.fn(),
  onStopTimer: jest.fn(),
  onPauseTimer: jest.fn(),
  onResumeTimer: jest.fn(),
  isRunning: false,
  isPaused: false,
}

describe('TimerWidget Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render timer widget with default state', () => {
      render(<TimerWidget {...defaultProps} />)

      expect(screen.getByTestId('timer-widget')).toBeInTheDocument()
      expect(screen.getByTestId('timer-title')).toHaveTextContent('Time Tracker')
      expect(screen.getByTestId('timer-status')).toHaveTextContent('Stopped')
      expect(screen.getByTestId('timer-duration')).toHaveTextContent('00:00:00')
      expect(screen.getByTestId('start-timer-button')).toBeInTheDocument()
    })

    it('should render project options', () => {
      render(<TimerWidget {...defaultProps} />)

      const projectSelect = screen.getByTestId('project-select')
      expect(projectSelect).toBeInTheDocument()

      // Check for default option
      expect(screen.getByText('Select a project')).toBeInTheDocument()

      // Check for project options
      expect(screen.getByText('Project Alpha')).toBeInTheDocument()
      expect(screen.getByText('Project Beta')).toBeInTheDocument()
    })

    it('should render task description input', () => {
      render(<TimerWidget {...defaultProps} />)

      const descriptionInput = screen.getByTestId('task-description-input')
      expect(descriptionInput).toBeInTheDocument()
      expect(descriptionInput).toHaveAttribute('placeholder', 'What are you working on?')
      expect(descriptionInput).toHaveAttribute('maxLength', '500')
    })

    it('should show character count for description', async () => {
      const user = userEvent.setup({ delay: null })
      render(<TimerWidget {...defaultProps} />)

      const descriptionInput = screen.getByTestId('task-description-input')
      await user.type(descriptionInput, 'Test description')

      expect(screen.getByText('16/500')).toBeInTheDocument()
    })
  })

  describe('Timer Controls', () => {
    it('should disable start button when no project or description', () => {
      render(<TimerWidget {...defaultProps} />)

      const startButton = screen.getByTestId('start-timer-button')
      expect(startButton).toBeDisabled()
    })

    it('should enable start button when project and description are provided', async () => {
      const user = userEvent.setup({ delay: null })
      render(<TimerWidget {...defaultProps} />)

      const projectSelect = screen.getByTestId('project-select')
      const descriptionInput = screen.getByTestId('task-description-input')
      const startButton = screen.getByTestId('start-timer-button')

      await user.selectOptions(projectSelect, '1')
      await user.type(descriptionInput, 'Working on feature')

      expect(startButton).toBeEnabled()
    })

    it('should call onStartTimer with correct parameters', async () => {
      const user = userEvent.setup({ delay: null })
      const onStartTimer = jest.fn()

      render(<TimerWidget {...defaultProps} onStartTimer={onStartTimer} />)

      const projectSelect = screen.getByTestId('project-select')
      const descriptionInput = screen.getByTestId('task-description-input')
      const startButton = screen.getByTestId('start-timer-button')

      await user.selectOptions(projectSelect, '1')
      await user.type(descriptionInput, 'Working on feature')
      await user.click(startButton)

      expect(onStartTimer).toHaveBeenCalledWith('1', 'Working on feature')
    })

    it('should show pause and stop buttons when timer is running', () => {
      render(<TimerWidget {...defaultProps} isRunning={true} startTime={new Date()} />)

      expect(screen.getByTestId('pause-timer-button')).toBeInTheDocument()
      expect(screen.getByTestId('stop-timer-button')).toBeInTheDocument()
      expect(screen.queryByTestId('start-timer-button')).not.toBeInTheDocument()
    })

    it('should show resume button when timer is paused', () => {
      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true} 
          isPaused={true}
          startTime={new Date()} 
        />
      )

      expect(screen.getByTestId('resume-timer-button')).toBeInTheDocument()
      expect(screen.queryByTestId('pause-timer-button')).not.toBeInTheDocument()
    })

    it('should call onPauseTimer when pause button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      const onPauseTimer = jest.fn()

      render(
        <TimerWidget 
          {...defaultProps} 
          onPauseTimer={onPauseTimer}
          isRunning={true}
          startTime={new Date()} 
        />
      )

      await user.click(screen.getByTestId('pause-timer-button'))
      expect(onPauseTimer).toHaveBeenCalled()
    })

    it('should call onResumeTimer when resume button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      const onResumeTimer = jest.fn()

      render(
        <TimerWidget 
          {...defaultProps} 
          onResumeTimer={onResumeTimer}
          isRunning={true}
          isPaused={true}
          startTime={new Date()} 
        />
      )

      await user.click(screen.getByTestId('resume-timer-button'))
      expect(onResumeTimer).toHaveBeenCalled()
    })

    it('should call onStopTimer and reset form when stop button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      const onStopTimer = jest.fn()

      render(
        <TimerWidget 
          {...defaultProps} 
          onStopTimer={onStopTimer}
          isRunning={true}
          startTime={new Date()} 
        />
      )

      await user.click(screen.getByTestId('stop-timer-button'))
      expect(onStopTimer).toHaveBeenCalled()
    })
  })

  describe('Timer Display', () => {
    it('should show correct status for different states', () => {
      const { rerender } = render(<TimerWidget {...defaultProps} isRunning={false} />)
      expect(screen.getByTestId('timer-status')).toHaveTextContent('Stopped')

      rerender(<TimerWidget {...defaultProps} isRunning={true} isPaused={false} startTime={new Date()} />)
      expect(screen.getByTestId('timer-status')).toHaveTextContent('Running')

      rerender(<TimerWidget {...defaultProps} isRunning={true} isPaused={true} startTime={new Date()} />)
      expect(screen.getByTestId('timer-status')).toHaveTextContent('Paused')
    })

    it('should update timer duration when running', async () => {
      const startTime = new Date(Date.now() - 65000) // 1 minute 5 seconds ago
      
      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          isPaused={false}
          startTime={startTime} 
        />
      )

      // Fast forward time and wait for update
      jest.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByTestId('timer-duration')).toHaveTextContent('00:01:05')
      })
    })

    it('should not update timer duration when paused', async () => {
      const startTime = new Date(Date.now() - 30000) // 30 seconds ago
      
      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          isPaused={true}
          startTime={startTime}
          pausedTime={5000} // 5 seconds paused
        />
      )

      const initialDuration = screen.getByTestId('timer-duration').textContent
      
      jest.advanceTimersByTime(2000)
      
      await waitFor(() => {
        expect(screen.getByTestId('timer-duration')).toHaveTextContent(initialDuration!)
      })
    })

    it('should calculate and display estimated earnings', async () => {
      const user = userEvent.setup({ delay: null })
      const startTime = new Date(Date.now() - 3600000) // 1 hour ago
      
      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          startTime={startTime}
        />
      )

      // Select project with $150/hour rate
      const projectSelect = screen.getByTestId('project-select')
      await user.selectOptions(projectSelect, '2')

      await waitFor(() => {
        expect(screen.getByTestId('estimated-earnings')).toHaveTextContent('Estimated earnings: $150.00')
      })
    })

    it('should show additional info when timer is running', () => {
      const startTime = new Date()
      
      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          startTime={startTime}
        />
      )

      expect(screen.getByTestId('start-time')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should trim whitespace from description', async () => {
      const user = userEvent.setup({ delay: null })
      const onStartTimer = jest.fn()

      render(<TimerWidget {...defaultProps} onStartTimer={onStartTimer} />)

      const projectSelect = screen.getByTestId('project-select')
      const descriptionInput = screen.getByTestId('task-description-input')
      const startButton = screen.getByTestId('start-timer-button')

      await user.selectOptions(projectSelect, '1')
      await user.type(descriptionInput, '  Working on feature  ')
      await user.click(startButton)

      expect(onStartTimer).toHaveBeenCalledWith('1', 'Working on feature')
    })

    it('should not start timer with empty description after trimming', async () => {
      const user = userEvent.setup({ delay: null })
      const onStartTimer = jest.fn()

      render(<TimerWidget {...defaultProps} onStartTimer={onStartTimer} />)

      const projectSelect = screen.getByTestId('project-select')
      const descriptionInput = screen.getByTestId('task-description-input')
      const startButton = screen.getByTestId('start-timer-button')

      await user.selectOptions(projectSelect, '1')
      await user.type(descriptionInput, '   ')

      expect(startButton).toBeDisabled()
    })

    it('should disable inputs when timer is running', () => {
      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          startTime={new Date()}
        />
      )

      expect(screen.getByTestId('project-select')).toBeDisabled()
      expect(screen.getByTestId('task-description-input')).toBeDisabled()
    })

    it('should disable all controls when disabled prop is true', () => {
      render(<TimerWidget {...defaultProps} disabled={true} />)

      expect(screen.getByTestId('project-select')).toBeDisabled()
      expect(screen.getByTestId('task-description-input')).toBeDisabled()
      expect(screen.getByTestId('start-timer-button')).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<TimerWidget {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels', () => {
      render(<TimerWidget {...defaultProps} />)

      expect(screen.getByTestId('project-select')).toHaveAttribute('aria-label', 'Select project')
      expect(screen.getByTestId('task-description-input')).toHaveAttribute('aria-label', 'Task description')
      expect(screen.getByTestId('start-timer-button')).toHaveAttribute('aria-label', 'Start timer')
    })

    it('should have proper labels for form fields', () => {
      render(<TimerWidget {...defaultProps} />)

      expect(screen.getByLabelText('Project *')).toBeInTheDocument()
      expect(screen.getByLabelText('Task Description *')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup({ delay: null })
      render(<TimerWidget {...defaultProps} />)

      // Tab through form elements
      await user.tab()
      expect(screen.getByTestId('project-select')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('task-description-input')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('start-timer-button')).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty projects array', () => {
      render(<TimerWidget {...defaultProps} projects={[]} />)

      const projectSelect = screen.getByTestId('project-select')
      expect(projectSelect.children).toHaveLength(1) // Only the default option
    })

    it('should handle very long descriptions', async () => {
      const user = userEvent.setup({ delay: null })
      render(<TimerWidget {...defaultProps} />)

      const longText = 'a'.repeat(600) // Exceeds 500 char limit
      const descriptionInput = screen.getByTestId('task-description-input')
      
      await user.type(descriptionInput, longText)

      // Should be limited to 500 characters
      expect(descriptionInput).toHaveValue('a'.repeat(500))
    })

    it('should handle startTime in the future', () => {
      const futureTime = new Date(Date.now() + 60000) // 1 minute in the future
      
      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          startTime={futureTime}
        />
      )

      // Should show 00:00:00 for future times
      expect(screen.getByTestId('timer-duration')).toHaveTextContent('00:00:00')
    })

    it('should handle negative paused time', () => {
      const startTime = new Date(Date.now() - 60000) // 1 minute ago
      
      render(
        <TimerWidget 
          {...defaultProps} 
          isRunning={true}
          startTime={startTime}
          pausedTime={-5000} // Negative paused time
        />
      )

      // Should still calculate correctly
      expect(screen.getByTestId('timer-duration')).toHaveTextContent('00:01:00')
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<TimerWidget {...defaultProps} className="custom-timer-class" />)

      expect(screen.getByTestId('timer-widget')).toHaveClass('custom-timer-class')
    })

    it('should maintain base styling with custom className', () => {
      render(<TimerWidget {...defaultProps} className="custom-timer-class" />)

      const widget = screen.getByTestId('timer-widget')
      expect(widget).toHaveClass('custom-timer-class')
      expect(widget).toHaveClass('bg-white', 'rounded-lg', 'shadow-md')
    })
  })
})