'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './button'
import { cn, formatDate } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Separator } from './separator'
import { Clock, PlayCircle, PauseCircle, StopCircle, Settings, DollarSign, AlertCircle } from 'lucide-react'

export interface Project {
  id: string
  name: string
  clientId: string
  clientName: string
  hourlyRate: number
  billingType: 'HOURLY' | 'FLAT_FEE' | 'CONTINGENCY'
  roundingRules: RoundingRule
  requiresApproval: boolean
  color?: string
}

export interface RoundingRule {
  type: 'UP' | 'DOWN' | 'NEAREST' | 'NONE'
  increment: number // in minutes (e.g., 15, 30, 60)
  minimumTime: number // minimum billable time in minutes
}

export interface TimeEntry {
  id: string
  projectId: string
  description: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  roundedDuration: number // in seconds after rounding rules applied
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'BILLED'
  billableRate: number
  totalAmount: number
  tags: string[]
  approvedBy?: string
  approvedAt?: Date
  notes?: string
}

export interface TimerWidgetProps {
  projects: Project[]
  onStartTimer: (projectId: string, description: string, tags?: string[]) => void
  onStopTimer: (saveEntry?: boolean) => void
  onPauseTimer: () => void
  onResumeTimer: () => void
  onSaveTimeEntry: (entry: Partial<TimeEntry>) => void
  isRunning: boolean
  isPaused: boolean
  startTime?: Date
  pausedTime?: number
  className?: string
  disabled?: boolean
  showAdvancedFeatures?: boolean
  currentEntry?: TimeEntry
  recentEntries?: TimeEntry[]
  onEditEntry?: (entry: TimeEntry) => void
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({
  projects,
  onStartTimer,
  onStopTimer,
  onPauseTimer,
  onResumeTimer,
  onSaveTimeEntry,
  isRunning,
  isPaused,
  startTime,
  pausedTime = 0,
  className,
  disabled = false,
  showAdvancedFeatures = true,
  currentEntry,
  recentEntries = [],
  onEditEntry,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [customRate, setCustomRate] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  // Update elapsed time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && !isPaused && startTime) {
      interval = setInterval(() => {
        const now = Date.now()
        const started = new Date(startTime).getTime()
        const elapsed = Math.floor((now - started) / 1000) - Math.floor(pausedTime / 1000)
        setElapsedTime(Math.max(0, elapsed))
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, isPaused, startTime, pausedTime])

  // Format time as HH:MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Handle start timer
  const handleStart = useCallback(() => {
    if (!selectedProjectId || !description.trim()) {
      return
    }
    onStartTimer(selectedProjectId, description.trim(), tags)
  }, [selectedProjectId, description, tags, onStartTimer])

  // Handle stop timer
  const handleStop = useCallback((saveEntry = true) => {
    if (saveEntry && selectedProject) {
      const timeEntry: Partial<TimeEntry> = {
        projectId: selectedProjectId,
        description: description.trim(),
        startTime: startTime!,
        endTime: new Date(),
        duration: rawDuration,
        roundedDuration: roundedDuration,
        status: selectedProject.requiresApproval ? 'SUBMITTED' : 'APPROVED',
        billableRate: effectiveRate,
        totalAmount: estimatedEarnings,
        tags: tags,
        notes: notes.trim() || undefined
      }
      
      onSaveTimeEntry(timeEntry)
    }
    
    onStopTimer(saveEntry)
    setSelectedProjectId('')
    setDescription('')
    setTags([])
    setNotes('')
    setElapsedTime(0)
    setCustomRate(null)
  }, [onStopTimer, onSaveTimeEntry, selectedProject, selectedProjectId, description, startTime, rawDuration, roundedDuration, effectiveRate, estimatedEarnings, tags, notes])

  // Add tag
  const addTag = useCallback((tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }, [tags])

  // Remove tag
  const removeTag = useCallback((tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }, [tags])

  // Format duration with rounding indication
  const formatDurationWithRounding = (seconds: number, showRounding = false) => {
    const formatted = formatTime(Math.floor(seconds))
    return showRounding && timeDifference !== 0 
      ? `${formatted} (${timeDifference > 0 ? '+' : ''}${formatTime(Math.abs(timeDifference / 60))})` 
      : formatted
  }

  // Get selected project
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // Apply rounding rules
  const applyRounding = useCallback((seconds: number, rules: RoundingRule): number => {
    const minutes = seconds / 60
    const increment = rules.increment
    const minimum = rules.minimumTime
    
    // Apply minimum time
    const adjustedMinutes = Math.max(minutes, minimum)
    
    if (rules.type === 'NONE') {
      return adjustedMinutes * 60
    }
    
    let roundedMinutes: number
    switch (rules.type) {
      case 'UP':
        roundedMinutes = Math.ceil(adjustedMinutes / increment) * increment
        break
      case 'DOWN':
        roundedMinutes = Math.floor(adjustedMinutes / increment) * increment
        break
      case 'NEAREST':
        roundedMinutes = Math.round(adjustedMinutes / increment) * increment
        break
      default:
        roundedMinutes = adjustedMinutes
    }
    
    return roundedMinutes * 60
  }, [])

  // Calculate durations and earnings
  const rawDuration = elapsedTime
  const roundedDuration = selectedProject 
    ? applyRounding(rawDuration, selectedProject.roundingRules)
    : rawDuration
  
  const effectiveRate = customRate || selectedProject?.hourlyRate || 0
  const estimatedEarnings = (roundedDuration / 3600) * effectiveRate
  const timeDifference = roundedDuration - rawDuration

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-md border border-gray-200 p-6',
        className
      )}
      data-testid="timer-widget"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900" data-testid="timer-title">
          Time Tracker
        </h3>
        <div 
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            isRunning && !isPaused && 'bg-green-100 text-green-800',
            isRunning && isPaused && 'bg-yellow-100 text-yellow-800',
            !isRunning && 'bg-gray-100 text-gray-800'
          )}
          data-testid="timer-status"
        >
          {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div
          className="text-4xl font-mono font-bold text-gray-900 mb-2"
          data-testid="timer-duration"
        >
          {formatTime(elapsedTime)}
        </div>
        {selectedProject && (
          <div className="text-sm text-gray-600" data-testid="estimated-earnings">
            Estimated earnings: ${estimatedEarnings.toFixed(2)}
          </div>
        )}
      </div>

      {/* Project Selection */}
      <div className="space-y-4 mb-6">
        <div>
          <label
            htmlFor="project-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Project *
          </label>
          <select
            id="project-select"
            data-testid="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={disabled || isRunning}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Select project"
          >
            <option value="" disabled>
              Select a project
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="task-description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Task Description *
          </label>
          <input
            type="text"
            id="task-description"
            data-testid="task-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled || isRunning}
            placeholder="What are you working on?"
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Task description"
            maxLength={500}
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {description.length}/500
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-3">
        {!isRunning ? (
          <Button
            onClick={handleStart}
            disabled={disabled || !selectedProjectId || !description.trim()}
            className="flex-1"
            data-testid="start-timer-button"
            aria-label="Start timer"
          >
            Start Timer
          </Button>
        ) : (
          <>
            <Button
              onClick={isPaused ? onResumeTimer : onPauseTimer}
              variant="secondary"
              disabled={disabled}
              className="flex-1"
              data-testid={isPaused ? "resume-timer-button" : "pause-timer-button"}
              aria-label={isPaused ? "Resume timer" : "Pause timer"}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              onClick={handleStop}
              variant="destructive"
              disabled={disabled}
              className="flex-1"
              data-testid="stop-timer-button"
              aria-label="Stop timer"
            >
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Additional Info */}
      {isRunning && startTime && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 space-y-1">
            <div data-testid="start-time">
              Started: {formatDate(startTime)}
            </div>
            {selectedProject && (
              <div data-testid="hourly-rate">
                Rate: ${selectedProject.hourlyRate}/hour
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}