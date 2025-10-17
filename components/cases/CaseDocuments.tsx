'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileText, Filter, RefreshCcw, Search, ShieldAlert, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/useToast';

interface CaseDocument {
  id: string;
  title: string;
  type: string;
  confidentialityLevel: string;
  createdAt: string;
}

interface CaseDocumentsProps {
  caseId: string;
  documents: CaseDocument[];
  onUpdate: () => void;
}

const CONFIDENTIALITY_COLORS: Record<string, string> = {
  PUBLIC: 'bg-green-100 text-green-800',
  INTERNAL: 'bg-blue-100 text-blue-800',
  CONFIDENTIAL: 'bg-yellow-100 text-yellow-800',
  PRIVILEGED: 'bg-red-100 text-red-800',
};

export function CaseDocuments({ caseId, documents, onUpdate }: CaseDocumentsProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | string>('ALL');
  const [confidentialityFilter, setConfidentialityFilter] = useState<'ALL' | string>('ALL');
  const [uploading, setUploading] = useState(false);

  const documentTypes = useMemo(() => {
    const values = new Set<string>();
    documents.forEach(doc => {
      if (doc.type) {
        values.add(doc.type);
      }
    });
    return Array.from(values);
  }, [documents]);

  const confidentialityLevels = useMemo(() => {
    const values = new Set<string>();
    documents.forEach(doc => {
      if (doc.confidentialityLevel) {
        values.add(doc.confidentialityLevel.toUpperCase());
      }
    });
    return Array.from(values);
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'ALL' && doc.type !== typeFilter) {
        return false;
      }
      if (
        confidentialityFilter !== 'ALL' &&
        doc.confidentialityLevel?.toUpperCase() !== confidentialityFilter
      ) {
        return false;
      }
      return true;
    });
  }, [confidentialityFilter, documents, search, typeFilter]);

  const handleUploadDemo = async () => {
    setUploading(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Document',
          type: typeFilter !== 'ALL' ? typeFilter : 'OTHER',
          confidentialityLevel: confidentialityFilter !== 'ALL' ? confidentialityFilter : 'INTERNAL',
        }),
      });

      if (response.ok) {
        toast.success('Document uploaded successfully');
        onUpdate();
      } else {
        toast.warning('Document API is not available in demo mode');
      }
    } catch (error) {
      console.error('Failed to upload document', error);
      toast.error('Unable to upload document in demo environment');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Documents
            </CardTitle>
            <CardDescription>
              Centralized view of pleadings, evidence, correspondence, and work product.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onUpdate} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleUploadDemo} disabled={uploading} className="gap-2">
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Uploading
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents"
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="h-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={value => setTypeFilter(value as typeof typeFilter)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Filter by document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    All document types
                  </div>
                </SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={confidentialityFilter}
              onValueChange={value => setConfidentialityFilter(value as typeof confidentialityFilter)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Filter by confidentiality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    All confidentiality levels
                  </div>
                </SelectItem>
                {confidentialityLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
              <div>
                <div className="font-medium text-gray-900">{documents.length}</div>
                <div>Total documents</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {documents.filter(doc => doc.confidentialityLevel?.toUpperCase() === 'PRIVILEGED').length}
                </div>
                <div>Privileged</div>
              </div>
            </div>
          </div>

          <Card className="border-dashed">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Confidentiality</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                          No documents match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredDocuments.map(document => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{document.title}</span>
                            <span className="text-xs text-muted-foreground">#{document.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {document.type?.toLowerCase().replace(/_/g, ' ') || 'unspecified'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={CONFIDENTIALITY_COLORS[document.confidentialityLevel?.toUpperCase() || ''] || ''}>
                            {document.confidentialityLevel?.replace(/_/g, ' ') || 'internal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {document.createdAt ? format(new Date(document.createdAt), 'MMM d, yyyy') : 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
