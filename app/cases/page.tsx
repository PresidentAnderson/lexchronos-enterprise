"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CaseCard, CaseListItem, type Case } from "@/components/case-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Scale,
  Search,
  Filter,
  Plus,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// Mock user data
const mockUser = {
  name: "Sarah Johnson",
  email: "sarah.johnson@lawfirm.com",
  role: "lawyer" as const,
  avatar: "",
};

// Expanded mock cases data
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
  {
    id: "4",
    title: "Employment Discrimination Case",
    caseNumber: "ED-2024-012",
    client: {
      name: "Jennifer Martinez",
      email: "jmartinez@email.com",
      phone: "(555) 234-5678",
    },
    description: "Workplace discrimination and wrongful termination case. Client alleges gender-based discrimination and hostile work environment.",
    status: "active",
    priority: "high",
    practice_area: "Employment Law",
    assignedLawyer: "Sarah Johnson",
    createdDate: "2024-03-20T00:00:00Z",
    lastUpdated: "2024-08-15T00:00:00Z",
    nextDeadline: {
      date: "2024-09-10T14:00:00Z",
      title: "Mediation session",
      type: "meeting",
    },
    billingInfo: {
      hourlyRate: 375,
      totalBilled: 18750,
      hoursWorked: 50.0,
    },
    documents: 34,
    opposingCounsel: "Corporate Defense LLC",
  },
  {
    id: "5",
    title: "Real Estate Transaction - Sunset Plaza",
    caseNumber: "RE-2024-089",
    client: {
      name: "Sunset Plaza Development",
      email: "legal@sunsetplaza.com",
      phone: "(555) 345-6789",
    },
    description: "Commercial real estate transaction for mixed-use development project. Handling zoning, financing, and construction contracts.",
    status: "completed",
    priority: "medium",
    practice_area: "Real Estate Law",
    assignedLawyer: "Sarah Johnson",
    createdDate: "2024-05-15T00:00:00Z",
    lastUpdated: "2024-08-10T00:00:00Z",
    billingInfo: {
      hourlyRate: 400,
      totalBilled: 32000,
      hoursWorked: 80.0,
    },
    documents: 145,
  },
  {
    id: "6",
    title: "Patent Application - AI Technology",
    caseNumber: "IP-2024-056",
    client: {
      name: "Innovation Labs Inc.",
      email: "ip@innovationlabs.com",
      phone: "(555) 456-7890",
    },
    description: "Patent application for novel AI algorithm in healthcare diagnostics. Includes prior art research and claim drafting.",
    status: "on-hold",
    priority: "low",
    practice_area: "Intellectual Property",
    assignedLawyer: "Sarah Johnson",
    createdDate: "2024-04-08T00:00:00Z",
    lastUpdated: "2024-08-05T00:00:00Z",
    nextDeadline: {
      date: "2024-09-15T17:00:00Z",
      title: "Patent office response due",
      type: "deadline",
    },
    billingInfo: {
      hourlyRate: 425,
      totalBilled: 8500,
      hoursWorked: 20.0,
    },
    documents: 28,
  },
];

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  const [practiceAreaFilter, setPracticeAreaFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"name" | "date" | "priority" | "status">("name");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const filteredCases = React.useMemo(() => {
    let filtered = mockCases.filter(caseItem => {
      const matchesSearch = searchTerm === "" || 
        caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.practice_area.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || caseItem.priority === priorityFilter;
      const matchesPracticeArea = practiceAreaFilter === "all" || caseItem.practice_area === practiceAreaFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesPracticeArea;
    });

    // Sort cases
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "date":
          aValue = new Date(a.lastUpdated).getTime();
          bValue = new Date(b.lastUpdated).getTime();
          break;
        case "priority":
          const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [mockCases, searchTerm, statusFilter, priorityFilter, practiceAreaFilter, sortBy, sortOrder]);

  const handleCaseClick = (caseItem: Case) => {
    console.log("Navigate to case:", caseItem.id);
    // In a real app, this would navigate to the case detail page
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Get unique practice areas for filter
  const practiceAreas = React.useMemo(() => {
    return Array.from(new Set(mockCases.map(c => c.practice_area))).sort();
  }, [mockCases]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={mockUser} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Scale className="h-8 w-8 text-primary" />
                Cases
              </h1>
              <p className="text-muted-foreground">
                Manage and track all your legal cases
              </p>
            </div>
            <Button asChild>
              <Link href="/cases/new">
                <Plus className="mr-2 h-4 w-4" />
                New Case
              </Link>
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Scale className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Cases</p>
                    <p className="text-xl font-bold">
                      {mockCases.filter(c => c.status === "active").length}
                    </p>
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
                    <p className="text-xl font-bold">
                      {mockCases.filter(c => c.priority === "high").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold">
                      {mockCases.filter(c => c.status === "pending").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold">
                      {mockCases.filter(c => c.status === "completed").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases, clients, or case numbers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Status: {statusFilter === "all" ? "All" : statusFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("on-hold")}>
                      On Hold
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Priority: {priorityFilter === "all" ? "All" : priorityFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setPriorityFilter("all")}>
                      All Priorities
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
                      High
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>
                      Medium
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
                      Low
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Area: {practiceAreaFilter === "all" ? "All" : practiceAreaFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setPracticeAreaFilter("all")}>
                      All Practice Areas
                    </DropdownMenuItem>
                    {practiceAreas.map((area) => (
                      <DropdownMenuItem 
                        key={area} 
                        onClick={() => setPracticeAreaFilter(area)}
                      >
                        {area}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Sort: {sortBy}
                      {sortOrder === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => toggleSort("name")}>
                      Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort("date")}>
                      Last Updated
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort("priority")}>
                      Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort("status")}>
                      Status
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Display */}
        {filteredCases.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  case={caseItem}
                  onCaseClick={handleCaseClick}
                  onEditCase={(c) => console.log("Edit case:", c.id)}
                  onArchiveCase={(c) => console.log("Archive case:", c.id)}
                  onDeleteCase={(c) => console.log("Delete case:", c.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                {filteredCases.map((caseItem) => (
                  <CaseListItem
                    key={caseItem.id}
                    case={caseItem}
                    onCaseClick={handleCaseClick}
                  />
                ))}
              </CardContent>
            </Card>
          )
        ) : (
          <div className="text-center py-12">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No cases found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filter criteria.
            </p>
            <Button asChild>
              <Link href="/cases/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Case
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}