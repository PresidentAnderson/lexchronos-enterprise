'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  FileText,
  Users,
  AlertCircle,
  CheckCircle,
  Zap,
  MapPin,
  Eye,
  Filter
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from '@/hooks/useToast';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
  importance: string;
  isVerified?: boolean;
  source?: string;
  location?: string;
  participants?: string[];
  attachments?: any[];
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

interface CaseTimelineProps {
  caseId: string;
  timeline: TimelineEvent[];
  onUpdate: () => void;
}

const EVENT_TYPES = [
  { value: 'FILING', label: 'Court Filing', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  { value: 'HEARING', label: 'Hearing', icon: Users, color: 'bg-purple-100 text-purple-800' },
  { value: 'MEETING', label: 'Meeting', icon: Users, color: 'bg-green-100 text-green-800' },
  { value: 'DEADLINE', label: 'Deadline', icon: Clock, color: 'bg-red-100 text-red-800' },
  { value: 'DOCUMENT', label: 'Document', icon: FileText, color: 'bg-gray-100 text-gray-800' },
  { value: 'COMMUNICATION', label: 'Communication', icon: Users, color: 'bg-orange-100 text-orange-800' },
  { value: 'MILESTONE', label: 'Milestone', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'OTHER', label: 'Other', icon: Zap, color: 'bg-gray-100 text-gray-800' }
];

const IMPORTANCE_LEVELS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' }
];

export function CaseTimeline({ caseId, timeline, onUpdate }: CaseTimelineProps) {
  const { toast } = useToast();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    eventType: 'ALL',
    importance: 'ALL',
    verified: 'ALL'
  });
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventType: 'OTHER',
    importance: 'MEDIUM',
    location: '',
    participants: ''
  });

  const handleAddEvent = async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEvent,
          participants: newEvent.participants.split(',').map(p => p.trim()).filter(Boolean)
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Timeline event added successfully');
        setNewEvent({
          title: '',
          description: '',
          eventDate: '',
          eventType: 'OTHER',
          importance: 'MEDIUM',
          location: '',
          participants: ''
        });
        setShowAddForm(false);
        onUpdate();
      } else {
        toast.error(data.error || 'Failed to add timeline event');
      }
    } catch (error) {
      console.error('Failed to add timeline event:', error);
      toast.error('Error adding timeline event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this timeline event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cases/${caseId}/timeline/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Timeline event deleted successfully');
        onUpdate();
      } else {
        toast.error(data.error || 'Failed to delete timeline event');
      }
    } catch (error) {
      console.error('Failed to delete timeline event:', error);
      toast.error('Error deleting timeline event');
    }
  };

  const getEventTypeInfo = (eventType: string) => {
    return EVENT_TYPES.find(type => type.value === eventType) || EVENT_TYPES.find(type => type.value === 'OTHER')!;
  };

  const getImportanceInfo = (importance: string) => {
    return IMPORTANCE_LEVELS.find(level => level.value === importance) || IMPORTANCE_LEVELS.find(level => level.value === 'MEDIUM')!;
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
  };

  const formatDateTime = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : 'Invalid date';
  };

  const filteredTimeline = timeline.filter(event => {
    if (filters.eventType !== 'ALL' && event.eventType !== filters.eventType) {
      return false;
    }
    if (filters.importance !== 'ALL' && event.importance !== filters.importance) {
      return false;
    }
    if (filters.verified !== 'ALL') {
      const isVerified = event.isVerified;
      if ((filters.verified === 'VERIFIED' && !isVerified) || 
          (filters.verified === 'UNVERIFIED' && isVerified)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  return (
    <div className="space-y-6">
      {/* Header with Add Button and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Case Timeline ({filteredTimeline.length} events)
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Filters */}
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filters:</span>
            </div>
            
            <Select value={filters.eventType} onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {EVENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.importance} onValueChange={(value) => setFilters(prev => ({ ...prev, importance: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Importance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                {IMPORTANCE_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.verified} onValueChange={(value) => setFilters(prev => ({ ...prev, verified: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Events</SelectItem>
                <SelectItem value="VERIFIED">Verified Only</SelectItem>
                <SelectItem value="UNVERIFIED">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add Event Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Timeline Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select value={newEvent.eventType} onValueChange={(value) => setNewEvent({ ...newEvent, eventType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="importance">Importance Level</Label>
                <Select value={newEvent.importance} onValueChange={(value) => setNewEvent({ ...newEvent, importance: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPORTANCE_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Describe the event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>
              <div>
                <Label htmlFor="participants">Participants (Optional)</Label>
                <Input
                  id="participants"
                  value={newEvent.participants}
                  onChange={(e) => setNewEvent({ ...newEvent, participants: e.target.value })}
                  placeholder="Comma-separated names"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddEvent} disabled={!newEvent.title || !newEvent.eventDate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Events */}
      <div className="space-y-4">
        {filteredTimeline.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No timeline events found</h3>
              <p className="text-gray-600 mb-4">
                {timeline.length === 0 
                  ? 'Start building your case timeline by adding events'
                  : 'No events match your current filters'
                }
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTimeline.map((event, index) => {
            const eventTypeInfo = getEventTypeInfo(event.eventType);
            const importanceInfo = getImportanceInfo(event.importance);
            const IconComponent = eventTypeInfo.icon;
            
            return (
              <div key={event.id} className="relative">
                {/* Timeline connector line */}
                {index !== filteredTimeline.length - 1 && (
                  <div className="absolute left-8 top-16 w-0.5 h-16 bg-gray-200"></div>
                )}
                
                <Card className="ml-4 relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-6 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${eventTypeInfo.color}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <Badge className={importanceInfo.color}>
                              {importanceInfo.label}
                            </Badge>
                            {event.isVerified && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(event.eventDate)}</span>
                            </div>
                            <Badge variant="outline" className={eventTypeInfo.color}>
                              {eventTypeInfo.label}
                            </Badge>
                          </div>

                          {event.description && (
                            <p className="text-gray-700 text-sm mb-3">{event.description}</p>
                          )}

                          {/* Additional Details */}
                          <div className="space-y-2">
                            {event.location && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            )}

                            {event.participants && event.participants.length > 0 && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Users className="h-4 w-4" />
                                <span>{event.participants.join(', ')}</span>
                              </div>
                            )}

                            {event.source && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <FileText className="h-4 w-4" />
                                <span>Source: {event.source}</span>
                              </div>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                            <div className="flex items-center justify-between">
                              <span>
                                Added {formatDateTime(event.createdAt)}
                                {event.createdBy && (
                                  <span> by {event.createdBy.firstName} {event.createdBy.lastName}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}