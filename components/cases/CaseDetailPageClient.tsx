'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calendar, 
  Users, 
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Brain,
  Scale,
  Eye,
  Edit,
  Share,
  Download,
  Plus,
  BarChart3,
  MessageSquare,
  Bell,
  Settings
} from 'lucide-react';
import { TimelineGenerator } from '@/components/ai/TimelineGenerator';
import { DocumentIntelligence } from '@/components/ai/DocumentIntelligence';
import { CaseOverview } from '@/components/cases/CaseOverview';
import { CaseDocuments } from '@/components/cases/CaseDocuments';
import { CaseTimeline } from '@/components/cases/CaseTimeline';
import { CaseContacts } from '@/components/cases/CaseContacts';
import { CaseBilling } from '@/components/cases/CaseBilling';
import { CaseNotes } from '@/components/cases/CaseNotes';
import { CaseDeadlines } from '@/components/cases/CaseDeadlines';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface CaseDetails {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  caseType: string;
  jurisdiction: string;
  courtName?: string;
  judgeAssigned?: string;
  openedDate: string;
  closedDate?: string;
  statuteOfLimitations?: string;
  estimatedValue?: number;
  actualValue?: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  assignedAttorney?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  documents: Array<{
    id: string;
    title: string;
    type: string;
    confidentialityLevel: string;
    createdAt: string;
  }>;
  timeline: Array<{
    id: string;
    title: string;
    description: string;
    eventDate: string;
    eventType: string;
    importance: string;
  }>;
  deadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
    priority: string;
  }>;
  billingEntries: Array<{
    id: string;
    description: string;
    hours: number;
    amount: number;
    date: string;
  }>;
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
  }>;
  tags: string[];
  metadata: any;
}

const DEMO_CASE: CaseDetails = {
  id: 'demo-case',
  caseNumber: '2024-LEX-001',
  title: 'LexChronos v. Demo',
  description:
    'Demonstration matter showcasing LexChronos workflows without requiring live infrastructure.',
  status: 'ACTIVE',
  priority: 'HIGH',
  caseType: 'CIVIL_LITIGATION',
  jurisdiction: 'Demo County, Demo State',
  courtName: 'Demo Superior Court',
  judgeAssigned: 'Hon. Justice Example',
  openedDate: new Date().toISOString(),
  statuteOfLimitations: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
  estimatedValue: 1250000,
  actualValue: 0,
  client: {
    id: 'client-demo',
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 010-2000'
  },
  assignedAttorney: {
    id: 'lawyer-demo',
    firstName: 'Riley',
    lastName: 'Chen',
    email: 'riley.chen@example.com'
  },
  documents: [
    {
      id: 'doc-demo-1',
      title: 'Complaint Draft',
      type: 'PLEADING',
      confidentialityLevel: 'CONFIDENTIAL',
      createdAt: new Date().toISOString()
    },
    {
      id: 'doc-demo-2',
      title: 'Evidence Summary',
      type: 'EVIDENCE',
      confidentialityLevel: 'PUBLIC',
      createdAt: new Date().toISOString()
    }
  ],
  timeline: [
    {
      id: 'timeline-demo-1',
      title: 'Case Intake Completed',
      description: 'Collected initial facts and client documentation.',
      eventDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      eventType: 'INTAKE',
      importance: 'HIGH'
    },
    {
      id: 'timeline-demo-2',
      title: 'Complaint Filed',
      description: 'Complaint submitted via e-filing portal.',
      eventDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      eventType: 'FILING',
      importance: 'MEDIUM'
    }
  ],
  deadlines: [
    {
      id: 'deadline-demo-1',
      title: 'Serve Complaint',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      status: 'DUE_SOON',
      priority: 'HIGH'
    },
    {
      id: 'deadline-demo-2',
      title: 'Prepare Discovery Plan',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
      status: 'UPCOMING',
      priority: 'MEDIUM'
    }
  ],
  billingEntries: [
    {
      id: 'bill-demo-1',
      description: 'Strategy Session',
      hours: 1.5,
      amount: 525,
      date: new Date().toISOString()
    },
    {
      id: 'bill-demo-2',
      description: 'Draft Complaint',
      hours: 3.25,
      amount: 1137.5,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
    }
  ],
  contacts: [
    {
      id: 'contact-demo-1',
      firstName: 'Morgan',
      lastName: 'Lee',
      role: 'Paralegal',
      email: 'morgan.lee@example.com'
    },
    {
      id: 'contact-demo-2',
      firstName: 'Jamie',
      lastName: 'Patel',
      role: 'Expert Witness',
      email: 'jamie.patel@example.com'
    }
  ],
  tags: ['high-value', 'demo', 'civil'],
  metadata: {
    lastUpdatedBy: 'System Demo Bot',
    riskLevel: 'Moderate'
  }
};

