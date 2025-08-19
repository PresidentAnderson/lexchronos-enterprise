"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { CalendarWidget, UpcomingEvents, type CalendarEvent } from "@/components/calendar-widget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Plus, 
  Filter, 
  Download, 
  Clock,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";
import Link from "next/link";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";

// Mock user data
const mockUser = {
  name: "Sarah Johnson",
  email: "sarah.johnson@lawfirm.com",
  role: "lawyer" as const,
  avatar: "",
};

// Comprehensive calendar events data
const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Board Approval Meeting - TechCorp",
    date: "2024-08-22T10:00:00Z",
    time: "10:00 AM",
    type: "meeting",
    status: "upcoming",
    priority: "high",
  },
  {
    id: "2",
    title: "Motion Filing Deadline",
    date: "2024-08-25T17:00:00Z", 
    time: "5:00 PM",
    type: "deadline",
    status: "upcoming",
    priority: "high",
  },
  {
    id: "3",
    title: "Client Meeting - Williams Trust Review",
    date: "2024-08-30T14:00:00Z",
    time: "2:00 PM", 
    type: "meeting",
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "4",
    title: "Court Hearing - Summary Judgment",
    date: "2024-09-05T09:00:00Z",
    time: "9:00 AM",
    type: "hearing",
    status: "upcoming",
    priority: "high",
  },
  {
    id: "5",
    title: "Mediation Session - Employment Case",
    date: "2024-09-10T10:00:00Z",
    time: "10:00 AM",
    type: "meeting",
    status: "upcoming",
    priority: "high",
  },
  {
    id: "6",
    title: "Patent Office Response Due",
    date: "2024-09-15T17:00:00Z",
    time: "5:00 PM",
    type: "deadline",
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "7",
    title: "Discovery Response Due - TechCorp",
    date: "2024-08-28T17:00:00Z",
    time: "5:00 PM",
    type: "deadline",
    status: "upcoming",
    priority: "high",
  },
  {
    id: "8",
    title: "Deposition - Dr. Smith",
    date: "2024-09-12T14:00:00Z",
    time: "2:00 PM",
    type: "hearing",
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "9",
    title: "Client Consultation - New Case",
    date: "2024-08-26T11:00:00Z",
    time: "11:00 AM",
    type: "meeting",
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "10",
    title: "Status Conference - Employment Case",
    date: "2024-09-18T15:00:00Z",
    time: "3:00 PM",
    type: "hearing",
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "11",
    title: "Document Review Session",
    date: "2024-08-27T13:00:00Z",
    time: "1:00 PM",
    type: "meeting",
    status: "upcoming",
    priority: "low",
  },
  {
    id: "12",
    title: "Bar Association CLE Seminar",
    date: "2024-09-20T09:00:00Z",
    time: "9:00 AM",
    type: "reminder",
    status: "upcoming",
    priority: "low",
  },
];

// Mock upcoming deadlines and reminders
const mockUpcomingDeadlines = [
  {
    id: "d1",
    title: "Motion Filing Deadline",
    date: "2024-08-25T17:00:00Z",
    case: "Johnson v. State Insurance Co.",
    daysUntil: 7,
    priority: "high",
  },
  {
    id: "d2", 
    title: "Discovery Response Due",
    date: "2024-08-28T17:00:00Z",
    case: "Corporate Merger - TechCorp",
    daysUntil: 10,
    priority: "high",
  },
  {
    id: "d3",
    title: "Patent Office Response",
    date: "2024-09-15T17:00:00Z", 
    case: "Patent Application - AI Technology",
    daysUntil: 28,
    priority: "medium",
  },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [viewMode, setViewMode] = React.useState<"month" | "week" | "day">("month");
  const [filterType, setFilterType] = React.useState<string>("all");

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    console.log("Date selected:", date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log("Event clicked:", event);
    // In a real app, this might open an event detail modal
  };

  const handleAddEvent = (date: Date) => {
    console.log("Add event for date:", date);
    // In a real app, this would open a new event form
  };

  const filteredEvents = React.useMemo(() => {
    if (filterType === "all") return mockCalendarEvents;
    return mockCalendarEvents.filter(event => event.type === filterType);
  }, [mockCalendarEvents, filterType]);

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Calculate stats
  const totalEvents = mockCalendarEvents.length;
  const upcomingEvents = mockCalendarEvents.filter(e => e.status === "upcoming").length;
  const highPriorityEvents = mockCalendarEvents.filter(e => e.priority === "high").length;
  const deadlines = mockCalendarEvents.filter(e => e.type === "deadline").length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={mockUser} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" />
                Calendar
              </h1>
              <p className="text-muted-foreground">
                Manage your schedule, deadlines, and appointments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Calendar
              </Button>
              <Button asChild>
                <Link href="/calendar/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Event
                </Link>
              </Button>
            </div>
          </div>

          {/* Calendar Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-xl font-bold">{totalEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                    <p className="text-xl font-bold">{upcomingEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                    <p className="text-xl font-bold">{highPriorityEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deadlines</p>
                    <p className="text-xl font-bold">{deadlines}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Calendar - Takes up 3 columns */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(currentDate, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggles */}
                    <div className="flex border rounded-md">
                      <Button
                        variant={viewMode === "month" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("month")}
                      >
                        Month
                      </Button>
                      <Button
                        variant={viewMode === "week" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("week")}
                      >
                        Week
                      </Button>
                      <Button
                        variant={viewMode === "day" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("day")}
                      >
                        Day
                      </Button>
                    </div>
                    
                    {/* Event Type Filter */}
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="all">All Events</option>
                      <option value="meeting">Meetings</option>
                      <option value="hearing">Hearings</option>
                      <option value="deadline">Deadlines</option>
                      <option value="reminder">Reminders</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CalendarWidget
                  events={filteredEvents}
                  view={viewMode}
                  onDateSelect={handleDateSelect}
                  onEventClick={handleEventClick}
                  onAddEvent={handleAddEvent}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Takes up 1 column */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <UpcomingEvents
              events={filteredEvents}
              limit={8}
              onEventClick={handleEventClick}
            />

            {/* Critical Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Critical Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockUpcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className={`p-3 rounded-lg border ${
                      deadline.daysUntil <= 7 
                        ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                        : deadline.daysUntil <= 14 
                        ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{deadline.title}</p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {deadline.case}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              deadline.priority === "high" 
                                ? "border-red-300 text-red-700"
                                : "border-orange-300 text-orange-700"
                            }`}
                          >
                            {deadline.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(deadline.date), "MMM d")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${
                          deadline.daysUntil <= 7 ? 'text-red-600' : 
                          deadline.daysUntil <= 14 ? 'text-orange-600' : 'text-yellow-600'
                        }`}>
                          {deadline.daysUntil} days
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Set Deadline
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Court Hearing
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Set Reminder
                </Button>
              </CardContent>
            </Card>

            {/* Today's Events */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    {format(selectedDate, "MMM d, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getEventsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-2">
                      {getEventsForDate(selectedDate).map((event) => (
                        <div
                          key={event.id}
                          className="p-2 rounded border cursor-pointer hover:bg-accent"
                          onClick={() => handleEventClick(event)}
                        >
                          <p className="text-sm font-medium">{event.title}</p>
                          {event.time && (
                            <p className="text-xs text-muted-foreground">{event.time}</p>
                          )}
                          <Badge 
                            variant="outline" 
                            className="text-xs mt-1"
                          >
                            {event.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No events scheduled</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}