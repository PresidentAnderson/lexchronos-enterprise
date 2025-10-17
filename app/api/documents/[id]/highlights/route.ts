import { NextRequest, NextResponse } from 'next/server';
import { fetchDocumentHighlights } from '@/lib/merv/service';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document id is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId') || undefined;

    const highlights = await fetchDocumentHighlights(id, missionId);

    return NextResponse.json({ success: true, data: highlights });
  } catch (error) {
    console.error('Failed to fetch document highlights', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document highlights' },
      { status: 500 }
    );
  }
}
