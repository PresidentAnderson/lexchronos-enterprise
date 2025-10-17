"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { DocumentViewer, type Document } from "@/components/document-viewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Folder, HardDrive, Cloud, Star, Clock } from "lucide-react";
import Link from "next/link";

// Mock user data
const mockUser = {
  name: "Sarah Johnson",
  email: "sarah.johnson@lawfirm.com",
  role: "lawyer" as const,
  avatar: "",
};

// Comprehensive mock documents data
const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Motion for Summary Judgment.pdf",
    type: "pdf",
    size: 2457600, // 2.4 MB
    uploadDate: "2024-08-18T10:30:00Z",
    lastModified: "2024-08-18T10:30:00Z",
    category: "pleading",
    tags: ["motion", "summary judgment", "insurance"],
    caseId: "1",
    caseName: "Johnson v. State Insurance Co.",
    uploadedBy: "Sarah Johnson",
    version: 1,
    isStarred: true,
    url: "/api/documents/1/download",
    description: "Motion for summary judgment filed in Johnson v. State Insurance Co. case",
  },
  {
    id: "2",
    name: "Supporting Evidence Package.pdf",
    type: "pdf",
    size: 15728640, // 15 MB
    uploadDate: "2024-08-18T10:25:00Z",
    lastModified: "2024-08-18T10:25:00Z",
    category: "evidence",
    tags: ["evidence", "exhibits", "photos", "reports"],
    caseId: "1",
    caseName: "Johnson v. State Insurance Co.",
    uploadedBy: "Sarah Johnson",
    version: 1,
    isStarred: true,
    url: "/api/documents/2/download",
    description: "Comprehensive evidence package including photos, expert reports, and witness statements",
  },
  {
    id: "3",
    name: "Estate Planning Checklist.pdf",
    type: "pdf",
    size: 524288, // 512 KB
    uploadDate: "2024-08-17T14:00:00Z",
    lastModified: "2024-08-17T16:30:00Z",
    category: "other",
    tags: ["estate planning", "checklist", "trust"],
    caseId: "2",
    caseName: "Estate Planning - Williams Family Trust",
    uploadedBy: "Sarah Johnson",
    version: 2,
    isStarred: false,
    url: "/api/documents/3/download",
    description: "Comprehensive checklist for estate planning process",
  },
  {
    id: "4",
    name: "Williams Family Trust Agreement - DRAFT.docx",
    type: "docx",
    size: 1048576, // 1 MB
    uploadDate: "2024-08-17T11:00:00Z",
    lastModified: "2024-08-17T16:45:00Z",
    category: "contract",
    tags: ["trust agreement", "draft", "estate planning"],
    caseId: "2",
    caseName: "Estate Planning - Williams Family Trust",
    uploadedBy: "Sarah Johnson",
    version: 3,
    isStarred: false,
    url: "/api/documents/4/download",
    description: "Draft trust agreement for Williams family estate planning",
  },
  {
    id: "5",
    name: "TechCorp Financial Statements Q1-Q3 2024.xlsx",
    type: "spreadsheet",
    size: 3145728, // 3 MB
    uploadDate: "2024-08-16T09:15:00Z",
    lastModified: "2024-08-16T09:15:00Z",
    category: "evidence",
    tags: ["financial", "statements", "merger", "due diligence"],
    caseId: "3",
    caseName: "Corporate Merger - TechCorp Acquisition",
    uploadedBy: "Morrison & Associates",
    version: 1,
    isStarred: true,
    url: "/api/documents/5/download",
    description: "Quarterly financial statements for due diligence review",
  },
  {
    id: "6",
    name: "Due Diligence Report - TechCorp.pdf",
    type: "pdf",
    size: 8388608, // 8 MB
    uploadDate: "2024-08-16T09:10:00Z",
    lastModified: "2024-08-16T09:10:00Z",
    category: "research",
    tags: ["due diligence", "merger", "analysis", "corporate"],
    caseId: "3",
    caseName: "Corporate Merger - TechCorp Acquisition",
    uploadedBy: "External Auditor",
    version: 1,
    isStarred: true,
    url: "/api/documents/6/download",
    description: "Comprehensive due diligence report for TechCorp acquisition",
  },
  {
    id: "7",
    name: "Employment Contract - Martinez.pdf",
    type: "pdf",
    size: 786432, // 768 KB
    uploadDate: "2024-08-15T14:30:00Z",
    lastModified: "2024-08-15T14:30:00Z",
    category: "contract",
    tags: ["employment", "contract", "discrimination case"],
    caseId: "4",
    caseName: "Employment Discrimination Case",
    uploadedBy: "Jennifer Martinez",
    version: 1,
    isStarred: false,
    url: "/api/documents/7/download",
    description: "Original employment contract for reference in discrimination case",
  },
  {
    id: "8",
    name: "HR Records - Performance Reviews.pdf",
    type: "pdf",
    size: 2097152, // 2 MB
    uploadDate: "2024-08-15T14:25:00Z",
    lastModified: "2024-08-15T14:25:00Z",
    category: "evidence",
    tags: ["HR records", "performance", "employment", "evidence"],
    caseId: "4",
    caseName: "Employment Discrimination Case",
    uploadedBy: "Corporate Defense LLC",
    version: 1,
    isStarred: false,
    url: "/api/documents/8/download",
    description: "Employee performance review records from HR department",
  },
  {
    id: "9",
    name: "Email Communications Thread.pdf",
    type: "pdf",
    size: 1572864, // 1.5 MB
    uploadDate: "2024-08-15T10:00:00Z",
    lastModified: "2024-08-15T10:00:00Z",
    category: "correspondence",
    tags: ["emails", "communications", "evidence", "discrimination"],
    caseId: "4",
    caseName: "Employment Discrimination Case",
    uploadedBy: "Sarah Johnson",
    version: 1,
    isStarred: true,
    url: "/api/documents/9/download",
    description: "Compilation of relevant email communications for case evidence",
  },
  {
    id: "10",
    name: "Patent Application - AI Algorithm.pdf",
    type: "pdf",
    size: 4194304, // 4 MB
    uploadDate: "2024-08-14T16:45:00Z",
    lastModified: "2024-08-14T16:45:00Z",
    category: "pleading",
    tags: ["patent", "application", "AI", "healthcare"],
    caseId: "6",
    caseName: "Patent Application - AI Technology",
    uploadedBy: "Sarah Johnson",
    version: 1,
    isStarred: true,
    url: "/api/documents/10/download",
    description: "Formal patent application for AI healthcare diagnostic algorithm",
  },
  {
    id: "11",
    name: "Technical Specifications.pdf",
    type: "pdf",
    size: 6291456, // 6 MB
    uploadDate: "2024-08-14T15:30:00Z",
    lastModified: "2024-08-14T16:00:00Z",
    category: "research",
    tags: ["technical", "specifications", "AI", "algorithm"],
    caseId: "6",
    caseName: "Patent Application - AI Technology",
    uploadedBy: "Dr. Michael Chen",
    version: 2,
    isStarred: false,
    url: "/api/documents/11/download",
    description: "Detailed technical specifications for AI algorithm patent",
  },
  {
    id: "12",
    name: "Prior Art Analysis.pdf",
    type: "pdf",
    size: 3670016, // 3.5 MB
    uploadDate: "2024-08-14T14:00:00Z",
    lastModified: "2024-08-14T14:00:00Z",
    category: "research",
    tags: ["prior art", "research", "patent", "analysis"],
    caseId: "6",
    caseName: "Patent Application - AI Technology",
    uploadedBy: "Patent Research Firm",
    version: 1,
    isStarred: false,
    url: "/api/documents/12/download",
    description: "Comprehensive prior art analysis for patent application",
  },
  {
    id: "13",
    name: "Settlement Agreement - Sunset Plaza.pdf",
    type: "pdf",
    size: 1310720, // 1.25 MB
    uploadDate: "2024-08-12T15:30:00Z",
    lastModified: "2024-08-12T15:30:00Z",
    category: "contract",
    tags: ["settlement", "real estate", "closing", "agreement"],
    caseId: "5",
    caseName: "Real Estate Transaction - Sunset Plaza",
    uploadedBy: "Sarah Johnson",
    version: 1,
    isStarred: true,
    url: "/api/documents/13/download",
    description: "Final settlement agreement for Sunset Plaza real estate transaction",
  },
  {
    id: "14",
    name: "Title Insurance Policy.pdf",
    type: "pdf",
    size: 2621440, // 2.5 MB
    uploadDate: "2024-08-12T15:25:00Z",
    lastModified: "2024-08-12T15:25:00Z",
    category: "other",
    tags: ["title insurance", "real estate", "policy", "protection"],
    caseId: "5",
    caseName: "Real Estate Transaction - Sunset Plaza",
    uploadedBy: "Title Company",
    version: 1,
    isStarred: false,
    url: "/api/documents/14/download",
    description: "Title insurance policy for real estate transaction",
  },
  {
    id: "15",
    name: "Zoning Permits and Approvals.pdf",
    type: "pdf",
    size: 5242880, // 5 MB
    uploadDate: "2024-08-10T10:00:00Z",
    lastModified: "2024-08-10T10:00:00Z",
    category: "other",
    tags: ["zoning", "permits", "approvals", "real estate", "municipal"],
    caseId: "5",
    caseName: "Real Estate Transaction - Sunset Plaza",
    uploadedBy: "City Planning Department",
    version: 1,
    isStarred: false,
    url: "/api/documents/15/download",
    description: "Zoning permits and municipal approvals for development project",
  },
];

