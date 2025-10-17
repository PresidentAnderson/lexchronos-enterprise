import { NextRequest, NextResponse } from 'next/server';
import { createMissionProfile } from '@/lib/merv/service';
import type { MissionProfileInput } from '@/lib/merv/types';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MissionProfileInput;

    if (!payload.organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      );
    }

    if (!payload.jurisdiction) {
      return NextResponse.json(
        { success: false, error: 'jurisdiction is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(payload.claims) || payload.claims.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one claim is required' },
        { status: 400 }
      );
    }

    const mission = await createMissionProfile({
      ...payload,
      claims: payload.claims.map(claim => ({
        ...claim,
        weight: claim.weight ?? 1
      }))
    });

    return NextResponse.json({ success: true, data: mission });
  } catch (error) {
    console.error('Failed to create mission', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mission' },
      { status: 500 }
    );
  }
}
