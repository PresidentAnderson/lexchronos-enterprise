"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CaseCard, type Case } from "@/components/case-card";
import { Timeline, type TimelineEvent } from "@/components/timeline";
import { CalendarWidget, UpcomingEvents, type CalendarEvent } from "@/components/calendar-widget";
import { format, addDays, subDays } from "date-fns";
import {
  Scale,
  FileText,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

// Mock data for the dashboard
const mockUser = {
  name: "Sarah Johnson",
  email: "sarah.johnson@lawfirm.com",
  role: "lawyer" as const,
  avatar: "",
};

const mockStats = {
  totalCases: 24,
  activeCases: 18,
  completedThisMonth: 3,
  upcomingDeadlines: 7,
  totalBilled: 87500,
  hoursWorked: 156,
  clientsServed: 34,
  documentsManaged: 342,
};

const mockCases: Case[] = [
  {
    id: "1",
    title: "Johnson v. State Insurance Co.",
    caseNumber: "CV-2024-001",
    client: {
      name: "Michael Johnson",
      email: "mjohnson@email.com",
      phone: "(555) 123-4567",
    },
    description: "Insurance claim dispute involving property damage from natural disaster. Client seeking compensation for denied claim.",
    status: "active",
    priority: "high",
    practice_area: "Insurance Law",
    assignedLawyer: "Sarah Johnson",
    createdDate: "2024-01-15T00:00:00Z",
    lastUpdated: "2024-08-18T00:00:00Z",
    nextDeadline: {
      date: "2024-08-25T09:00:00Z",
      title: "Motion filing deadline",
      type: "filing",
    },
    billingInfo: {
      hourlyRate: 350,
      totalBilled: 12500,
      hoursWorked: 35.7,
    },
    documents: 23,
    courtLocation: "Superior Court of California",
    judge: "Hon. Patricia Williams",
    opposingCounsel: "Davis & Associates",
  },
  {
    id: "2",
    title: "Estate Planning - Williams Family Trust",
    caseNumber: "EP-2024-078",
    client: {
      name: "Robert Williams",
      email: "rwilliams@email.com",
      phone: "(555) 987-6543",
    },
    description: "Comprehensive estate planning including trust establishment, will preparation, and tax planning strategies.",
    status: "active",
    priority: "medium",
    practice_area: "Estate Planning",
    assignedLawyer: "Sarah Johnson",
    createdDate: "2024-07-02T00:00:00Z",
    lastUpdated: "2024-08-17T00:00:00Z",
    nextDeadline: {
      date: "2024-08-30T14:00:00Z",
      title: "Client meeting - trust review",
      type: "meeting",
    },
    billingInfo: {
      hourlyRate: 350,
      totalBilled: 8750,
      hoursWorked: 25.0,
    },
    documents: 15,
  },
  {
    id: "3",
    title: "Corporate Merger - TechCorp Acquisition",
    caseNumber: "CM-2024-045",
    client: {
      name: "TechCorp Inc.",
      email: "legal@techcorp.com",
      phone: "(555) 456-7890",
    },
    description: "Due diligence and legal representation for acquisition of smaller technology company.",
    status: "pending",
    priority: "high",
    practice_area: "Corporate Law",
    assignedLawyer: "Sarah Johnson",
    createdDate: "2024-06-10T00:00:00Z",
    lastUpdated: "2024-08-16T00:00:00Z",
    nextDeadline: {
      date: "2024-08-22T10:00:00Z",
      title: "Board approval meeting",
      type: "meeting",
    },
    billingInfo: {
      hourlyRate: 450,
      totalBilled: 22500,
      hoursWorked: 50.0,
    },
    documents: 67,
    opposingCounsel: "Morrison & Associates",
  },
];

const mockTimelineEvents: TimelineEvent[] = [
  {
    id: "1",
    title: "Motion for Summary Judgment Filed",
    description: "Filed motion for summary judgment in Johnson v. State Insurance Co. case",
    date: "2024-08-18T10:30:00Z",
    type: "filing",
    status: "completed",
    priority: "high",
    participants: ["Sarah Johnson", "Michael Johnson"],
    caseId: "1",
    caseName: "Johnson v. State Insurance Co.",
    documents: [
      { id: "d1", name: "Motion for Summary Judgment.pdf", type: "PDF" },
      { id: "d2", name: "Supporting Evidence.pdf", type: "PDF" },
    ],
  },
  {
    id: "2",
    title: "Client Meeting - Estate Planning Review",
    description: "Scheduled meeting with Williams family to review trust documents and discuss tax implications",
    date: "2024-08-30T14:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "medium",
    participants: ["Sarah Johnson", "Robert Williams", "Mary Williams"],
    location: "Conference Room A",
    caseId: "2",
    caseName: "Estate Planning - Williams Family Trust",
  },
  {
    id: "3",
    title: "Discovery Response Due",
    description: "Response to interrogatories and document requests due in corporate merger case",
    date: "2024-08-28T17:00:00Z",
    type: "deadline",
    status: "upcoming",
    priority: "high",
    caseId: "3",
    caseName: "Corporate Merger - TechCorp Acquisition",
  },
  {
    id: "4",
    title: "Deposition Scheduled",
    description: "Deposition of key witness in insurance claim case",
    date: "2024-09-05T09:00:00Z",
    type: "hearing",
    status: "upcoming",
    priority: "high",
    participants: ["Sarah Johnson", "Michael Johnson", "Witness: Dr. Smith"],
    location: "Law Office Conference Room",
    caseId: "1",
    caseName: "Johnson v. State Insurance Co.",
  },
];

const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Board Approval Meeting",
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
    title: "Client Meeting",
    date: "2024-08-30T14:00:00Z",
    time: "2:00 PM",
    type: "meeting",
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "4",
    title: "Court Hearing",
    date: "2024-09-05T09:00:00Z",
    time: "9:00 AM",
    type: "hearing",
    status: "upcoming",
    priority: "high",
  },
];

