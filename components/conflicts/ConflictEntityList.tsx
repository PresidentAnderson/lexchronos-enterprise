'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, User, Globe, Search, Edit, Trash2, Eye, Plus, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConflictEntityForm } from './ConflictEntityForm';
import { format } from 'date-fns';

interface ConflictEntity {
  id: string;
  name: string;
  type: string;
  email?: string;
  phone?: string;
  address?: string;
  aliases?: string[];
  tags?: string[];
  description?: string;
  createdAt: string;
  _count: {
    conflicts: number;
  };
  relationships: Array<{
    toEntity: {
      name: string;
      type: string;
    };
    type: string;
  }>;
}

export function ConflictEntityList() {
  const [entities, setEntities] = useState<ConflictEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEntity, setSelectedEntity] = useState<ConflictEntity | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadEntities();
  }, [page, typeFilter]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (typeFilter) params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/conflicts/entities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEntities(data.entities);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadEntities();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setPage(1);
    loadEntities();
  };

  const handleEdit = (entity: ConflictEntity) => {
    setSelectedEntity(entity);
    setShowEditDialog(true);
  };

  const handleView = (entity: ConflictEntity) => {
    setSelectedEntity(entity);
    setShowViewDialog(true);
  };

  const handleDelete = async (entityId: string) => {
    if (confirm('Are you sure you want to delete this entity?')) {
      try {
        const response = await fetch(`/api/conflicts/entities/${entityId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          loadEntities();
        }
      } catch (error) {
        console.error('Error deleting entity:', error);
      }
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'PERSON':
        return <User className="h-4 w-4" />;
      case 'COMPANY':
      case 'ORGANIZATION':
        return <Building className="h-4 w-4" />;
      case 'GOVERNMENT':
        return <Globe className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  const getEntityTypeBadge = (type: string) => {
    const colors = {
      PERSON: 'bg-blue-100 text-blue-800',
      COMPANY: 'bg-green-100 text-green-800',
      ORGANIZATION: 'bg-purple-100 text-purple-800',
      GOVERNMENT: 'bg-gray-100 text-gray-800',
      OTHER: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || colors.OTHER}>
        {getEntityIcon(type)}
        <span className="ml-1">{type}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Entity Database</CardTitle>
          <CardDescription>
            Manage entities in the conflict checking database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="PERSON">Person</SelectItem>
                <SelectItem value="COMPANY">Company</SelectItem>
                <SelectItem value="ORGANIZATION">Organization</SelectItem>
                <SelectItem value="GOVERNMENT">Government</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button onClick={resetFilters} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Relationships</TableHead>
                  <TableHead>Conflicts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Loading entities...
                    </TableCell>
                  </TableRow>
                ) : entities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No entities found
                    </TableCell>
                  </TableRow>
                ) : (
                  entities.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{entity.name}</div>
                          {entity.aliases && entity.aliases.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Aliases: {entity.aliases.slice(0, 2).join(', ')}
                              {entity.aliases.length > 2 && '...'}
                            </div>
                          )}
                          {entity.tags && entity.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {entity.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {entity.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{entity.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEntityTypeBadge(entity.type)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {entity.email && (
                            <div className="text-blue-600">{entity.email}</div>
                          )}
                          {entity.phone && (
                            <div className="text-muted-foreground">{entity.phone}</div>
                          )}
                          {entity.address && (
                            <div className="text-muted-foreground text-xs">
                              {entity.address.length > 30 
                                ? `${entity.address.substring(0, 30)}...` 
                                : entity.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {entity.relationships.length > 0 ? (
                            <div className="space-y-1">
                              {entity.relationships.slice(0, 2).map((rel, index) => (
                                <div key={index} className="text-xs">
                                  {rel.type}: {rel.toEntity.name}
                                </div>
                              ))}
                              {entity.relationships.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{entity.relationships.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entity._count.conflicts > 0 ? "secondary" : "outline"}>
                          {entity._count.conflicts}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entity.createdAt), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(entity)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entity)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entity.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} entities
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Entity</DialogTitle>
            <DialogDescription>
              Update entity information in the conflict database.
            </DialogDescription>
          </DialogHeader>
          {selectedEntity && (
            <ConflictEntityForm
              entity={selectedEntity}
              onSuccess={() => {
                setShowEditDialog(false);
                loadEntities();
              }}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Entity Details</DialogTitle>
            <DialogDescription>
              View complete entity information and conflict history.
            </DialogDescription>
          </DialogHeader>
          {selectedEntity && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p>{selectedEntity.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div>{getEntityTypeBadge(selectedEntity.type)}</div>
                </div>
              </div>

              {(selectedEntity.email || selectedEntity.phone) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedEntity.email && (
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-blue-600">{selectedEntity.email}</p>
                    </div>
                  )}
                  {selectedEntity.phone && (
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p>{selectedEntity.phone}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedEntity.address && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p>{selectedEntity.address}</p>
                </div>
              )}

              {selectedEntity.aliases && selectedEntity.aliases.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Aliases</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedEntity.aliases.map((alias) => (
                      <Badge key={alias} variant="outline">{alias}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntity.tags && selectedEntity.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1">
                    {selectedEntity.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntity.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p>{selectedEntity.description}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Statistics</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedEntity._count.conflicts}</div>
                    <div className="text-sm text-muted-foreground">Conflicts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedEntity.relationships.length}</div>
                    <div className="text-sm text-muted-foreground">Relationships</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {format(new Date(selectedEntity.createdAt), 'MMM yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">Added</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className || ''}`}>{children}</label>;
}