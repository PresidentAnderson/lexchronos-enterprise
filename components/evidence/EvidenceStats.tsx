'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  File, 
  Brain,
  Shield,
  Calendar,
  TrendingUp
} from 'lucide-react';

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

interface EvidenceStats {
  total: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byConfidentiality: Record<string, number>;
  aiProcessed: number;
  totalSize: number;
  recentUploads: number;
}

interface EvidenceStatsProps {
  filters: SearchFilters;
  organizationId?: string;
}

export function EvidenceStats({ filters, organizationId }: EvidenceStatsProps) {
  const [stats, setStats] = useState<EvidenceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      loadStats();
    }
  }, [organizationId, filters]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ organizationId: organizationId! });

      // Add filter parameters
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

      const response = await fetch(`/api/evidence/stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load evidence stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'image':
      case 'photo':
        return Image;
      case 'video':
        return Video;
      case 'audio':
        return Music;
      case 'pdf':
      case 'document':
        return FileText;
      default:
        return File;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Evidence Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Evidence Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Evidence Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Count */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Evidence</div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="flex items-center justify-center mb-1">
              <Brain className="h-3 w-3 text-green-600" />
            </div>
            <div className="font-medium text-green-800">{stats.aiProcessed}</div>
            <div className="text-green-600">AI Processed</div>
          </div>
          
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-3 w-3 text-blue-600" />
            </div>
            <div className="font-medium text-blue-800">{stats.recentUploads}</div>
            <div className="text-blue-600">Recent (7d)</div>
          </div>
        </div>

        {/* Total Storage */}
        {stats.totalSize > 0 && (
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm font-medium text-gray-800">
              {formatFileSize(stats.totalSize)}
            </div>
            <div className="text-xs text-gray-600">Total Storage</div>
          </div>
        )}

        {/* By Category */}
        {Object.keys(stats.byCategory).length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Categories</div>
            <div className="space-y-1">
              {Object.entries(stats.byCategory)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate">
                      {category.replace('_', ' ')}
                    </span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {count}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* By File Type */}
        {Object.keys(stats.byType).length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">File Types</div>
            <div className="space-y-1">
              {Object.entries(stats.byType)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => {
                  const IconComponent = getTypeIcon(type);
                  return (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <IconComponent className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">{type}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* By Confidentiality */}
        {Object.keys(stats.byConfidentiality).length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Confidentiality</div>
            <div className="space-y-1">
              {Object.entries(stats.byConfidentiality).map(([level, count]) => {
                const getColor = (level: string) => {
                  switch (level) {
                    case 'PUBLIC': return 'text-green-600';
                    case 'CONFIDENTIAL': return 'text-yellow-600';
                    case 'HIGHLY_CONFIDENTIAL': return 'text-orange-600';
                    case 'ATTORNEY_EYES_ONLY': return 'text-red-600';
                    default: return 'text-gray-600';
                  }
                };

                return (
                  <div key={level} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Shield className={`h-3 w-3 ${getColor(level)}`} />
                      <span className="text-gray-600 truncate">
                        {level.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter indicator */}
        {(filters.caseIds?.length || 
          filters.categories?.length || 
          filters.confidentialityLevels?.length || 
          filters.uploadedBy || 
          filters.hasAISummary !== undefined || 
          filters.dateRange?.start || 
          filters.dateRange?.end) && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Calendar className="h-3 w-3" />
              <span>Filtered results</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}