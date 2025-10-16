'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Filter, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface SearchFilters {
  caseIds?: string[];
  categories?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  confidentialityLevels?: string[];
  uploadedBy?: string;
  hasAISummary?: boolean;
}

interface EvidenceFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  organizationId?: string;
}

const EVIDENCE_CATEGORIES = [
  'DOCUMENT',
  'PHOTO',
  'VIDEO',
  'AUDIO',
  'PHYSICAL',
  'DIGITAL',
  'TESTIMONY',
  'EXPERT_OPINION'
];

const CONFIDENTIALITY_LEVELS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'CONFIDENTIAL', label: 'Confidential' },
  { value: 'HIGHLY_CONFIDENTIAL', label: 'Highly Confidential' },
  { value: 'ATTORNEY_EYES_ONLY', label: 'Attorney Eyes Only' }
];

export function EvidenceFilters({ filters, onChange, organizationId }: EvidenceFiltersProps) {
  const [cases, setCases] = useState<Array<{ id: string; caseNumber: string; title: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Local state for date range
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined
  );

  useEffect(() => {
    if (organizationId) {
      loadFilterData();
    }
  }, [organizationId]);

  const loadFilterData = async () => {
    setLoadingData(true);
    try {
      const [casesResponse, usersResponse] = await Promise.all([
        fetch(`/api/cases?organizationId=${organizationId}&limit=100`),
        fetch(`/api/users?organizationId=${organizationId}`)
      ]);

      const [casesData, usersData] = await Promise.all([
        casesResponse.json(),
        usersResponse.json()
      ]);

      if (casesData.success) {
        setCases(casesData.data.cases || []);
      }

      if (usersData.success) {
        setUsers(usersData.data.users || []);
      }
    } catch (error) {
      console.error('Failed to load filter data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const updateFilters = (updates: Partial<SearchFilters>) => {
    onChange({ ...filters, ...updates });
  };

  const handleCaseToggle = (caseId: string) => {
    const currentCases = filters.caseIds || [];
    const newCases = currentCases.includes(caseId)
      ? currentCases.filter(id => id !== caseId)
      : [...currentCases, caseId];
    
    updateFilters({ caseIds: newCases.length > 0 ? newCases : undefined });
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(cat => cat !== category)
      : [...currentCategories, category];
    
    updateFilters({ categories: newCategories.length > 0 ? newCategories : undefined });
  };

  const handleConfidentialityToggle = (level: string) => {
    const currentLevels = filters.confidentialityLevels || [];
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter(l => l !== level)
      : [...currentLevels, level];
    
    updateFilters({ confidentialityLevels: newLevels.length > 0 ? newLevels : undefined });
  };

  const handleDateRangeChange = () => {
    const dateRange = (startDate || endDate) ? {
      start: startDate?.toISOString().split('T')[0],
      end: endDate?.toISOString().split('T')[0]
    } : undefined;
    
    updateFilters({ dateRange });
  };

  useEffect(() => {
    handleDateRangeChange();
  }, [startDate, endDate]);

  const clearAllFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.caseIds?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.confidentialityLevels?.length) count++;
    if (filters.uploadedBy) count++;
    if (filters.hasAISummary !== undefined) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          disabled={activeFilterCount === 0}
          className="text-gray-600"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Case Filter */}
        <div className="space-y-2">
          <Label>Cases</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {loadingData ? (
              <div className="text-sm text-gray-500">Loading cases...</div>
            ) : cases.length === 0 ? (
              <div className="text-sm text-gray-500">No cases found</div>
            ) : (
              cases.map((case_) => (
                <div key={case_.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`case-${case_.id}`}
                    checked={(filters.caseIds || []).includes(case_.id)}
                    onCheckedChange={() => handleCaseToggle(case_.id)}
                  />
                  <Label
                    htmlFor={`case-${case_.id}`}
                    className="text-sm cursor-pointer flex-1 min-w-0"
                  >
                    <span className="font-medium">{case_.caseNumber}</span>
                    <span className="text-gray-500 block truncate" title={case_.title}>
                      {case_.title}
                    </span>
                  </Label>
                </div>
              ))
            )}
          </div>
          {(filters.caseIds?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.caseIds!.map((caseId) => {
                const case_ = cases.find(c => c.id === caseId);
                return case_ ? (
                  <Badge key={caseId} variant="secondary" className="text-xs">
                    {case_.caseNumber}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleCaseToggle(caseId)}
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label>Categories</Label>
          <div className="space-y-2">
            {EVIDENCE_CATEGORIES.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={(filters.categories || []).includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="text-sm cursor-pointer"
                >
                  {category.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
          {(filters.categories?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.categories!.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category.replace('_', ' ')}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleCategoryToggle(category)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Confidentiality Filter */}
        <div className="space-y-2">
          <Label>Confidentiality Level</Label>
          <div className="space-y-2">
            {CONFIDENTIALITY_LEVELS.map((level) => (
              <div key={level.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`conf-${level.value}`}
                  checked={(filters.confidentialityLevels || []).includes(level.value)}
                  onCheckedChange={() => handleConfidentialityToggle(level.value)}
                />
                <Label
                  htmlFor={`conf-${level.value}`}
                  className="text-sm cursor-pointer"
                >
                  {level.label}
                </Label>
              </div>
            ))}
          </div>
          {(filters.confidentialityLevels?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.confidentialityLevels!.map((level) => (
                <Badge key={level} variant="secondary" className="text-xs">
                  {CONFIDENTIALITY_LEVELS.find(l => l.value === level)?.label || level}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleConfidentialityToggle(level)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Uploaded By Filter */}
        <div className="space-y-2">
          <Label>Uploaded By</Label>
          <Select
            value={filters.uploadedBy || ''}
            onValueChange={(value) => updateFilters({ uploadedBy: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingData ? "Loading users..." : "All users"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.uploadedBy && (
            <Badge variant="secondary" className="text-xs">
              {users.find(u => u.id === filters.uploadedBy)?.firstName} {users.find(u => u.id === filters.uploadedBy)?.lastName}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilters({ uploadedBy: undefined })}
              />
            </Badge>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`justify-start text-left font-normal ${!startDate ? 'text-muted-foreground' : ''}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`justify-start text-left font-normal ${!endDate ? 'text-muted-foreground' : ''}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'End date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {(startDate || endDate) && (
            <Badge variant="secondary" className="text-xs">
              {startDate ? format(startDate, 'MMM d') : '...'} - {endDate ? format(endDate, 'MMM d') : '...'}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              />
            </Badge>
          )}
        </div>

        {/* AI Features Filter */}
        <div className="space-y-2">
          <Label>AI Features</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasAISummary"
                checked={filters.hasAISummary === true}
                onCheckedChange={(checked) => 
                  updateFilters({ hasAISummary: checked ? true : undefined })
                }
              />
              <Label htmlFor="hasAISummary" className="text-sm cursor-pointer">
                Has AI Summary
              </Label>
            </div>
          </div>
          {filters.hasAISummary && (
            <Badge variant="secondary" className="text-xs">
              AI Processed
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilters({ hasAISummary: undefined })}
              />
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}