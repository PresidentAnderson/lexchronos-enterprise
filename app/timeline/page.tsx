"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Timeline, type TimelineEvent } from "@/components/timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Calendar, Filter, Download, Scale } from "lucide-react";
import Link from "next/link";

// Mock user data
const mockUser = {
  name: "Sarah Johnson",
  email: "sarah.johnson@lawfirm.com",
  role: "lawyer" as const,
  avatar: "",
};

// Comprehensive mock timeline events
const mockTimelineEvents: TimelineEvent[] = [
  {
    id: "1",
    title: "Motion for Summary Judgment Filed",
    description: "Filed motion for summary judgment in Johnson v. State Insurance Co. case. Motion argues that there are no genuine issues of material fact and judgment should be rendered as a matter of law in favor of plaintiff.",
    date: "2024-08-18T10:30:00Z",
    type: "filing",
    status: "completed",
    priority: "high",
    participants: ["Sarah Johnson", "Michael Johnson"],
    location: "Superior Court of California",
    caseId: "1",
    caseName: "Johnson v. State Insurance Co.",
    documents: [
      { id: "d1", name: "Motion for Summary Judgment.pdf", type: "PDF" },
      { id: "d2", name: "Supporting Evidence.pdf", type: "PDF" },
      { id: "d3", name: "Legal Brief.pdf", type: "PDF" },
    ],
  },
  {
    id: "2",
    title: "Client Consultation - Estate Planning",
    description: "Initial consultation with Williams family regarding comprehensive estate planning needs. Discussed trust structures, tax implications, and succession planning for family business.",
    date: "2024-08-17T14:00:00Z",
    type: "meeting",
    status: "completed",
    priority: "medium",
    participants: ["Sarah Johnson", "Robert Williams", "Mary Williams"],
    location: "Law Office Conference Room A",
    caseId: "2",
    caseName: "Estate Planning - Williams Family Trust",
    documents: [
      { id: "d4", name: "Estate Planning Checklist.pdf", type: "PDF" },
      { id: "d5", name: "Tax Planning Summary.docx", type: "DOC" },
    ],
  },
  {
    id: "3",
    title: "Discovery Documents Received",
    description: "Received extensive discovery materials from opposing counsel in the corporate merger case. Documents include financial statements, board meeting minutes, and due diligence reports spanning three years.",
    date: "2024-08-16T09:15:00Z",
    type: "communication",
    status: "completed",
    priority: "high",
    participants: ["Sarah Johnson", "Morrison & Associates"],
    caseId: "3",
    caseName: "Corporate Merger - TechCorp Acquisition",
    documents: [
      { id: "d6", name: "Financial Statements Q1-Q3 2024.xlsx", type: "XLS" },
      { id: "d7", name: "Board Meeting Minutes.pdf", type: "PDF" },
      { id: "d8", name: "Due Diligence Report.pdf", type: "PDF" },
    ],
  },
  {
    id: "4",
    title: "Mediation Session Scheduled",
    description: "Mediation session scheduled with neutral mediator for employment discrimination case. All parties have agreed to participate in good faith settlement discussions.",
    date: "2024-08-15T11:00:00Z",
    type: "meeting",
    status: "completed",
    priority: "medium",
    participants: ["Sarah Johnson", "Jennifer Martinez", "Mediator: Hon. James Wilson"],
    location: "Mediation Center Downtown",
    caseId: "4",
    caseName: "Employment Discrimination Case",
    documents: [
      { id: "d9", name: "Mediation Agreement.pdf", type: "PDF" },
    ],
  },
  {
    id: "5",
    title: "Patent Application Submitted",
    description: "Filed patent application with USPTO for AI healthcare diagnostic algorithm. Application includes detailed technical specifications, claims, and prior art analysis.",
    date: "2024-08-14T16:45:00Z",
    type: "filing",
    status: "completed",
    priority: "medium",
    participants: ["Sarah Johnson", "Dr. Michael Chen", "Innovation Labs Inc."],
    caseId: "6",
    caseName: "Patent Application - AI Technology",
    documents: [
      { id: "d10", name: "Patent Application Form.pdf", type: "PDF" },
      { id: "d11", name: "Technical Specifications.pdf", type: "PDF" },
      { id: "d12", name: "Prior Art Analysis.pdf", type: "PDF" },
    ],
  },
  {
    id: "6",
    title: "Real Estate Closing Completed",
    description: "Successfully completed closing for Sunset Plaza Development mixed-use project. All documents executed, funds transferred, and deed recorded with county recorder.",
    date: "2024-08-12T15:30:00Z",
    type: "deadline",
    status: "completed",
    priority: "high",
    participants: ["Sarah Johnson", "Sunset Plaza Development", "First National Bank", "Title Company"],
    location: "First National Bank Conference Room",
    caseId: "5",
    caseName: "Real Estate Transaction - Sunset Plaza",
    documents: [
      { id: "d13", name: "Final Settlement Statement.pdf", type: "PDF" },
      { id: "d14", name: "Deed of Trust.pdf", type: "PDF" },
      { id: "d15", name: "Title Insurance Policy.pdf", type: "PDF" },
    ],
  },
  // Future events
  {
    id: "7",
    title: "Board Approval Meeting",
    description: "TechCorp board meeting to approve the acquisition terms and authorize signature of definitive purchase agreement. Final due diligence review and voting.",
    date: "2024-08-22T10:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "high",
    participants: ["Sarah Johnson", "TechCorp Board of Directors", "Target Company Representatives"],
    location: "TechCorp Headquarters",
    caseId: "3",
    caseName: "Corporate Merger - TechCorp Acquisition",
  },
  {
    id: "8",
    title: "Motion Filing Deadline",
    description: "Deadline to file responsive motion in Johnson v. State Insurance Co. case. Opposition must respond to our summary judgment motion or risk default judgment.",
    date: "2024-08-25T17:00:00Z",
    type: "deadline",
    status: "upcoming",
    priority: "high",
    caseId: "1",
    caseName: "Johnson v. State Insurance Co.",
  },
  {
    id: "9",
    title: "Discovery Response Due",
    description: "Our response to interrogatories and document requests in corporate merger case. Comprehensive review and production of requested materials required.",
    date: "2024-08-28T17:00:00Z",
    type: "deadline",
    status: "upcoming",
    priority: "high",
    caseId: "3",
    caseName: "Corporate Merger - TechCorp Acquisition",
  },
  {
    id: "10",
    title: "Client Meeting - Trust Review",
    description: "Follow-up meeting with Williams family to review draft trust documents and discuss final estate planning recommendations.",
    date: "2024-08-30T14:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "medium",
    participants: ["Sarah Johnson", "Robert Williams", "Mary Williams"],
    location: "Law Office Conference Room A",
    caseId: "2",
    caseName: "Estate Planning - Williams Family Trust",
  },
  {
    id: "11",
    title: "Court Hearing - Summary Judgment",
    description: "Oral argument on motion for summary judgment in Johnson v. State Insurance Co. Judge will hear arguments from both sides and issue ruling.",
    date: "2024-09-05T09:00:00Z",
    type: "hearing",
    status: "upcoming",
    priority: "high",
    participants: ["Sarah Johnson", "Michael Johnson", "Opposing Counsel", "Hon. Patricia Williams"],
    location: "Superior Court of California, Department 12",
    caseId: "1",
    caseName: "Johnson v. State Insurance Co.",
  },
  {
    id: "12",
    title: "Mediation Session",
    description: "Court-ordered mediation session for employment discrimination case. Opportunity for confidential settlement discussions with neutral mediator.",
    date: "2024-09-10T10:00:00Z",
    type: "meeting",
    status: "upcoming",
    priority: "high",
    participants: ["Sarah Johnson", "Jennifer Martinez", "Opposing Counsel", "Mediator: Hon. James Wilson"],
    location: "Mediation Center Downtown",
    caseId: "4",
    caseName: "Employment Discrimination Case",
  },
  {
    id: "13",
    title: "Patent Office Response Due",
    description: "Deadline to respond to USPTO office action on AI technology patent application. Address examiner's rejections and amendments required.",
    date: "2024-09-15T17:00:00Z",
    type: "deadline",
    status: "upcoming",
    priority: "medium",
    caseId: "6",
    caseName: "Patent Application - AI Technology",
  },
];

export default function TimelinePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation user={mockUser} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                Timeline
              </h1>
              <p className="text-muted-foreground">
                Comprehensive view of all case activities and deadlines
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Timeline
              </Button>
              <Button asChild>
                <Link href="/timeline/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Link>
              </Button>
            </div>
          </div>

          {/* Timeline Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-xl font-bold">{mockTimelineEvents.length}</p>
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
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold">
                      {mockTimelineEvents.filter(e => e.status === "completed").length}
                    </p>
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
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                    <p className="text-xl font-bold">
                      {mockTimelineEvents.filter(e => e.status === "upcoming").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                    <p className="text-xl font-bold">
                      {mockTimelineEvents.filter(e => e.priority === "high").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timeline Component */}
        <Timeline
          events={mockTimelineEvents}
          showFilters={true}
          onEventClick={(event) => {
            console.log("Event clicked:", event);
            // In a real app, this might open an event detail modal or navigate to event page
          }}
        />
      </main>
    </div>
  );
}