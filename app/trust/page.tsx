'use client';

import React from 'react';
import { TrustDashboard } from '@/components/trust/TrustDashboard';

export default function TrustPage() {
  // In a real app, you would get this from your auth context
  const organizationId = 'temp-org-id';

  return (
    <div className="container mx-auto py-6">
      <TrustDashboard organizationId={organizationId} />
    </div>
  );
}