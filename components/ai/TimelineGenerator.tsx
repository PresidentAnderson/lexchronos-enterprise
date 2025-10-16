'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Calendar, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  MapPin,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/useToast';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sources: string[];
  category?: string;
  location?: string;
  participants?: string[];
  confidence: number;
}

interface Evidence {
  id: string;
  title: string;
  description?: string;
  dateObtained: string;
  type: string;
  content?: string;
  keyPoints?: string[];
}

interface TimelineGeneratorProps {
  caseId: string;
  organizationId: string;
  evidence: Evidence[];
  onTimelineGenerated?: (timeline: TimelineEvent[]) => void;
}

export function TimelineGenerator({ 
  caseId, 
  organizationId, 
  evidence, 
  onTimelineGenerated 
}: TimelineGeneratorProps) {
  const { toast } = useToast();
  
  const [generating, setGenerating] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [progress, setProgress] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'chronological' | 'thematic' | 'legal'>('chronological');

  useEffect(() => {
    if (evidence.length > 0) {
      // Auto-generate timeline when evidence is loaded
      generateTimeline();
    }
  }, [evidence]);

  const generateTimeline = async () => {
    if (evidence.length === 0) {
      toast.error('No evidence available to generate timeline');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/ai/timeline-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          organizationId,
          evidence: evidence.map(e => ({
            title: e.title,
            description: e.description,
            dateObtained: e.dateObtained,
            type: e.type,
            content: e.content?.substring(0, 2000), // Limit content length
            keyPoints: e.keyPoints
          })),
          analysisMode,
          customPrompt: customPrompt || undefined
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (data.success) {
        const generatedTimeline = data.data.timeline.map((event: any, index: number) => ({
          ...event,
          id: `timeline-${index}`,
          confidence: event.confidence || 0.8
        }));

        setTimeline(generatedTimeline);
        setSelectedEvents(new Set(generatedTimeline.map((e: TimelineEvent) => e.id)));
        
        if (onTimelineGenerated) {
          onTimelineGenerated(generatedTimeline);
        }

        toast.success(`Generated timeline with ${generatedTimeline.length} events`);
      } else {
        toast.error(data.error || 'Failed to generate timeline');
      }
    } catch (error) {
      console.error('Timeline generation error:', error);
      toast.error('Timeline generation failed');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const exportTimeline = () => {
    const selectedTimeline = timeline.filter(event => selectedEvents.has(event.id));
    
    if (selectedTimeline.length === 0) {
      toast.error('No events selected for export');
      return;
    }

    const csvContent = [
      ['Date', 'Title', 'Description', 'Importance', 'Sources', 'Location', 'Participants'].join(','),
      ...selectedTimeline.map(event => [
        event.date,
        `"${event.title}"`,
        `"${event.description}"`,
        event.importance,
        `"${event.sources.join('; ')}"`,
        `"${event.location || ''}"`,
        `"${event.participants?.join('; ') || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `case-timeline-${caseId}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Timeline exported successfully');
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sortedTimeline = timeline
    .filter(event => selectedEvents.has(event.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Timeline Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Analysis Mode</label>
              <select
                value={analysisMode}
                onChange={(e) => setAnalysisMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={generating}
              >
                <option value="chronological">Chronological Order</option>
                <option value="thematic">Thematic Grouping</option>
                <option value="legal">Legal Significance</option>
              </select>
            </div>

            <Button 
              onClick={generateTimeline}
              disabled={generating || evidence.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Timeline
                </>
              )}
            </Button>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Custom Instructions (Optional)
            </label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add specific instructions for timeline generation..."
              disabled={generating}
              rows={3}
            />
          </div>

          {/* Progress */}
          {generating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating timeline...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Stats */}
          {timeline.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{timeline.length}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{selectedEvents.size}</div>
                <div className="text-sm text-gray-600">Selected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {timeline.filter(e => e.importance === 'CRITICAL' || e.importance === 'HIGH').length}
                </div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{evidence.length}</div>
                <div className="text-sm text-gray-600">Evidence Sources</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Display */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Generated Timeline
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvents(new Set(timeline.map(e => e.id)))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvents(new Set())}
                >
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTimeline}
                  disabled={selectedEvents.size === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-4">
                <div className="space-y-4">
                  {sortedTimeline.map((event, index) => (
                    <div key={event.id} className="relative">
                      {/* Timeline connector */}
                      {index !== sortedTimeline.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Selection checkbox */}
                        <div className="flex items-center pt-2">
                          <input
                            type="checkbox"
                            checked={selectedEvents.has(event.id)}
                            onChange={() => toggleEventSelection(event.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* Timeline dot */}
                        <div className={`w-3 h-3 rounded-full mt-3 shrink-0 ${
                          event.importance === 'CRITICAL' ? 'bg-red-500' :
                          event.importance === 'HIGH' ? 'bg-orange-500' :
                          event.importance === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>

                        {/* Event content */}
                        <div className="flex-1 pb-6">
                          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                <Badge className={`text-xs ${getImportanceColor(event.importance)}`}>
                                  {event.importance}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(event.date), 'MMM d, yyyy')}
                              </div>
                            </div>

                            <p className="text-gray-700 mb-3">{event.description}</p>

                            {/* Additional details */}
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

                              {/* Confidence score */}
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <TrendingUp className="h-4 w-4" />
                                <span>Confidence: {Math.round(event.confidence * 100)}%</span>
                              </div>
                            </div>

                            {/* Sources */}
                            {event.sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-sm font-medium text-gray-700 mb-1">Sources:</div>
                                <div className="flex flex-wrap gap-1">
                                  {event.sources.map((source, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Importance Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Event Importance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(importance => {
                          const count = timeline.filter(e => e.importance === importance).length;
                          const percentage = timeline.length > 0 ? (count / timeline.length) * 100 : 0;
                          return (
                            <div key={importance} className="flex items-center justify-between">
                              <span className="text-sm">{importance}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      importance === 'CRITICAL' ? 'bg-red-500' :
                                      importance === 'HIGH' ? 'bg-orange-500' :
                                      importance === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">{count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline Quality */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Timeline Quality</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Coverage</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Complete</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Confidence</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {Math.round((timeline.reduce((sum, e) => sum + e.confidence, 0) / timeline.length) * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Evidence Sources</span>
                        <span className="text-sm">{evidence.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}