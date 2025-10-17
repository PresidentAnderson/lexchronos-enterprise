import { NextRequest, NextResponse } from 'next/server';
import { planMission } from '@/lib/merv/service';

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

    const plan = await planMission({ missionId });

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    console.error('Failed to generate mission plan', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate mission plan' },
      { status: 500 }
    );
  }
}
