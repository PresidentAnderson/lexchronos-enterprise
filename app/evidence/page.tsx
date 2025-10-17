'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Upload, Filter, Grid, List, Calendar, User, File, Star } from 'lucide-react';
import { EvidenceUploadDialog } from '@/components/evidence/EvidenceUploadDialog';
import { EvidenceList } from '@/components/evidence/EvidenceList';
import { EvidenceGrid } from '@/components/evidence/EvidenceGrid';
import { EvidenceFilters } from '@/components/evidence/EvidenceFilters';
import { EvidenceStats } from '@/components/evidence/EvidenceStats';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface Evidence {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  type: string;
  confidentialityLevel: string;
  aiSummary?: string;
  keyPoints?: string[];
  confidentialityFlags?: string[];
  createdAt: string;
  updatedAt: string;
  case?: {
    id: string;
    caseNumber: string;
    title: string;
  };
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface SearchResult {
  document: Evidence;
  relevanceScore: number;
  matchType: 'semantic' | 'full_text' | 'hybrid';
  highlights?: string[];
}

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

export default function EvidencePage() {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [evidence, setEvidence] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'hybrid' | 'semantic' | 'full_text'>('hybrid');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Initialize from URL params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get('caseId');
    if (caseId) {
      setFilters(prev => ({ ...prev, caseIds: [caseId] }));
    }
  }, []);

  // Search and load evidence
  const searchEvidence = async (reset = false) => {
    if (!organization?.id) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId: organization.id,
        type: searchType,
        page: reset ? '1' : page.toString(),
        limit: '20'
      });

      if (searchQuery.trim()) {
        params.append('q', searchQuery);
      }

      if (filters.caseIds?.length) {
        params.append('caseIds', filters.caseIds.join(','));
      }

      if (filters.categories?.length) {
        params.append('categories', filters.categories.join(','));
      }

      if (filters.confidentialityLevels?.length) {
        params.append('confidentialityLevels', filters.confidentialityLevels.join(','));
      }

      if (filters.uploadedBy) {
        params.append('uploadedBy', filters.uploadedBy);
      }

      if (filters.hasAISummary !== undefined) {
        params.append('hasAISummary', filters.hasAISummary.toString());
      }

      if (filters.dateRange?.start) {
        params.append('dateStart', filters.dateRange.start);
      }

      if (filters.dateRange?.end) {
        params.append('dateEnd', filters.dateRange.end);
      }

      const response = await fetch(`/api/evidence/search?${params}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setEvidence(data.data.results);
          setPage(1);
        } else {
          setEvidence(prev => page === 1 ? data.data.results : [...prev, ...data.data.results]);
        }
        
        setTotalPages(data.data.pagination.pages);
        setTotalCount(data.data.pagination.total);
      } else {
        toast.error('Failed to search evidence');
      }
    } catch (error) {
      console.error('Evidence search error:', error);
      toast.error('Error searching evidence');
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    searchEvidence(true);
  }, [organization?.id, searchType, filters]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== undefined) {
        searchEvidence(true);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleUploadSuccess = (newEvidence: Evidence) => {
    setEvidence(prev => [
      { document: newEvidence, relevanceScore: 1.0, matchType: 'full_text' },
      ...prev
    ]);
    setTotalCount(prev => prev + 1);
    toast.success('Evidence uploaded successfully');
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const handleSearchTypeChange = (type: 'hybrid' | 'semantic' | 'full_text') => {
    setSearchType(type);
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      setPage(prev => prev + 1);
      searchEvidence();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evidence Management</h1>
            <p className="text-gray-600 mt-1">
              Manage and search case evidence with AI-powered analysis
            </p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Evidence
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search evidence by content, title, or case..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="shrink-0"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Search Type Tabs */}
            <Tabs value={searchType} onValueChange={handleSearchTypeChange} className="mt-2">
              <TabsList>
                <TabsTrigger value="hybrid">Hybrid Search</TabsTrigger>
                <TabsTrigger value="semantic">AI Semantic</TabsTrigger>
                <TabsTrigger value="full_text">Text Search</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <EvidenceStats filters={filters} organizationId={organization?.id} />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <EvidenceFilters
                filters={filters}
                onChange={handleFilterChange}
                organizationId={organization?.id}
              />
            </CardContent>
          </Card>
        )}

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {totalCount} results found
            </span>
            {searchQuery && (
              <Badge variant="secondary">
                Query: "{searchQuery}"
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Evidence Display */}
      <div className="space-y-6">
        {loading && page === 1 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : evidence.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No evidence found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your search query or filters'
                  : 'Upload your first piece of evidence to get started'
                }
              </p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidence
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <EvidenceGrid 
            evidence={evidence} 
            onLoadMore={loadMore}
            hasMore={page < totalPages}
            loading={loading}
          />
        ) : (
          <EvidenceList 
            evidence={evidence} 
            onLoadMore={loadMore}
            hasMore={page < totalPages}
            loading={loading}
          />
        )}
      </div>

      {/* Upload Dialog */}
      <EvidenceUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={handleUploadSuccess}
        organizationId={organization?.id}
        uploaderId={user?.id}
        preSelectedCaseId={filters.caseIds?.[0]}
      />
    </div>
  );
}