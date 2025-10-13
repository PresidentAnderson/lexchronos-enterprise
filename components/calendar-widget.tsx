"use client";

import * as React from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isSameMonth, addWeeks, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Plus,
} from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: "deadline" | "hearing" | "meeting" | "reminder";
  status: "upcoming" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
  color?: string;
}

interface CalendarWidgetProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  view?: "month" | "week" | "day";
  className?: string;
}

const eventTypeColors = {
  deadline: "bg-red-100 text-red-800 border-red-200",
  hearing: "bg-purple-100 text-purple-800 border-purple-200",
  meeting: "bg-blue-100 text-blue-800 border-blue-200",
  reminder: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function CalendarWidget({
  events = [],
  onDateSelect,
  onEventClick,
  onAddEvent,
  view = "month",
  className,
}: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (view === "week") {
      setCurrentDate(prev => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (view === "week") {
      setCurrentDate(prev => addWeeks(prev, 1));
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors hover:bg-accent",
                isCurrentMonth ? "bg-background" : "bg-muted/30",
                isSelected && "ring-2 ring-primary",
                isToday(day) && "bg-primary/10 border-primary"
              )}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm",
                  isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                  isToday(day) && "font-bold text-primary"
                )}>
                  {format(day, "d")}
                </span>
                {onAddEvent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddEvent(day);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs p-1 rounded border truncate cursor-pointer",
                      eventTypeColors[event.type]
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    title={event.title}
                  >
                    {event.time && (
                      <span className="font-medium">{event.time} </span>
                    )}
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            
            return (
              <div key={day.toString()} className="space-y-2">
                <div 
                  className={cn(
                    "text-center p-2 rounded-lg cursor-pointer transition-colors hover:bg-accent",
                    isSelected && "bg-primary text-primary-foreground",
                    isToday(day) && !isSelected && "bg-primary/10 border border-primary"
                  )}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="text-sm font-medium">
                    {format(day, "EEE")}
                  </div>
                  <div className="text-lg">
                    {format(day, "d")}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-2 rounded border cursor-pointer text-sm",
                        eventTypeColors[event.type]
                      )}
                      onClick={() => onEventClick?.(event)}
                    >
                      {event.time && (
                        <div className="font-medium text-xs mb-1">
                          {event.time}
                        </div>
                      )}
                      <div className="truncate">{event.title}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {view === "month" ? format(currentDate, "MMMM yyyy") : format(currentDate, "MMM d, yyyy")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === "month" ? renderMonthView() : renderWeekView()}
      </CardContent>
    </Card>
  );
}

// Upcoming events widget
export function UpcomingEvents({ 
  events = [], 
  limit = 5,
  onEventClick 
}: { 
  events: CalendarEvent[], 
  limit?: number,
  onEventClick?: (event: CalendarEvent) => void 
}) {
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date() && event.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent"
              onClick={() => onEventClick?.(event)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", eventTypeColors[event.type])}
                  >
                    {event.type}
                  </Badge>
                  {event.priority === "high" && (
                    <Badge variant="destructive" className="text-xs">
                      High
                    </Badge>
                  )}
                </div>
                <p className="font-medium truncate">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.date), "MMM d, yyyy")}
                  {event.time && ` at ${event.time}`}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No upcoming events
          </p>
        )}
      </CardContent>
    </Card>
  );
}