export default function LegalDashboardPage() {
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<"week" | "month" | "quarter">("month");

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={mockUser} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {mockUser.name}!</h1>
              <p className="text-muted-foreground">
                Here's what's happening with your legal practice today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Case
              </Button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalCases}</div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.activeCases} active cases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.upcomingDeadlines}</div>
                <p className="text-xs text-muted-foreground">
                  Next 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${mockStats.totalBilled.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.hoursWorked} hours this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.clientsServed}</div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.documentsManaged} documents managed
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Activity & Cases */}
          <div className="lg:col-span-2 space-y-8">
            {/* Priority Cases */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Priority Cases
                    </CardTitle>
                    <CardDescription>
                      High-priority cases requiring immediate attention
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/cases">
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockCases.filter(c => c.priority === "high").slice(0, 2).map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    case={caseItem}
                    compact
                    onCaseClick={(c) => console.log("Navigate to case:", c.id)}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Recent Timeline Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest updates across all your cases
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/timeline">
                      View Timeline
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Timeline
                  events={mockTimelineEvents.slice(0, 4)}
                  compact
                  onEventClick={(event) => console.log("Event clicked:", event)}
                />
              </CardContent>
            </Card>

            {/* Performance Analytics Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Overview
                    </CardTitle>
                    <CardDescription>
                      Your practice metrics for this {selectedTimeframe}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value as "week" | "month" | "quarter")}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {mockStats.completedThisMonth}
                    </div>
                    <p className="text-sm text-muted-foreground">Cases Completed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {mockStats.hoursWorked}
                    </div>
                    <p className="text-sm text-muted-foreground">Hours Worked</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      96%
                    </div>
                    <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Calendar & Quick Actions */}
          <div className="space-y-8">
            {/* Calendar Widget */}
            <CalendarWidget
              events={mockCalendarEvents}
              view="month"
              onDateSelect={(date) => console.log("Date selected:", date)}
              onEventClick={(event) => console.log("Event clicked:", event)}
              onAddEvent={(date) => console.log("Add event for:", date)}
            />

            {/* Upcoming Events */}
            <UpcomingEvents
              events={mockCalendarEvents}
              limit={5}
              onEventClick={(event) => console.log("Event clicked:", event)}
            />

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
                  <Scale className="mr-2 h-4 w-4" />
                  Create New Case
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Log Time Entry
                </Button>
              </CardContent>
            </Card>

            {/* Alerts & Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Filing Deadline Tomorrow</p>
                    <p className="text-xs text-muted-foreground">
                      Motion due in Johnson v. State Insurance
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Time Entry Reminder</p>
                    <p className="text-xs text-muted-foreground">
                      Log hours for yesterday's work
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Document Review Ready</p>
                    <p className="text-xs text-muted-foreground">
                      3 documents awaiting your review
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}