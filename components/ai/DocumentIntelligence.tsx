'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Search,
  BarChart3,
  PieChart,
  FileSearch,
  Scale,
  Shield,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface DocumentAnalysis {
  id: string;
  documentId: string;
  documentTitle: string;
  summary: string;
  keyPoints: string[];
  legalIssues: string[];
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    recommendations: string[];
  };
  entityRecognition: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    amounts: string[];
  };
  sentimentAnalysis: {
    overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    score: number;
    confidence: number;
  };
  complianceCheck: {
    issues: string[];
    recommendations: string[];
    score: number;
  };
  relevanceScore: number;
  confidenceScore: number;
  processingTime: number;
  createdAt: string;
}

interface DocumentIntelligenceProps {
  caseId?: string;
  organizationId: string;
  documents?: Array<{
    id: string;
    title: string;
    type: string;
    confidentialityLevel: string;
  }>;
}

export function DocumentIntelligence({ 
  caseId, 
  organizationId, 
  documents = [] 
}: DocumentIntelligenceProps) {
  const { toast } = useToast();
  
  const [analyses, setAnalyses] = useState<DocumentAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [filters, setFilters] = useState({
    riskLevel: 'ALL',
    sentiment: 'ALL',
    hasIssues: false
  });

  useEffect(() => {
    if (organizationId) {
      loadExistingAnalyses();
    }
  }, [organizationId, caseId]);

  const loadExistingAnalyses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId,
        ...(caseId && { caseId })
      });

      const response = await fetch(`/api/ai/document-analysis?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalyses(data.data.analyses || []);
      }
    } catch (error) {
      console.error('Failed to load document analyses:', error);
      toast.error('Failed to load document analyses');
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (documentId: string) => {
    try {
      const response = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          organizationId,
          caseId,
          analysisTypes: ['summary', 'entities', 'sentiment', 'legal', 'risk', 'compliance']
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalyses(prev => [...prev.filter(a => a.documentId !== documentId), data.data.analysis]);
        toast.success('Document analysis completed');
      } else {
        toast.error(data.error || 'Document analysis failed');
      }
    } catch (error) {
      console.error('Document processing error:', error);
      toast.error('Document processing failed');
    }
  };

  const processBulkDocuments = async () => {
    if (documents.length === 0) {
      toast.error('No documents available for processing');
      return;
    }

    setBulkProcessing(true);
    setProcessingProgress(0);

    const unprocessedDocs = documents.filter(doc => 
      !analyses.some(analysis => analysis.documentId === doc.id)
    );

    if (unprocessedDocs.length === 0) {
      toast.info('All documents have already been processed');
      setBulkProcessing(false);
      return;
    }

    try {
      for (let i = 0; i < unprocessedDocs.length; i++) {
        await processDocument(unprocessedDocs[i].id);
        setProcessingProgress(((i + 1) / unprocessedDocs.length) * 100);
      }

      toast.success(`Processed ${unprocessedDocs.length} documents`);
    } catch (error) {
      toast.error('Bulk processing failed');
    } finally {
      setBulkProcessing(false);
      setProcessingProgress(0);
    }
  };

  const exportAnalytics = () => {
    if (analyses.length === 0) {
      toast.error('No analyses to export');
      return;
    }

    const csvContent = [
      ['Document', 'Risk Level', 'Sentiment', 'Relevance Score', 'Legal Issues', 'Key Points'].join(','),
      ...analyses.map(analysis => [
        `"${analysis.documentTitle}"`,
        analysis.riskAssessment.level,
        analysis.sentimentAnalysis.overall,
        analysis.relevanceScore.toFixed(2),
        analysis.legalIssues.length,
        analysis.keyPoints.length
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document-intelligence-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Analytics exported successfully');
  };

  const filteredAnalyses = analyses.filter(analysis => {
    if (filters.riskLevel !== 'ALL' && analysis.riskAssessment.level !== filters.riskLevel) {
      return false;
    }
    if (filters.sentiment !== 'ALL' && analysis.sentimentAnalysis.overall !== filters.sentiment) {
      return false;
    }
    if (filters.hasIssues && analysis.legalIssues.length === 0) {
      return false;
    }
    return true;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'bg-green-100 text-green-800';
      case 'NEGATIVE': return 'bg-red-100 text-red-800';
      case 'NEUTRAL': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Document Intelligence Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={processBulkDocuments}
                disabled={bulkProcessing || documents.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {bulkProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze All Documents
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={loadExistingAnalyses} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportAnalytics} disabled={analyses.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Processing progress */}
            {bulkProcessing && (
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm mb-1">
                  <span>Processing documents...</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analyses.length}</div>
                <div className="text-sm text-gray-600">Documents Analyzed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {analyses.filter(a => a.riskAssessment.level === 'HIGH' || a.riskAssessment.level === 'CRITICAL').length}
                </div>
                <div className="text-sm text-gray-600">High Risk</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {analyses.filter(a => a.legalIssues.length > 0).length}
                </div>
                <div className="text-sm text-gray-600">With Legal Issues</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(analyses.reduce((sum, a) => sum + a.relevanceScore, 0) / analyses.length * 100)}%
                </div>
                <div className="text-sm text-gray-600">Avg. Relevance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Document Analyses ({filteredAnalyses.length})
            </CardTitle>
            
            {/* Filters */}
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              
              <select
                value={filters.sentiment}
                onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="ALL">All Sentiments</option>
                <option value="POSITIVE">Positive</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="NEGATIVE">Negative</option>
              </select>

              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={filters.hasIssues}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasIssues: e.target.checked }))}
                  className="rounded"
                />
                Has Issues
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading document analyses...</p>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No document analyses found</p>
              <Button onClick={processBulkDocuments} disabled={documents.length === 0}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Analyzing Documents
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnalyses.map((analysis) => (
                <Card key={analysis.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {analysis.documentTitle}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={getRiskColor(analysis.riskAssessment.level)}>
                            <Shield className="h-3 w-3 mr-1" />
                            {analysis.riskAssessment.level} Risk
                          </Badge>
                          <Badge className={getSentimentColor(analysis.sentimentAnalysis.overall)}>
                            {analysis.sentimentAnalysis.overall} Sentiment
                          </Badge>
                          <Badge variant="outline">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {Math.round(analysis.relevanceScore * 100)}% Relevant
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {analysis.processingTime}ms
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDocument(
                            selectedDocument === analysis.id ? null : analysis.id
                          )}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Summary */}
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {analysis.summary}
                    </p>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-blue-500" />
                        <span>{analysis.legalIssues.length} Legal Issues</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-500" />
                        <span>{analysis.keyPoints.length} Key Points</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span>{analysis.complianceCheck.issues.length} Compliance Issues</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span>{Math.round(analysis.confidenceScore * 100)}% Confidence</span>
                      </div>
                    </div>

                    {/* Detailed Analysis */}
                    {selectedDocument === analysis.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Tabs defaultValue="summary" className="w-full">
                          <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="legal">Legal Issues</TabsTrigger>
                            <TabsTrigger value="entities">Entities</TabsTrigger>
                            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
                            <TabsTrigger value="compliance">Compliance</TabsTrigger>
                          </TabsList>

                          <TabsContent value="summary" className="mt-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">AI Summary</h4>
                                <p className="text-gray-700">{analysis.summary}</p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Key Points</h4>
                                <ul className="space-y-1">
                                  {analysis.keyPoints.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-blue-500 shrink-0 mt-1.5">•</span>
                                      <span className="text-gray-700">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="legal" className="mt-4">
                            <div className="space-y-3">
                              <h4 className="font-medium">Legal Issues Identified</h4>
                              {analysis.legalIssues.length === 0 ? (
                                <p className="text-gray-600">No legal issues identified</p>
                              ) : (
                                <div className="space-y-2">
                                  {analysis.legalIssues.map((issue, idx) => (
                                    <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                        <span className="text-red-800">{issue}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="entities" className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">People</h4>
                                <div className="flex flex-wrap gap-1">
                                  {analysis.entityRecognition.people.map((person, idx) => (
                                    <Badge key={idx} variant="outline">{person}</Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Organizations</h4>
                                <div className="flex flex-wrap gap-1">
                                  {analysis.entityRecognition.organizations.map((org, idx) => (
                                    <Badge key={idx} variant="outline">{org}</Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Locations</h4>
                                <div className="flex flex-wrap gap-1">
                                  {analysis.entityRecognition.locations.map((location, idx) => (
                                    <Badge key={idx} variant="outline">{location}</Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Amounts</h4>
                                <div className="flex flex-wrap gap-1">
                                  {analysis.entityRecognition.amounts.map((amount, idx) => (
                                    <Badge key={idx} variant="outline">{amount}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="risk" className="mt-4">
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium">Overall Risk Level</h4>
                                  <Badge className={getRiskColor(analysis.riskAssessment.level)}>
                                    {analysis.riskAssessment.level}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Risk Factors</h4>
                                <ul className="space-y-2">
                                  {analysis.riskAssessment.factors.map((factor, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                                      <span className="text-gray-700">{factor}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Recommendations</h4>
                                <ul className="space-y-2">
                                  {analysis.riskAssessment.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                      <span className="text-gray-700">{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="compliance" className="mt-4">
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">Compliance Score</h4>
                                  <span className="text-lg font-bold">
                                    {Math.round(analysis.complianceCheck.score * 100)}%
                                  </span>
                                </div>
                              </div>
                              
                              {analysis.complianceCheck.issues.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Compliance Issues</h4>
                                  <div className="space-y-2">
                                    {analysis.complianceCheck.issues.map((issue, idx) => (
                                      <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                        <span className="text-yellow-800">{issue}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <h4 className="font-medium mb-2">Recommendations</h4>
                                <ul className="space-y-2">
                                  {analysis.complianceCheck.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                      <span className="text-gray-700">{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}