'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConflictCheckSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Search, Shield, X, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ConflictCheckFormProps {
  onSuccess?: () => void;
  caseId?: string;
  entityId?: string;
}

interface ConflictCheckFormData {
  checkType: 'NEW_CASE' | 'NEW_CLIENT' | 'NEW_MATTER' | 'LATERAL_HIRE' | 'ROUTINE_CHECK' | 'OTHER';
  entityId?: string;
  caseId?: string;
  searchTerms: string[];
  searchScope: 'ENTITY_ONLY' | 'RELATED_ENTITIES' | 'FULL';
}

export function ConflictCheckForm({ onSuccess, caseId, entityId }: ConflictCheckFormProps) {
  const [loading, setLoading] = useState(false);
  const [searchTerms, setSearchTerms] = useState<string[]>(['']);
  const [conflictResults, setConflictResults] = useState<any>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ConflictCheckFormData>({
    resolver: zodResolver(ConflictCheckSchema),
    defaultValues: {
      checkType: 'NEW_CASE',
      searchScope: 'FULL',
      caseId,
      entityId,
    },
  });

  const watchCheckType = watch('checkType');
  const watchSearchScope = watch('searchScope');

  const addSearchTerm = () => {
    setSearchTerms([...searchTerms, '']);
  };

  const updateSearchTerm = (index: number, value: string) => {
    const updated = [...searchTerms];
    updated[index] = value;
    setSearchTerms(updated);
    setValue('searchTerms', updated.filter(term => term.trim()));
  };

  const removeSearchTerm = (index: number) => {
    const updated = searchTerms.filter((_, i) => i !== index);
    setSearchTerms(updated);
    setValue('searchTerms', updated.filter(term => term.trim()));
  };

  const onSubmit = async (data: ConflictCheckFormData) => {
    try {
      setLoading(true);
      
      const formData = {
        ...data,
        searchTerms: searchTerms.filter(term => term.trim()),
      };

      const response = await fetch('/api/conflicts/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform conflict check');
      }

      const result = await response.json();
      setConflictResults(result.conflictCheck);
      
      if (result.conflictCheck.conflictLevel === 'NONE') {
        toast.success('No conflicts identified - case cleared');
      } else {
        toast.error(`${result.conflictCheck.conflictLevel} level conflicts found`);
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getConflictLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getScopeDescription = (scope: string) => {
    switch (scope) {
      case 'ENTITY_ONLY':
        return 'Search only the specified entities';
      case 'RELATED_ENTITIES':
        return 'Search entities and their known relationships';
      case 'FULL':
        return 'Comprehensive search including cases, documents, and relationships';
      default:
        return '';
    }
  };

  if (conflictResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Conflict Check Results</h3>
          <Badge variant={getConflictLevelColor(conflictResults.conflictLevel)}>
            {conflictResults.conflictLevel} Risk
          </Badge>
        </div>

        {conflictResults.conflictLevel !== 'NONE' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Potential Conflicts Identified</AlertTitle>
            <AlertDescription>
              {conflictResults.potentialConflicts?.length || 0} potential conflicts found. 
              Review carefully before proceeding.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <h4 className="font-medium">Search Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Check Type</Label>
              <p>{conflictResults.checkType.replace('_', ' ')}</p>
            </div>
            <div>
              <Label>Search Scope</Label>
              <p>{conflictResults.searchScope.replace('_', ' ')}</p>
            </div>
            <div>
              <Label>Search Terms</Label>
              <div className="flex flex-wrap gap-1">
                {JSON.parse(conflictResults.searchTerms).map((term: string, index: number) => (
                  <Badge key={index} variant="outline">{term}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Performed At</Label>
              <p>{new Date(conflictResults.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {conflictResults.potentialConflicts && conflictResults.potentialConflicts.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Potential Conflicts</h4>
            {conflictResults.potentialConflicts.map((conflict: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{conflict.type.replace('_', ' ')}</CardTitle>
                    <Badge variant={getConflictLevelColor(conflict.riskLevel)}>
                      {conflict.riskLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-2">{conflict.description}</p>
                  {conflict.entity && (
                    <div className="text-xs">
                      <strong>Entity:</strong> {conflict.entity.name} ({conflict.entity.type})
                    </div>
                  )}
                  {conflict.case && (
                    <div className="text-xs">
                      <strong>Case:</strong> {conflict.case.caseNumber} - {conflict.case.title}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    <strong>Match:</strong> "{conflict.searchTerm}"
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConflictResults(null)}>
            Run Another Check
          </Button>
          {conflictResults.conflictLevel !== 'NONE' && (
            <Button variant="destructive">
              Create Waiver Request
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkType">Check Type</Label>
          <Select 
            onValueChange={(value) => setValue('checkType', value as any)}
            defaultValue="NEW_CASE"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select check type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW_CASE">New Case</SelectItem>
              <SelectItem value="NEW_CLIENT">New Client</SelectItem>
              <SelectItem value="NEW_MATTER">New Matter</SelectItem>
              <SelectItem value="LATERAL_HIRE">Lateral Hire</SelectItem>
              <SelectItem value="ROUTINE_CHECK">Routine Check</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.checkType && (
            <p className="text-sm text-red-500">{errors.checkType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="searchScope">Search Scope</Label>
          <Select 
            onValueChange={(value) => setValue('searchScope', value as any)}
            defaultValue="FULL"
          >
            <SelectTrigger>
              <SelectValue placeholder="Select search scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ENTITY_ONLY">Entity Only</SelectItem>
              <SelectItem value="RELATED_ENTITIES">Include Relationships</SelectItem>
              <SelectItem value="FULL">Full Search</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {getScopeDescription(watchSearchScope)}
          </p>
          {errors.searchScope && (
            <p className="text-sm text-red-500">{errors.searchScope.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Search Terms</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addSearchTerm}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Term
          </Button>
        </div>
        <div className="space-y-2">
          {searchTerms.map((term, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Enter name, company, or identifier to check"
                value={term}
                onChange={(e) => updateSearchTerm(index, e.target.value)}
                className="flex-1"
              />
              {searchTerms.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeSearchTerm(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Add names, companies, or any identifiers you want to check for conflicts
        </p>
        {errors.searchTerms && (
          <p className="text-sm text-red-500">{errors.searchTerms.message}</p>
        )}
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Ethical Compliance</AlertTitle>
        <AlertDescription>
          This conflict check will search all firm entities, cases, and relationships. 
          Ensure all relevant information is included in your search terms.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          {loading ? 'Checking...' : 'Perform Conflict Check'}
        </Button>
      </div>
    </form>
  );
}