export default function DocumentsPage() {
  const handleDocumentClick = (document: Document) => {
    console.log("Document clicked:", document);
    // In a real app, this might open the document viewer or download the file
  };

  const handleDocumentUpload = (files: FileList) => {
    console.log("Files to upload:", Array.from(files));
    // In a real app, this would handle the file upload process
  };

  // Calculate storage stats
  const totalSize = mockDocuments.reduce((acc, doc) => acc + doc.size, 0);
  const totalDocuments = mockDocuments.length;
  const starredDocuments = mockDocuments.filter(doc => doc.isStarred).length;
  const recentDocuments = mockDocuments.filter(doc => {
    const daysDiff = Math.floor((Date.now() - new Date(doc.uploadDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  }).length;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={mockUser} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                Documents
              </h1>
              <p className="text-muted-foreground">
                Manage and organize all your legal documents
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/documents/organize">
                  <Folder className="mr-2 h-4 w-4" />
                  Organize
                </Link>
              </Button>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
            </div>
          </div>

          {/* Document Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Documents</p>
                    <p className="text-xl font-bold">{totalDocuments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <HardDrive className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Storage Used</p>
                    <p className="text-xl font-bold">{formatBytes(totalSize)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Starred</p>
                    <p className="text-xl font-bold">{starredDocuments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Cloud className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recent</p>
                    <p className="text-xl font-bold">{recentDocuments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Starred Documents
              </CardTitle>
              <CardDescription>
                Your most important documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{starredDocuments}</p>
              <p className="text-sm text-muted-foreground">Quick access items</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Recent Uploads
              </CardTitle>
              <CardDescription>
                Documents from the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{recentDocuments}</p>
              <p className="text-sm text-muted-foreground">Recently added</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-green-500" />
                Categories
              </CardTitle>
              <CardDescription>
                Organized by document type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {new Set(mockDocuments.map(d => d.category)).size}
              </p>
              <p className="text-sm text-muted-foreground">Different categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Document Viewer Component */}
        <DocumentViewer
          documents={mockDocuments}
          onDocumentClick={handleDocumentClick}
          onDocumentUpload={handleDocumentUpload}
          showUpload={true}
        />
      </main>
    </div>
  );
}