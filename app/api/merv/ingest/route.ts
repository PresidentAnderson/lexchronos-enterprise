import { NextRequest, NextResponse } from 'next/server';
import { ingestMissionEvidence } from '@/lib/merv/service';
import type { RawDocumentPayload } from '@/lib/merv/types';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RawDocumentPayload;

    if (!payload.documentId) {
      return NextResponse.json(
        { success: false, error: 'documentId is required' },
        { status: 400 }
      );
    }

    const result = await ingestMissionEvidence(payload);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to ingest mission evidence', error);
    return NextResponse.json(
      { success: false, error: 'Failed to ingest mission evidence' },
      { status: 500 }
    );
  }
}
