'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Phone, Plus, RefreshCcw, Search, ShieldCheck, User } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface CaseContact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email?: string;
  phone?: string;
}

interface RelatedPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface CaseContactsProps {
  caseId: string;
  contacts: CaseContact[];
  client: RelatedPerson;
  assignedAttorney?: RelatedPerson;
  onUpdate: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  CLIENT: 'bg-blue-100 text-blue-800',
  ATTORNEY: 'bg-purple-100 text-purple-800',
  WITNESS: 'bg-orange-100 text-orange-800',
  OPPOSING_COUNSEL: 'bg-red-100 text-red-800',
  VENDOR: 'bg-emerald-100 text-emerald-800',
};

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase() || '??';
}

export function CaseContacts({ caseId, contacts, client, assignedAttorney, onUpdate }: CaseContactsProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | string>('ALL');
  const [adding, setAdding] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    role: 'WITNESS',
    email: '',
    phone: '',
  });

  const uniqueRoles = useMemo(() => {
    const values = new Set<string>();
    contacts.forEach(contact => {
      if (contact.role) {
        values.add(contact.role.toUpperCase());
      }
    });
    return Array.from(values);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = `${contact.firstName} ${contact.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase());
      if (!matchesSearch) {
        return false;
      }
      if (roleFilter !== 'ALL' && contact.role.toUpperCase() !== roleFilter) {
        return false;
      }
      return true;
    });
  }, [contacts, roleFilter, search]);

  const handleAddContact = async () => {
    if (!newContact.firstName || !newContact.lastName) {
      toast.warning('Please provide a first and last name.');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });

      if (response.ok) {
        toast.success('Contact added successfully');
        setNewContact({ firstName: '', lastName: '', role: 'WITNESS', email: '', phone: '' });
        onUpdate();
      } else {
        toast.warning('Contact API is unavailable in demo mode.');
      }
    } catch (error) {
      console.error('Failed to add contact', error);
      toast.error('Unable to add contact in demo environment');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Relationship Graph
            </CardTitle>
            <CardDescription>
              Maintain a single source of truth for all stakeholders connected to the matter.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onUpdate} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleAddContact} disabled={adding} className="gap-2">
              {adding ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Saving
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Contact
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5" /> Primary Client
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold uppercase text-blue-600">
                  {getInitials(client.firstName, client.lastName)}
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {client.firstName} {client.lastName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </div>
                  )}
                  <Badge className="mt-2 bg-blue-100 text-blue-800">Client</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5" /> Lead Counsel
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-lg font-semibold uppercase text-purple-600">
                  {getInitials(assignedAttorney?.firstName, assignedAttorney?.lastName)}
                </div>
                <div>
                  {assignedAttorney ? (
                    <>
                      <div className="text-base font-semibold text-gray-900">
                        {assignedAttorney.firstName} {assignedAttorney.lastName}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {assignedAttorney.email}
                      </div>
                      {assignedAttorney.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {assignedAttorney.phone}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No attorney assigned yet.
                    </div>
                  )}
                  <Badge className="mt-2 bg-purple-100 text-purple-800">Attorney</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" /> Add Supporting Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">First name</Label>
                    <Input
                      className="mt-1 h-9"
                      value={newContact.firstName}
                      onChange={event => setNewContact(prev => ({ ...prev, firstName: event.target.value }))}
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Last name</Label>
                    <Input
                      className="mt-1 h-9"
                      value={newContact.lastName}
                      onChange={event => setNewContact(prev => ({ ...prev, lastName: event.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input
                      className="mt-1 h-9"
                      type="email"
                      value={newContact.email}
                      onChange={event => setNewContact(prev => ({ ...prev, email: event.target.value }))}
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <Input
                      className="mt-1 h-9"
                      value={newContact.phone}
                      onChange={event => setNewContact(prev => ({ ...prev, phone: event.target.value }))}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <Select
                    value={newContact.role}
                    onValueChange={value => setNewContact(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {['CLIENT', 'ATTORNEY', 'WITNESS', 'OPPOSING_COUNSEL', 'VENDOR'].map(role => (
                        <SelectItem key={role} value={role}>
                          <Badge className={`${ROLE_COLORS[role]} uppercase`}>{role.replace('_', ' ')}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddContact} disabled={adding} className="gap-2">
                  {adding ? 'Saving...' : 'Add Contact'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search contacts"
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="h-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={value => setRoleFilter(value as typeof roleFilter)}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    All roles
                  </div>
                </SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    <Badge className={`${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-800'} uppercase`}>
                      {role.replace('_', ' ')}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                      No contacts match the current filters.
                    </TableCell>
                  </TableRow>
                )}
                {filteredContacts.map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold uppercase text-gray-600">
                          {getInitials(contact.firstName, contact.lastName)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">#{contact.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${ROLE_COLORS[contact.role?.toUpperCase() ?? ''] ?? 'bg-gray-100 text-gray-800'} uppercase`}>
                        {contact.role?.replace('_', ' ') || 'Associated'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.email || 'Not provided'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.phone || 'Not provided'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
