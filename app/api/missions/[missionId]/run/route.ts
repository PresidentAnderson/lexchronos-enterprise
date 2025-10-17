import { NextRequest, NextResponse } from 'next/server';
import { runMission } from '@/lib/merv/service';

interface Params {
  params: {
    missionId: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { missionId } = params;

    if (!missionId) {
      return NextResponse.json(
        { success: false, error: 'missionId is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const limit = typeof body.limit === 'number' ? body.limit : undefined;

    const result = await runMission({ missionId, limit });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to execute mission run', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute mission run' },
      { status: 500 }
    );
  }
}
