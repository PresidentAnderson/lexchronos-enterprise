import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth/jwt';
import { ConflictEntityUpdateSchema } from '@/lib/validation/schemas';

const prisma = new PrismaClient();

// GET /api/conflicts/entities/[id] - Get specific conflict entity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entity = await prisma.conflictEntity.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        relationships: {
          include: {
            toEntity: true,
          },
        },
        relatedTo: {
          include: {
            fromEntity: true,
          },
        },
        conflicts: {
          include: {
            case: true,
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entity });
  } catch (error) {
    console.error('Error fetching conflict entity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflict entity' },
      { status: 500 }
    );
  }
}

// PUT /api/conflicts/entities/[id] - Update conflict entity
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ConflictEntityUpdateSchema.parse(body);

    const entity = await prisma.conflictEntity.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    const updatedEntity = await prisma.conflictEntity.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        relationships: {
          include: {
            toEntity: true,
          },
        },
        relatedTo: {
          include: {
            fromEntity: true,
          },
        },
      },
    });

    return NextResponse.json({ entity: updatedEntity });
  } catch (error) {
    console.error('Error updating conflict entity:', error);
    return NextResponse.json(
      { error: 'Failed to update conflict entity' },
      { status: 500 }
    );
  }
}

// DELETE /api/conflicts/entities/[id] - Soft delete conflict entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entity = await prisma.conflictEntity.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    });

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.conflictEntity.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Entity deleted successfully' });
  } catch (error) {
    console.error('Error deleting conflict entity:', error);
    return NextResponse.json(
      { error: 'Failed to delete conflict entity' },
      { status: 500 }
    );
  }
}