interface CaseDetailPageClientProps {
  caseId: string;
}

export default function CaseDetailPageClient({ caseId }: CaseDetailPageClientProps) {
  const { user, organization } = useAuth();
  const { toast } = useToast();

  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (caseId && organization?.id) {
      loadCaseDetails(caseId, organization.id);
    }
  }, [caseId, organization?.id]);

  const loadCaseDetails = async (currentCaseId: string, organizationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cases/${currentCaseId}?organizationId=${organizationId}`);
      const data = await response.json();

      if (data.success) {
        setCaseDetails(data.data.case);
      } else if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.DISABLE_DATABASE === 'true') {
        setCaseDetails(DEMO_CASE);
      } else {
        toast.error('Failed to load case details');
      }
    } catch (error) {
      console.error('Failed to load case:', error);
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.DISABLE_DATABASE === 'true') {
        setCaseDetails(DEMO_CASE);
      } else {
        toast.error('Error loading case details');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!caseId) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!caseDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Case Not Found</h1>
          <p className="text-gray-600">The requested case could not be found or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{caseDetails.caseNumber}</h1>
            <Badge className={getStatusColor(caseDetails.status)}>
              {caseDetails.status}
            </Badge>
            <Badge className={getPriorityColor(caseDetails.priority)}>
              {caseDetails.priority} Priority
            </Badge>
          </div>
          <h2 className="text-xl text-gray-700 mb-2">{caseDetails.title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Client: {caseDetails.client.firstName} {caseDetails.client.lastName}</span>
            </div>
            {caseDetails.assignedAttorney && (
              <div className="flex items-center gap-1">
                <Scale className="h-4 w-4" />
                <span>Attorney: {caseDetails.assignedAttorney.firstName} {caseDetails.assignedAttorney.lastName}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Opened: {new Date(caseDetails.openedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditMode(!editMode)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Case
          </Button>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{caseDetails.documents.length}</div>
            <div className="text-sm text-gray-600">Documents</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{caseDetails.timeline.length}</div>
            <div className="text-sm text-gray-600">Timeline Events</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{caseDetails.deadlines.length}</div>
            <div className="text-sm text-gray-600">Deadlines</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              ${caseDetails.billingEntries.reduce((sum, entry) => sum + entry.amount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Billed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{caseDetails.contacts.length}</div>
            <div className="text-sm text-gray-600">Contacts</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {caseDetails.deadlines.filter(d => d.status === 'overdue').length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="ai">AI Analysis</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CaseOverview 
            caseDetails={caseDetails}
            onUpdate={loadCaseDetails}
            editMode={editMode}
            onEditModeChange={setEditMode}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <div className="space-y-6">
            <CaseTimeline 
              caseId={caseDetails.id}
              timeline={caseDetails.timeline}
              onUpdate={loadCaseDetails}
            />
            
            {/* AI Timeline Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Timeline Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimelineGenerator
                  caseId={caseDetails.id}
                  organizationId={organization?.id || ''}
                  evidence={caseDetails.documents.map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    dateObtained: doc.createdAt,
                    type: doc.type
                  }))}
                  onTimelineGenerated={() => loadCaseDetails()}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <CaseDocuments 
            caseId={caseDetails.id}
            documents={caseDetails.documents}
            onUpdate={loadCaseDetails}
          />
        </TabsContent>

        <TabsContent value="deadlines" className="mt-6">
          <CaseDeadlines 
            caseId={caseDetails.id}
            deadlines={caseDetails.deadlines}
            onUpdate={loadCaseDetails}
          />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <CaseBilling 
            caseId={caseDetails.id}
            billingEntries={caseDetails.billingEntries}
            estimatedValue={caseDetails.estimatedValue}
            actualValue={caseDetails.actualValue}
            onUpdate={loadCaseDetails}
          />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <CaseContacts 
            caseId={caseDetails.id}
            contacts={caseDetails.contacts}
            client={caseDetails.client}
            assignedAttorney={caseDetails.assignedAttorney}
            onUpdate={loadCaseDetails}
          />
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <div className="space-y-6">
            {/* Document Intelligence */}
            <DocumentIntelligence
              caseId={caseDetails.id}
              organizationId={organization?.id || ''}
              documents={caseDetails.documents}
            />
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <CaseNotes 
            caseId={caseDetails.id}
            onUpdate={loadCaseDetails}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}