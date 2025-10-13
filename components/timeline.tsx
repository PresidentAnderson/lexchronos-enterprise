"use client";

import * as React from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  FileText,
  Scale,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
} from "lucide-react";

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "filing" | "hearing" | "deadline" | "meeting" | "document" | "communication";
  status: "completed" | "pending" | "upcoming" | "overdue";
  priority: "high" | "medium" | "low";
  participants?: string[];
  location?: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  caseId?: string;
  caseName?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
  compact?: boolean;
  showFilters?: boolean;
  onEventClick?: (event: TimelineEvent) => void;
}

const eventTypeIcons = {
  filing: Scale,
  hearing: Calendar,
  deadline: Clock,
  meeting: User,
  document: FileText,
  communication: User,
};

const eventTypeColors = {
  filing: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  hearing: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  deadline: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  meeting: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  document: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  communication: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

const statusColors = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export function Timeline({ 
  events, 
  className, 
  compact = false, 
  showFilters = false,
  onEventClick 
}: TimelineProps) {
  const [expandedEvent, setExpandedEvent] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredEvents = React.useMemo(() => {
    return events.filter(event => {
      const matchesType = filterType === "all" || event.type === filterType;
      const matchesStatus = filterStatus === "all" || event.status === filterStatus;
      const matchesSearch = searchTerm === "" || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.caseName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [events, filterType, filterStatus, searchTerm]);

  const sortedEvents = React.useMemo(() => {
    return [...filteredEvents].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredEvents]);

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  const getTimelinePosition = (date: string, index: number) => {
    const eventDate = parseISO(date);
    const today = new Date();
    const daysDiff = differenceInDays(eventDate, today);
    
    // Position logic for visual timeline
    return {
      isPast: daysDiff < 0,
      isToday: daysDiff === 0,
      isFuture: daysDiff > 0,
      daysDiff: Math.abs(daysDiff),
    };
  };

  const handleEventClick = (event: TimelineEvent) => {
    toggleEventExpansion(event.id);
    onEventClick?.(event);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {showFilters && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-md bg-background"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">All Types</option>
                  <option value="filing">Filings</option>
                  <option value="hearing">Hearings</option>
                  <option value="deadline">Deadlines</option>
                  <option value="meeting">Meetings</option>
                  <option value="document">Documents</option>
                  <option value="communication">Communications</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {sortedEvents.map((event, index) => {
            const IconComponent = eventTypeIcons[event.type];
            const timelinePos = getTimelinePosition(event.date, index);
            const isExpanded = expandedEvent === event.id;
            
            return (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background z-10",
                  timelinePos.isPast ? "border-green-500" : 
                  timelinePos.isToday ? "border-blue-500" :
                  "border-gray-300"
                )}>
                  <IconComponent className={cn(
                    "h-4 w-4",
                    timelinePos.isPast ? "text-green-500" :
                    timelinePos.isToday ? "text-blue-500" :
                    "text-gray-500"
                  )} />
                </div>

                {/* Event card */}
                <Card className={cn(
                  "flex-1 cursor-pointer transition-all hover:shadow-md",
                  compact ? "p-4" : "",
                  event.status === "overdue" ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20" : ""
                )}>
                  <CardHeader 
                    className={cn("pb-2", compact && "p-0 pb-2")}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", eventTypeColors[event.type])}
                          >
                            {event.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", statusColors[event.status])}
                          >
                            {event.status}
                          </Badge>
                          {event.priority === "high" && (
                            <Badge variant="destructive" className="text-xs">
                              High Priority
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg font-semibold truncate">
                          {event.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(parseISO(event.date), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                        {event.caseName && (
                          <p className="text-sm text-muted-foreground">
                            Case: {event.caseName}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEventExpansion(event.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  {(isExpanded || !compact) && (
                    <CardContent className={cn("pt-0", compact && "p-0 pt-2")}>
                      <p className="text-sm text-foreground mb-4">
                        {event.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        
                        {event.participants && event.participants.length > 0 && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{event.participants.join(", ")}</span>
                          </div>
                        )}
                        
                        {event.documents && event.documents.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{event.documents.length} document(s)</span>
                          </div>
                        )}
                      </div>

                      {event.documents && event.documents.length > 0 && isExpanded && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Related Documents</h4>
                          <div className="space-y-1">
                            {event.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center gap-2 text-sm">
                                <FileText className="h-3 w-3" />
                                <span className="text-blue-600 hover:underline cursor-pointer">
                                  {doc.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {doc.type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            );
          })}
        </div>

        {sortedEvents.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No events found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility component for creating new timeline events
export function TimelineEventForm({ onSubmit }: { onSubmit: (event: Partial<TimelineEvent>) => void }) {
  // This would be a form component for creating/editing timeline events
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Timeline Event</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Timeline event form would go here</p>
      </CardContent>
    </Card>
  );
}