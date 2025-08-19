"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MetricCard } from '@/components/admin/MetricCard';
import {
  HeadphonesIcon,
  MessageCircle,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  FileText,
  Eye,
  Download,
  RefreshCw,
  UserCheck,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

// Mock support ticket data
interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
  user: {
    name: string;
    email: string;
    organization: string;
    role: string;
  };
  assignee?: {
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    content: string;
    author: string;
    isStaff: boolean;
    timestamp: Date;
  }[];
}

const generateMockTickets = (): SupportTicket[] => {
  const statuses = ['open', 'in_progress', 'resolved', 'closed'] as const;
  const priorities = ['low', 'medium', 'high', 'urgent'] as const;
  const categories = ['technical', 'billing', 'feature_request', 'bug_report', 'general'] as const;

  return Array.from({ length: 15 }, (_, i) => ({
    id: `ticket-${i + 1}`,
    subject: [
      'Unable to upload documents',
      'Billing inquiry about subscription',
      'Feature request: Dark mode',
      'Bug: Timeline not generating',
      'Access issues with mobile app',
      'Integration with third-party tools',
      'Performance issues during peak hours',
      'Question about user permissions',
      'Data export functionality',
      'Calendar sync not working',
      'Password reset not working',
      'Missing invoices in account',
      'API rate limiting concerns',
      'Training request for new features',
      'Account security concerns'
    ][i],
    description: 'Detailed description of the issue...',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    user: {
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      organization: `Law Firm ${i + 1}`,
      role: ['Lawyer', 'Admin', 'Paralegal'][Math.floor(Math.random() * 3)]
    },
    assignee: Math.random() > 0.3 ? {
      name: `Support Agent ${Math.floor(Math.random() * 3) + 1}`,
      email: `agent${Math.floor(Math.random() * 3) + 1}@lexchronos.com`
    } : undefined,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    messages: [
      {
        id: 'msg-1',
        content: 'Initial message describing the issue...',
        author: `User ${i + 1}`,
        isStaff: false,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    ]
  }));
};

// Mock system logs
interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const generateMockLogs = (): SystemLog[] => {
  const levels = ['info', 'warn', 'error', 'debug'] as const;
  const services = ['auth', 'api', 'database', 'email', 'file-storage', 'payment'];
  const messages = [
    'User login successful',
    'Database connection established',
    'API rate limit exceeded',
    'Email delivery failed',
    'File upload completed',
    'Payment processing started',
    'Cache invalidated',
    'Backup completed successfully',
    'SSL certificate renewal',
    'Memory usage high',
    'Database query slow',
    'User session expired'
  ];

  return Array.from({ length: 100 }, (_, i) => ({
    id: `log-${i + 1}`,
    level: levels[Math.floor(Math.random() * levels.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    service: services[Math.floor(Math.random() * services.length)],
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    metadata: {
      userId: Math.random() > 0.5 ? `user-${Math.floor(Math.random() * 100)}` : undefined,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (compatible)'
    }
  }));
};

export default function SupportTools() {
  const [tickets, setTickets] = useState<SupportTicket[]>(generateMockTickets());
  const [logs, setLogs] = useState<SystemLog[]>(generateMockLogs());
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [logLevelFilter, setLogLevelFilter] = useState('all');

  // Calculate support metrics
  const supportMetrics = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
    avgResponseTime: 4.2, // hours
    satisfaction: 94.5 // percentage
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchTerm === '' || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user.organization.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
    return matchesLevel;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLogLevelColor = (level: string): string => {
    switch (level) {
      case 'error':
        return 'text-red-600';
      case 'warn':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'debug':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleTicketUpdate = (ticketId: string, updates: Partial<SupportTicket>) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId ? { ...ticket, ...updates, updatedAt: new Date() } : ticket
    ));
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLogs(generateMockLogs());
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tools</h1>
          <p className="text-muted-foreground">
            Manage support tickets, system logs, and user assistance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <MessageCircle className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Support Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Open Tickets"
          value={supportMetrics.open}
          format="number"
          icon={HeadphonesIcon}
          description={`${supportMetrics.urgent} urgent priority`}
        />
        <MetricCard
          title="In Progress"
          value={supportMetrics.inProgress}
          format="number"
          icon={Clock}
          description="Currently being handled"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${supportMetrics.avgResponseTime}h`}
          icon={Clock}
          description="First response time"
        />
        <MetricCard
          title="Satisfaction Rate"
          value={supportMetrics.satisfaction}
          format="percentage"
          icon={CheckCircle}
          description="Customer satisfaction"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets ({filteredTickets.length})</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="user-lookup">User Lookup</TabsTrigger>
        </TabsList>

        {/* Support Tickets */}
        <TabsContent value="tickets" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>
                Manage and respond to customer support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{ticket.subject}</h4>
                        <Badge variant="outline" className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{ticket.user.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{ticket.user.email}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{ticket.createdAt.toLocaleDateString()}</span>
                        </span>
                        {ticket.assignee && (
                          <span className="flex items-center space-x-1">
                            <UserCheck className="h-3 w-3" />
                            <span>Assigned to {ticket.assignee.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
                            <DialogDescription>
                              Ticket #{selectedTicket?.id} • Created {selectedTicket?.createdAt.toLocaleDateString()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                  value={selectedTicket?.status}
                                  onValueChange={(value) => 
                                    selectedTicket && handleTicketUpdate(selectedTicket.id, { status: value as any })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Priority</label>
                                <Select
                                  value={selectedTicket?.priority}
                                  onValueChange={(value) => 
                                    selectedTicket && handleTicketUpdate(selectedTicket.id, { priority: value as any })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Customer</label>
                              <div className="mt-1 p-3 bg-muted rounded-md">
                                <div className="text-sm">
                                  <div><strong>{selectedTicket?.user.name}</strong></div>
                                  <div>{selectedTicket?.user.email}</div>
                                  <div>{selectedTicket?.user.organization}</div>
                                  <div>Role: {selectedTicket?.user.role}</div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Messages</label>
                              <ScrollArea className="h-60 mt-1 border rounded-md p-3">
                                <div className="space-y-3">
                                  {selectedTicket?.messages.map((message) => (
                                    <div
                                      key={message.id}
                                      className={`p-3 rounded-md ${
                                        message.isStaff ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                        <span>{message.author}</span>
                                        <span>{message.timestamp.toLocaleString()}</span>
                                      </div>
                                      <div className="text-sm">{message.content}</div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>
                    Real-time system logs and error monitoring
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-1 font-mono text-sm">
                  {filteredLogs.slice(0, 50).map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 py-1">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span className={`uppercase text-xs w-12 shrink-0 ${getLogLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                      <span className="text-xs text-muted-foreground w-20 shrink-0">
                        {log.service}
                      </span>
                      <span className="text-xs flex-1">
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Lookup */}
        <TabsContent value="user-lookup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Lookup & Impersonation</CardTitle>
              <CardDescription>
                Search for users and access their accounts for support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Search by email, name, or organization..."
                    className="flex-1"
                  />
                  <Button>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="text-center text-muted-foreground">
                    Enter search criteria to find users
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}