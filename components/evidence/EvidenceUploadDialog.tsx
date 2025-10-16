'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, File, X, AlertCircle, CheckCircle, Sparkles, Brain } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface EvidenceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (evidence: any) => void;
  organizationId?: string;
  uploaderId?: string;
  preSelectedCaseId?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface ProcessingResults {
  aiSummaryGenerated: boolean;
  textExtracted: boolean;
  categoryDetected: boolean;
  confidentialityFlagged: boolean;
  embeddingsGenerated: boolean;
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
  { value: 'PUBLIC', label: 'Public', description: 'No confidentiality restrictions' },
  { value: 'CONFIDENTIAL', label: 'Confidential', description: 'Standard attorney-client privilege' },
  { value: 'HIGHLY_CONFIDENTIAL', label: 'Highly Confidential', description: 'Enhanced protection required' },
  { value: 'ATTORNEY_EYES_ONLY', label: 'Attorney Eyes Only', description: 'Restricted to attorneys only' }
];

export function EvidenceUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  organizationId,
  uploaderId,
  preSelectedCaseId
}: EvidenceUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('DOCUMENT');
  const [confidentialityLevel, setConfidentialityLevel] = useState('CONFIDENTIAL');
  const [selectedCase, setSelectedCase] = useState(preSelectedCaseId || '');
  const [enableAI, setEnableAI] = useState(true);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [processingResults, setProcessingResults] = useState<ProcessingResults | null>(null);
  
  // Data
  const [cases, setCases] = useState<Array<{ id: string; caseNumber: string; title: string }>>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // Load cases
  useEffect(() => {
    if (open && organizationId) {
      loadCases();
    }
  }, [open, organizationId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
      setSelectedCase(preSelectedCaseId || '');
    }
  }, [open, preSelectedCaseId]);

  const loadCases = async () => {
    setLoadingCases(true);
    try {
      const response = await fetch(`/api/cases?organizationId=${organizationId}&limit=100`);
      const data = await response.json();
      if (data.success) {
        setCases(data.data.cases);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoadingCases(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setCategory('DOCUMENT');
    setConfidentialityLevel('CONFIDENTIAL');
    setEnableAI(true);
    setUploading(false);
    setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
    setProcessingResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        // Auto-populate title from filename
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setTitle(fileName.replace(/[-_]/g, ' ')); // Replace hyphens and underscores with spaces
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setTitle(fileName.replace(/[-_]/g, ' '));
      }
    }
  };

  const validateForm = () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return false;
    }
    if (!title.trim()) {
      toast.error('Please enter a title for the evidence');
      return false;
    }
    if (!organizationId || !uploaderId) {
      toast.error('Missing required authentication data');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setUploading(true);
    setUploadProgress({ loaded: 0, total: selectedFile!.size, percentage: 0 });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile!);
      formData.append('organizationId', organizationId!);
      formData.append('uploadedById', uploaderId!);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('confidentialityLevel', confidentialityLevel);
      formData.append('enableAI', enableAI.toString());
      
      if (selectedCase) {
        formData.append('caseId', selectedCase);
      }

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          setUploadProgress({
            loaded: event.loaded,
            total: event.total,
            percentage
          });
        }
      });

      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setProcessingResults(response.data.processing);
          onSuccess(response.data.document);
          setTimeout(() => {
            onOpenChange(false);
            resetForm();
          }, 2000);
        } else {
          const error = JSON.parse(xhr.responseText);
          toast.error(error.error || 'Upload failed');
          setUploading(false);
        }
      });

      xhr.addEventListener('error', () => {
        toast.error('Network error during upload');
        setUploading(false);
      });

      xhr.open('POST', '/api/evidence/upload');
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    return '📎';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Evidence
          </DialogTitle>
          <DialogDescription>
            Upload documents, images, or other evidence with AI-powered analysis and categorization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>File Upload</Label>
            
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Support for PDF, DOC, images, videos, and audio files
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Maximum file size: 100MB
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(selectedFile)}</span>
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {uploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress.percentage}%</span>
                    </div>
                    <Progress value={uploadProgress.percentage} className="w-full" />
                    <div className="text-xs text-gray-500">
                      {formatFileSize(uploadProgress.loaded)} of {formatFileSize(uploadProgress.total)}
                    </div>
                  </div>
                )}

                {processingResults && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Processing Complete</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {processingResults.textExtracted ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span>Text Extracted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {processingResults.aiSummaryGenerated ? (
                          <Sparkles className="h-3 w-3 text-blue-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span>AI Summary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {processingResults.categoryDetected ? (
                          <Brain className="h-3 w-3 text-purple-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span>Auto-categorized</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {processingResults.embeddingsGenerated ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span>Searchable</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.mp3,.wav,.m4a"
            />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter evidence title"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case">Associated Case</Label>
            <Select value={selectedCase} onValueChange={setSelectedCase} disabled={uploading}>
              <SelectTrigger>
                <SelectValue placeholder={loadingCases ? "Loading cases..." : "Select a case (optional)"} />
              </SelectTrigger>
              <SelectContent>
                {cases.map((case_) => (
                  <SelectItem key={case_.id} value={case_.id}>
                    {case_.caseNumber} - {case_.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidentiality">Confidentiality Level</Label>
            <Select value={confidentialityLevel} onValueChange={setConfidentialityLevel} disabled={uploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONFIDENTIALITY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex flex-col">
                      <span>{level.label}</span>
                      <span className="text-xs text-gray-500">{level.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the evidence"
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* AI Processing Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableAI"
              checked={enableAI}
              onCheckedChange={setEnableAI}
              disabled={uploading}
            />
            <Label htmlFor="enableAI" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Enable AI processing (automatic summarization, categorization, and search indexing)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || uploading}
            className="min-w-[120px]"
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </div>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidence
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}