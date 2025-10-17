import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/jwt';
import { ConflictEntitySchema } from '@/lib/validation/schemas';

// GET /api/conflicts/entities - Get all conflict entities for organization
export async function GET(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      organizationId: user.organizationId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [entities, total] = await Promise.all([
      prisma.conflictEntity.findMany({
        where,
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
          _count: {
            select: {
              conflicts: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.conflictEntity.count({ where }),
    ]);

    return NextResponse.json({
      entities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conflict entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflict entities' },
      { status: 500 }
    );
  }
}

// POST /api/conflicts/entities - Create new conflict entity
export async function POST(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ConflictEntitySchema.parse(body);

    // Check for existing entity with same name
    const existingEntity = await prisma.conflictEntity.findFirst({
      where: {
        organizationId: user.organizationId,
        name: validatedData.name,
        isActive: true,
      },
    });

    if (existingEntity) {
      return NextResponse.json(
        { error: 'Entity with this name already exists' },
        { status: 409 }
      );
    }

    const entity = await prisma.conflictEntity.create({
      data: {
        ...validatedData,
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
      },
    });

    return NextResponse.json({ entity }, { status: 201 });
  } catch (error) {
    console.error('Error creating conflict entity:', error);
    return NextResponse.json(
      { error: 'Failed to create conflict entity' },
      { status: 500 }
    );
  }
}