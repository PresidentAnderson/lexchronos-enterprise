'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  File, 
  Download, 
  Eye, 
  Calendar,
  User,
  Brain,
  Shield,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface EvidenceGridProps {
  evidence: SearchResult[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function EvidenceGrid({ evidence, onLoadMore, hasMore, loading }: EvidenceGridProps) {
  const getFileIcon = (mimeType: string, type: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf') || type === 'PDF') return FileText;
    if (mimeType.includes('word') || type === 'DOC') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getConfidentialityColor = (level: string) => {
    switch (level) {
      case 'PUBLIC': return 'bg-green-100 text-green-800';
      case 'CONFIDENTIAL': return 'bg-yellow-100 text-yellow-800';
      case 'HIGHLY_CONFIDENTIAL': return 'bg-orange-100 text-orange-800';
      case 'ATTORNEY_EYES_ONLY': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'semantic': return 'bg-purple-100 text-purple-800';
      case 'full_text': return 'bg-blue-100 text-blue-800';
      case 'hybrid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (evidence: Evidence) => {
    const link = document.createElement('a');
    link.href = `/api/documents/${evidence.id}/download`;
    link.download = evidence.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (evidence: Evidence) => {
    // Open document viewer or preview
    window.open(`/documents/${evidence.id}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {evidence.map((result) => {
          const { document: doc, relevanceScore, matchType, highlights } = result;
          const FileIcon = getFileIcon(doc.mimeType, doc.type);
          
          return (
            <Card key={doc.id} className="group hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4">
                {/* Header with file icon and relevance */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-6 w-6 text-blue-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm text-gray-900 truncate" title={doc.title}>
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate" title={doc.originalName}>
                        {doc.originalName}
                      </p>
                    </div>
                  </div>
                  {relevanceScore > 0.8 && (
                    <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                  )}
                </div>

                {/* Match type and relevance score */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className={`text-xs ${getMatchTypeColor(matchType)}`}>
                    {matchType === 'semantic' ? 'AI Match' : matchType === 'full_text' ? 'Text Match' : 'Hybrid'}
                  </Badge>
                  {relevanceScore < 1.0 && (
                    <span className="text-xs text-gray-500">
                      {Math.round(relevanceScore * 100)}% match
                    </span>
                  )}
                </div>

                {/* Description or AI Summary */}
                {(doc.description || doc.aiSummary) && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {doc.aiSummary || doc.description}
                    </p>
                    {doc.aiSummary && (
                      <div className="flex items-center gap-1 mt-1">
                        <Brain className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-600">AI Generated</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Highlights for search results */}
                {highlights && highlights.length > 0 && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded text-xs">
                    <div className="font-medium text-yellow-800 mb-1">Matches found:</div>
                    {highlights.map((highlight, index) => (
                      <div 
                        key={index}
                        className="text-yellow-700"
                        dangerouslySetInnerHTML={{ __html: highlight }}
                      />
                    ))}
                  </div>
                )}

                {/* Key Points */}
                {doc.keyPoints && doc.keyPoints.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">Key Points:</div>
                    <div className="space-y-1">
                      {doc.keyPoints.slice(0, 3).map((point, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-blue-500 shrink-0">•</span>
                          <span className="line-clamp-1">{point}</span>
                        </div>
                      ))}
                      {doc.keyPoints.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{doc.keyPoints.length - 3} more points
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Category and confidentiality */}
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {doc.category.replace('_', ' ')}
                  </Badge>
                  <Badge variant="secondary" className={`text-xs ${getConfidentialityColor(doc.confidentialityLevel)}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {doc.confidentialityLevel.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Case association */}
                {doc.case && (
                  <div className="mb-3 p-2 bg-blue-50 rounded">
                    <div className="text-xs font-medium text-blue-800">Associated Case</div>
                    <div className="text-xs text-blue-700">{doc.case.caseNumber}</div>
                    <div className="text-xs text-blue-600 truncate" title={doc.case.title}>
                      {doc.case.title}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-1 mb-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatFileSize(doc.fileSize)} • {doc.type}
                  </div>
                </div>

                {/* Confidentiality flags */}
                {doc.confidentialityFlags && doc.confidentialityFlags.length > 0 && (
                  <div className="mb-4 p-2 bg-red-50 rounded">
                    <div className="text-xs font-medium text-red-800 mb-1">Security Alerts:</div>
                    {doc.confidentialityFlags.slice(0, 2).map((flag, index) => (
                      <div key={index} className="text-xs text-red-700">{flag}</div>
                    ))}
                    {doc.confidentialityFlags.length > 2 && (
                      <div className="text-xs text-red-600">
                        +{doc.confidentialityFlags.length - 2} more alerts
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(doc)}
                    className="flex-1 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc)}
                    className="flex-1 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Loading...
              </div>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}