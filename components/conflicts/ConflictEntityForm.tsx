'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConflictEntitySchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Building, User, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ConflictEntityFormProps {
  entity?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ConflictEntityFormData {
  name: string;
  type: 'PERSON' | 'COMPANY' | 'ORGANIZATION' | 'GOVERNMENT' | 'OTHER';
  email?: string;
  phone?: string;
  address?: string;
  aliases?: string[];
  identifiers?: Array<{ type: string; value: string }>;
  description?: string;
  notes?: string;
  tags?: string[];
}

export function ConflictEntityForm({ entity, onSuccess, onCancel }: ConflictEntityFormProps) {
  const [loading, setLoading] = useState(false);
  const [aliases, setAliases] = useState<string[]>(entity?.aliases || ['']);
  const [identifiers, setIdentifiers] = useState<Array<{ type: string; value: string }>>(
    entity?.identifiers || [{ type: '', value: '' }]
  );
  const [tags, setTags] = useState<string[]>(entity?.tags || []);
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ConflictEntityFormData>({
    resolver: zodResolver(ConflictEntitySchema),
    defaultValues: {
      name: entity?.name || '',
      type: entity?.type || 'PERSON',
      email: entity?.email || '',
      phone: entity?.phone || '',
      address: entity?.address || '',
      description: entity?.description || '',
      notes: entity?.notes || '',
    },
  });

  const watchType = watch('type');

  const addAlias = () => {
    setAliases([...aliases, '']);
  };

  const updateAlias = (index: number, value: string) => {
    const updated = [...aliases];
    updated[index] = value;
    setAliases(updated);
    setValue('aliases', updated.filter(alias => alias.trim()));
  };

  const removeAlias = (index: number) => {
    const updated = aliases.filter((_, i) => i !== index);
    setAliases(updated);
    setValue('aliases', updated.filter(alias => alias.trim()));
  };

  const addIdentifier = () => {
    setIdentifiers([...identifiers, { type: '', value: '' }]);
  };

  const updateIdentifier = (index: number, field: 'type' | 'value', value: string) => {
    const updated = [...identifiers];
    updated[index][field] = value;
    setIdentifiers(updated);
    setValue('identifiers', updated.filter(id => id.type.trim() && id.value.trim()));
  };

  const removeIdentifier = (index: number) => {
    const updated = identifiers.filter((_, i) => i !== index);
    setIdentifiers(updated);
    setValue('identifiers', updated.filter(id => id.type.trim() && id.value.trim()));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updated = [...tags, newTag.trim()];
      setTags(updated);
      setValue('tags', updated);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    setValue('tags', updated);
  };

  const onSubmit = async (data: ConflictEntityFormData) => {
    try {
      setLoading(true);
      
      const formData = {
        ...data,
        aliases: aliases.filter(alias => alias.trim()),
        identifiers: identifiers.filter(id => id.type.trim() && id.value.trim()),
        tags,
      };

      const url = entity ? `/api/conflicts/entities/${entity.id}` : '/api/conflicts/entities';
      const method = entity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save entity');
      }

      toast.success(entity ? 'Entity updated successfully' : 'Entity created successfully');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Entity Name *</Label>
          <Input
            id="name"
            placeholder="Enter entity name"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Entity Type *</Label>
          <Select 
            onValueChange={(value) => setValue('type', value as any)}
            defaultValue={entity?.type || 'PERSON'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERSON">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Person
                </div>
              </SelectItem>
              <SelectItem value="COMPANY">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company
                </div>
              </SelectItem>
              <SelectItem value="ORGANIZATION">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Organization
                </div>
              </SelectItem>
              <SelectItem value="GOVERNMENT">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Government
                </div>
              </SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="entity@example.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="+1 (555) 123-4567"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          placeholder="Enter full address"
          {...register('address')}
          rows={2}
        />
        {errors.address && (
          <p className="text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Aliases / Alternative Names</Label>
          <Button type="button" variant="outline" size="sm" onClick={addAlias}>
            <Plus className="h-3 w-3 mr-1" />
            Add Alias
          </Button>
        </div>
        <div className="space-y-2">
          {aliases.map((alias, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Alternative name or alias"
                value={alias}
                onChange={(e) => updateAlias(index, e.target.value)}
                className="flex-1"
              />
              {aliases.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeAlias(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Add any known aliases, maiden names, or alternative spellings
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Identifiers</Label>
          <Button type="button" variant="outline" size="sm" onClick={addIdentifier}>
            <Plus className="h-3 w-3 mr-1" />
            Add Identifier
          </Button>
        </div>
        <div className="space-y-2">
          {identifiers.map((identifier, index) => (
            <div key={index} className="flex gap-2">
              <Select
                value={identifier.type}
                onValueChange={(value) => updateIdentifier(index, 'type', value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SSN">SSN</SelectItem>
                  <SelectItem value="EIN">EIN</SelectItem>
                  <SelectItem value="Driver_License">Driver's License</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="BAR_NUMBER">Bar Number</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Identifier value"
                value={identifier.value}
                onChange={(e) => updateIdentifier(index, 'value', e.target.value)}
                className="flex-1"
              />
              {identifiers.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeIdentifier(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Add identifying numbers like SSN, EIN, license numbers, etc.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the entity and their role"
          {...register('description')}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea
          id="notes"
          placeholder="Internal notes about this entity"
          {...register('notes')}
          rows={3}
        />
        {errors.notes && (
          <p className="text-sm text-red-500">{errors.notes.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer">
                {tag}
                <X 
                  className="h-3 w-3 ml-1" 
                  onClick={() => removeTag(tag)} 
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {getEntityIcon(watchType)}
          <span className="ml-2">
            {loading 
              ? (entity ? 'Updating...' : 'Creating...') 
              : (entity ? 'Update Entity' : 'Create Entity')
            }
          </span>
        </Button>
      </div>
    </form>
  );
}