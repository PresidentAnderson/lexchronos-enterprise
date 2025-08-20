'use client';

import React from 'react';
import { ConflictDashboard } from '@/components/conflicts/ConflictDashboard';

export default function ConflictsPage() {
  // In a real app, you would get this from your auth context
  const organizationId = 'temp-org-id';

  return (
    <div className="container mx-auto py-6">
      <ConflictDashboard organizationId={organizationId} />
    </div>
  );
}