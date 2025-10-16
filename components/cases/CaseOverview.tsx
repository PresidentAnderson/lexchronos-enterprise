'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  DollarSign,
  MapPin,
  Scale,
  Users,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  Building,
  Gavel
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
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
  tags: string[];
  metadata: any;
}

interface CaseOverviewProps {
  caseDetails: CaseDetails;
  onUpdate: () => void;
  editMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
}

const CASE_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

const CASE_PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' }
];

const CASE_TYPES = [
  { value: 'CIVIL_LITIGATION', label: 'Civil Litigation' },
  { value: 'CRIMINAL', label: 'Criminal' },
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'FAMILY', label: 'Family Law' },
  { value: 'EMPLOYMENT', label: 'Employment' },
  { value: 'INTELLECTUAL_PROPERTY', label: 'Intellectual Property' },
  { value: 'TAX', label: 'Tax' },
  { value: 'BANKRUPTCY', label: 'Bankruptcy' },
  { value: 'OTHER', label: 'Other' }
];

export function CaseOverview({ caseDetails, onUpdate, editMode, onEditModeChange }: CaseOverviewProps) {
  const { toast } = useToast();
  
  const [editedCase, setEditedCase] = useState<CaseDetails>(caseDetails);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/cases/${caseDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedCase),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Case updated successfully');
        onUpdate();
        onEditModeChange(false);
      } else {
        toast.error(data.error || 'Failed to update case');
      }
    } catch (error) {
      console.error('Failed to save case:', error);
      toast.error('Error saving case');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCase(caseDetails);
    onEditModeChange(false);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
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

  return (
    <div className="space-y-6">
      {/* Edit Controls */}
      {editMode && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Editing Case Details</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editMode ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="caseNumber">Case Number</Label>
                    <Input
                      id="caseNumber"
                      value={editedCase.caseNumber}
                      onChange={(e) => setEditedCase({ ...editedCase, caseNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="caseType">Case Type</Label>
                    <Select 
                      value={editedCase.caseType} 
                      onValueChange={(value) => setEditedCase({ ...editedCase, caseType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CASE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Case Title</Label>
                  <Input
                    id="title"
                    value={editedCase.title}
                    onChange={(e) => setEditedCase({ ...editedCase, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={editedCase.description || ''}
                    onChange={(e) => setEditedCase({ ...editedCase, description: e.target.value })}
                    placeholder="Case description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={editedCase.status} 
                      onValueChange={(value) => setEditedCase({ ...editedCase, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CASE_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={editedCase.priority} 
                      onValueChange={(value) => setEditedCase({ ...editedCase, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CASE_PRIORITIES.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Case Number</div>
                    <div className="text-gray-900">{caseDetails.caseNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Case Type</div>
                    <div className="text-gray-900">
                      {CASE_TYPES.find(t => t.value === caseDetails.caseType)?.label || caseDetails.caseType}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Title</div>
                  <div className="text-gray-900">{caseDetails.title}</div>
                </div>

                {caseDetails.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Description</div>
                    <div className="text-gray-900">{caseDetails.description}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Status</div>
                    <Badge className={getStatusColor(caseDetails.status)}>
                      {CASE_STATUSES.find(s => s.value === caseDetails.status)?.label || caseDetails.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Priority</div>
                    <Badge className={getPriorityColor(caseDetails.priority)}>
                      {CASE_PRIORITIES.find(p => p.value === caseDetails.priority)?.label || caseDetails.priority}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Court & Legal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Court & Legal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editMode ? (
              <>
                <div>
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Input
                    id="jurisdiction"
                    value={editedCase.jurisdiction}
                    onChange={(e) => setEditedCase({ ...editedCase, jurisdiction: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="courtName">Court Name</Label>
                  <Input
                    id="courtName"
                    value={editedCase.courtName || ''}
                    onChange={(e) => setEditedCase({ ...editedCase, courtName: e.target.value })}
                    placeholder="Enter court name"
                  />
                </div>

                <div>
                  <Label htmlFor="judgeAssigned">Assigned Judge</Label>
                  <Input
                    id="judgeAssigned"
                    value={editedCase.judgeAssigned || ''}
                    onChange={(e) => setEditedCase({ ...editedCase, judgeAssigned: e.target.value })}
                    placeholder="Enter judge name"
                  />
                </div>

                <div>
                  <Label htmlFor="statuteOfLimitations">Statute of Limitations</Label>
                  <Input
                    id="statuteOfLimitations"
                    type="date"
                    value={editedCase.statuteOfLimitations || ''}
                    onChange={(e) => setEditedCase({ ...editedCase, statuteOfLimitations: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-600">Jurisdiction</div>
                    <div className="text-gray-900">{caseDetails.jurisdiction}</div>
                  </div>
                </div>

                {caseDetails.courtName && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-600">Court</div>
                      <div className="text-gray-900">{caseDetails.courtName}</div>
                    </div>
                  </div>
                )}

                {caseDetails.judgeAssigned && (
                  <div className="flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-600">Assigned Judge</div>
                      <div className="text-gray-900">{caseDetails.judgeAssigned}</div>
                    </div>
                  </div>
                )}

                {caseDetails.statuteOfLimitations && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-600">Statute of Limitations</div>
                      <div className="text-gray-900">{formatDate(caseDetails.statuteOfLimitations)}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-600">Client Name</div>
                <div className="text-gray-900">
                  {caseDetails.client.firstName} {caseDetails.client.lastName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-600">Email</div>
                <div className="text-gray-900">{caseDetails.client.email}</div>
              </div>
            </div>

            {caseDetails.client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Phone</div>
                  <div className="text-gray-900">{caseDetails.client.phone}</div>
                </div>
              </div>
            )}

            {caseDetails.assignedAttorney && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-600">Assigned Attorney</div>
                    <div className="text-gray-900">
                      {caseDetails.assignedAttorney.firstName} {caseDetails.assignedAttorney.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{caseDetails.assignedAttorney.email}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editMode ? (
              <>
                <div>
                  <Label htmlFor="estimatedValue">Estimated Value</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    step="0.01"
                    value={editedCase.estimatedValue || ''}
                    onChange={(e) => setEditedCase({ 
                      ...editedCase, 
                      estimatedValue: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="Enter estimated case value"
                  />
                </div>

                <div>
                  <Label htmlFor="actualValue">Actual Value</Label>
                  <Input
                    id="actualValue"
                    type="number"
                    step="0.01"
                    value={editedCase.actualValue || ''}
                    onChange={(e) => setEditedCase({ 
                      ...editedCase, 
                      actualValue: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder="Enter actual case value"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-600">Estimated Value</div>
                    <div className="text-gray-900">{formatCurrency(caseDetails.estimatedValue)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-600">Actual Value</div>
                    <div className="text-gray-900">{formatCurrency(caseDetails.actualValue)}</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Important Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Important Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium text-gray-600">Opened Date</div>
                <div className="text-gray-900">{formatDate(caseDetails.openedDate)}</div>
              </div>
            </div>

            {caseDetails.closedDate && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Closed Date</div>
                  <div className="text-gray-900">{formatDate(caseDetails.closedDate)}</div>
                </div>
              </div>
            )}

            {caseDetails.statuteOfLimitations && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Statute of Limitations</div>
                  <div className="text-gray-900">{formatDate(caseDetails.statuteOfLimitations)}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      {caseDetails.tags && caseDetails.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {caseDetails.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}