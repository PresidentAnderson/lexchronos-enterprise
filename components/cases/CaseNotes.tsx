'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, ListTodo, Plus, RefreshCcw, StickyNote, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/useToast';

interface CaseNote {
  id: string;
  content: string;
  createdAt: string;
  author?: {
    firstName: string;
    lastName: string;
  };
  tags?: string[];
  category?: string;
}

interface CaseNotesProps {
  caseId: string;
  onUpdate: () => void;
}

export function CaseNotes({ caseId, onUpdate }: CaseNotesProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'recent' | 'tags'>('recent');
  const [newNote, setNewNote] = useState({ content: '', tags: '', category: 'General' });
  const [saving, setSaving] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>('');

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.data?.notes ?? []);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.warn('Unable to load case notes in demo mode', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredNotes = useMemo(() => {
    if (!tagFilter) {
      return notes;
    }
    return notes.filter(note => note.tags?.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())));
  }, [notes, tagFilter]);

  const tagCloud = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach(note => {
      note.tags?.forEach(tag => {
        const normalized = tag.toLowerCase();
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [notes]);

  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      toast.warning('Please enter a note before saving.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote.content,
          tags: newNote.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean),
          category: newNote.category,
        }),
      });

      if (response.ok) {
        toast.success('Note saved successfully');
        setNewNote({ content: '', tags: '', category: newNote.category });
        await loadNotes();
        onUpdate();
      } else {
        toast.warning('Notes API is unavailable in demo mode.');
      }
    } catch (error) {
      console.error('Failed to save note', error);
      toast.error('Unable to save note in demo environment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Matter Notes
            </CardTitle>
            <CardDescription>
              Capture privileged insights, strategy, and meeting minutes in one workspace.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadNotes} disabled={loading} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleAddNote} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Saving
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Note
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={tab} onValueChange={value => setTab(value as typeof tab)}>
            <TabsList className="grid w-full grid-cols-2 lg:w-1/3">
              <TabsTrigger value="recent" className="gap-2">
                <ListTodo className="h-4 w-4" /> Recent notes
              </TabsTrigger>
              <TabsTrigger value="tags" className="gap-2">
                <Tag className="h-4 w-4" /> Tag cloud
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="pt-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">Add note</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      rows={6}
                      placeholder="Record hearing prep, client requests, or internal updates"
                      value={newNote.content}
                      onChange={event => setNewNote(prev => ({ ...prev, content: event.target.value }))}
                    />
                    <Input
                      placeholder="Tags (comma separated)"
                      value={newNote.tags}
                      onChange={event => setNewNote(prev => ({ ...prev, tags: event.target.value }))}
                    />
                    <Input
                      placeholder="Category"
                      value={newNote.category}
                      onChange={event => setNewNote(prev => ({ ...prev, category: event.target.value }))}
                    />
                    <Button onClick={handleAddNote} disabled={saving} className="gap-2">
                      {saving ? 'Saving...' : 'Save note'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Filter className="h-5 w-5" /> Filter notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Filter by tag"
                      value={tagFilter}
                      onChange={event => setTagFilter(event.target.value)}
                    />
                    <ScrollArea className="max-h-[320px]">
                      <div className="space-y-3">
                        {filteredNotes.length === 0 && (
                          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                            No notes found. Add one to get started.
                          </div>
                        )}
                        {filteredNotes.map(note => (
                          <div key={note.id} className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Paralegal'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                                </div>
                              </div>
                              <Badge variant="secondary" className="capitalize">
                                {note.category || 'General'}
                              </Badge>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{note.content}</p>
                            {note.tags && note.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {note.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="uppercase tracking-wide">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="pt-4">
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="h-5 w-5" /> Tag insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tagCloud.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No tags available yet. Add tags to your notes to build reporting.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {tagCloud.map(([tag, count]) => (
                        <Badge key={tag} className="bg-slate-900 text-white">
                          #{tag}{' '}
                          <span className="ml-1 rounded-full bg-white/20 px-2 text-xs">{count}</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
