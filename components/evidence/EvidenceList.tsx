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
  Star,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

interface EvidenceListProps {
  evidence: SearchResult[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function EvidenceList({ evidence, onLoadMore, hasMore, loading }: EvidenceListProps) {
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
      case 'PUBLIC': return 'bg-green-100 text-green-800 border-green-200';
      case 'CONFIDENTIAL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGHLY_CONFIDENTIAL': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ATTORNEY_EYES_ONLY': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'semantic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'full_text': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hybrid': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleViewCase = (caseId: string) => {
    window.open(`/cases/${caseId}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {evidence.map((result) => {
        const { document: doc, relevanceScore, matchType, highlights } = result;
        const FileIcon = getFileIcon(doc.mimeType, doc.type);
        
        return (
          <Card key={doc.id} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {/* File Icon */}
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                        {relevanceScore > 0.8 && (
                          <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                        )}
                        {relevanceScore < 1.0 && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(relevanceScore * 100)}% match
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span>{doc.originalName}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{doc.type}</span>
                      </div>

                      {/* Match Type */}
                      <Badge className={`text-xs mr-2 ${getMatchTypeColor(matchType)}`}>
                        {matchType === 'semantic' ? 'AI Semantic Match' : 
                         matchType === 'full_text' ? 'Text Match' : 
                         'Hybrid Match'}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0 ml-4">
                      <Button size="sm" variant="outline" onClick={() => handleView(doc)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Description or AI Summary */}
                  {(doc.description || doc.aiSummary) && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {doc.aiSummary || doc.description}
                      </p>
                      {doc.aiSummary && (
                        <div className="flex items-center gap-1 mt-1">
                          <Brain className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-600">AI Generated Summary</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Search Highlights */}
                  {highlights && highlights.length > 0 && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800 mb-2">Relevant excerpts:</div>
                      {highlights.map((highlight, index) => (
                        <div 
                          key={index}
                          className="text-sm text-yellow-700 mb-1 last:mb-0"
                          dangerouslySetInnerHTML={{ __html: highlight }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Key Points */}
                  {doc.keyPoints && doc.keyPoints.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Key Points:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {doc.keyPoints.slice(0, 4).map((point, index) => (
                          <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                            <span className="line-clamp-1">{point}</span>
                          </div>
                        ))}
                      </div>
                      {doc.keyPoints.length > 4 && (
                        <div className="text-sm text-gray-500 mt-1">
                          +{doc.keyPoints.length - 4} more key points
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confidentiality Alerts */}
                  {doc.confidentialityFlags && doc.confidentialityFlags.length > 0 && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-800 mb-2">Security Alerts:</div>
                      {doc.confidentialityFlags.slice(0, 3).map((flag, index) => (
                        <div key={index} className="text-sm text-red-700 flex items-start gap-2">
                          <Shield className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </div>
                      ))}
                      {doc.confidentialityFlags.length > 3 && (
                        <div className="text-sm text-red-600 mt-1">
                          +{doc.confidentialityFlags.length - 3} more security alerts
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case Association */}
                  {doc.case && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-blue-800">Associated Case</div>
                          <div className="text-sm text-blue-700">{doc.case.caseNumber}</div>
                          <div className="text-sm text-blue-600 truncate" title={doc.case.title}>
                            {doc.case.title}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewCase(doc.case!.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>
                          {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span title={format(new Date(doc.createdAt), 'PPP')}>
                          {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {doc.category.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs ${getConfidentialityColor(doc.confidentialityLevel)}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {doc.confidentialityLevel.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="min-w-[140px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Loading...
              </div>
            ) : (
              <>
                Load More
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}