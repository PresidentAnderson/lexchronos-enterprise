'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './button'
import { cn, formatDate } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Separator } from './separator'
import { Input } from './input'
import { Textarea } from './textarea'
import { Clock, PlayCircle, PauseCircle, StopCircle, Settings, DollarSign, AlertCircle, Edit2 } from 'lucide-react'

export interface RoundingRule {
  type: 'UP' | 'DOWN' | 'NEAREST' | 'NONE'
  increment: number // in minutes (e.g., 15, 30, 60)
  minimumTime: number // minimum billable time in minutes
}

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

export interface EnhancedTimerWidgetProps {
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

export const EnhancedTimerWidget: React.FC<EnhancedTimerWidgetProps> = ({
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
  const [newTag, setNewTag] = useState('')

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
      setNewTag('')
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

  return (
    <Card className={cn('w-full max-w-2xl', className)} data-testid="enhanced-timer-widget">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Professional Time Tracker
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isRunning ? (isPaused ? 'secondary' : 'default') : 'outline'}
              className={cn(
                isRunning && !isPaused && 'bg-green-500 hover:bg-green-600',
                isRunning && isPaused && 'bg-yellow-500 hover:bg-yellow-600'
              )}
              data-testid="timer-status"
            >
              {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
            </Badge>
            {showAdvancedFeatures && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="text-center space-y-3">
          <div className="space-y-2">
            <div
              className="text-4xl font-mono font-bold text-primary"
              data-testid="timer-duration"
            >
              {formatTime(elapsedTime)}
            </div>
            {selectedProject && timeDifference !== 0 && (
              <div className="text-lg font-mono text-muted-foreground">
                Rounded: {formatDurationWithRounding(roundedDuration)}
                <Badge 
                  variant={timeDifference > 0 ? 'default' : 'secondary'} 
                  className="ml-2 text-xs"
                >
                  {timeDifference > 0 ? '+' : ''}{(timeDifference / 60).toFixed(1)}min
                </Badge>
              </div>
            )}
          </div>
          
          {selectedProject && (
            <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
              <div className="flex items-center justify-center gap-1 text-green-600">
                <DollarSign className="h-4 w-4" />
                <span data-testid="estimated-earnings">
                  ${estimatedEarnings.toFixed(2)}
                </span>
              </div>
              <div className="text-muted-foreground">
                @ ${effectiveRate}/hr
              </div>
            </div>
          )}
          
          {selectedProject?.requiresApproval && (
            <Badge variant="outline" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Requires Approval
            </Badge>
          )}
        </div>

        {/* Project Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project *</label>
            <Select 
              value={selectedProjectId} 
              onValueChange={setSelectedProjectId}
              disabled={disabled || isRunning}
            >
              <SelectTrigger data-testid="project-select">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      {project.color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {project.clientName} • ${project.hourlyRate}/hr
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Billing: {selectedProject.billingType}</div>
                <div>
                  Rounding: {selectedProject.roundingRules.type} to {selectedProject.roundingRules.increment}min 
                  (min: {selectedProject.roundingRules.minimumTime}min)
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Task Description *</label>
            <Input
              data-testid="task-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={disabled || isRunning}
              placeholder="What are you working on?"
              maxLength={500}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{description.length}/500</span>
            </div>
          </div>
          
          {showAdvancedFeatures && (
            <>
              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1 min-h-[32px] p-2 border rounded-md">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button 
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                          disabled={isRunning}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag.trim()) {
                          e.preventDefault()
                          addTag(newTag.trim())
                        }
                      }}
                      disabled={isRunning}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => addTag(newTag.trim())}
                      disabled={!newTag.trim() || isRunning}
                      variant="outline"
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Custom Rate Override */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Rate (Override)</label>
                <Input
                  type="number"
                  value={customRate || ''}
                  onChange={(e) => setCustomRate(e.target.value ? parseFloat(e.target.value) : null)}
                  disabled={disabled || isRunning}
                  placeholder={`Default: $${selectedProject?.hourlyRate || 0}`}
                  min="0"
                  step="0.01"
                />
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="min-h-[80px]"
                  maxLength={1000}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {notes.length}/1000
                </div>
              </div>
            </>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              disabled={disabled || !selectedProjectId || !description.trim()}
              className="flex-1"
              data-testid="start-timer-button"
              size="lg"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
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
                size="lg"
              >
                {isPaused ? (
                  <><PlayCircle className="h-4 w-4 mr-2" />Resume</>
                ) : (
                  <><PauseCircle className="h-4 w-4 mr-2" />Pause</>
                )}
              </Button>
              <Button
                onClick={() => handleStop(true)}
                variant="default"
                disabled={disabled}
                className="flex-1"
                data-testid="stop-timer-button"
                size="lg"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop & Save
              </Button>
              {showAdvancedFeatures && (
                <Button
                  onClick={() => handleStop(false)}
                  variant="outline"
                  disabled={disabled}
                  size="lg"
                >
                  Discard
                </Button>
              )}
            </>
          )}
        </div>

        {/* Additional Info */}
        {isRunning && startTime && (
          <>
            <Separator />
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between items-center" data-testid="start-time">
                <span>Started:</span>
                <span>{formatDate(startTime)}</span>
              </div>
              {selectedProject && (
                <div className="flex justify-between items-center" data-testid="hourly-rate">
                  <span>Rate:</span>
                  <span>${effectiveRate}/hour</span>
                </div>
              )}
              {tags.length > 0 && (
                <div className="space-y-1">
                  <span>Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Recent Entries */}
        {showAdvancedFeatures && recentEntries.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Entries</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentEntries.slice(0, 5).map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium truncate">{entry.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(entry.roundedDuration)} • ${entry.totalAmount.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={entry.status === 'APPROVED' ? 'default' : 
                               entry.status === 'SUBMITTED' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {entry.status}
                      </Badge>
                      {onEditEntry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditEntry(entry)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Time Rounding Utilities
export const ROUNDING_PRESETS: Record<string, RoundingRule> = {
  'none': { type: 'NONE', increment: 1, minimumTime: 0 },
  'up-15': { type: 'UP', increment: 15, minimumTime: 15 },
  'up-30': { type: 'UP', increment: 30, minimumTime: 30 },
  'nearest-15': { type: 'NEAREST', increment: 15, minimumTime: 6 },
  'nearest-30': { type: 'NEAREST', increment: 30, minimumTime: 6 },
  'down-15': { type:'DOWN', increment: 15, minimumTime: 15 }
}

// Default project settings
export const DEFAULT_PROJECT_SETTINGS: Partial<Project> = {
  billingType: 'HOURLY',
  roundingRules: ROUNDING_PRESETS['up-15'],
  requiresApproval: false
}