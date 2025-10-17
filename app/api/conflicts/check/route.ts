import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/jwt';
import { ConflictCheckSchema } from '@/lib/validation/schemas';

// POST /api/conflicts/check - Perform conflict check
export async function POST(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ConflictCheckSchema.parse(body);

    // Create the conflict check record
    const organizationId = user.organizationId ?? user.firmId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
    }

    const conflictCheck = await prisma.conflictCheck.create({
      data: {
        checkType: validatedData.checkType,
        entityId: validatedData.entityId,
        caseId: validatedData.caseId,
        searchTerms: validatedData.searchTerms,
        searchScope: validatedData.searchScope || 'FULL',
        organizationId,
        performedById: user.id,
        status: 'IN_PROGRESS',
      },
    });

    // Perform the actual conflict search
    const conflictResults = await performConflictSearch(
      organizationId,
      validatedData.searchTerms,
      validatedData.searchScope || 'FULL',
      validatedData.entityId
    );

    // Update the conflict check with results
    const updatedCheck = await prisma.conflictCheck.update({
      where: { id: conflictCheck.id },
      data: {
        potentialConflicts: conflictResults.conflicts,
        conflictLevel: determineConflictLevel(conflictResults.conflicts),
        status: conflictResults.conflicts.length > 0 ? 'CONFLICT_IDENTIFIED' : 'CLEARED',
        resolution: conflictResults.conflicts.length > 0 ? 'PENDING' : 'CLEARED',
      },
      include: {
        entity: true,
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
    });

    return NextResponse.json({ conflictCheck: updatedCheck });
  } catch (error) {
    console.error('Error performing conflict check:', error);
    return NextResponse.json(
      { error: 'Failed to perform conflict check' },
      { status: 500 }
    );
  }
}

// GET /api/conflicts/check - Get conflict check history
export async function GET(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const entityId = searchParams.get('entityId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const organizationId = user.organizationId ?? user.firmId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
    }

    const where: any = {
      organizationId,
    };

    if (caseId) {
      where.caseId = caseId;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (status) {
      where.status = status;
    }

    const [checks, total] = await Promise.all([
      prisma.conflictCheck.findMany({
        where,
        include: {
          entity: true,
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              clientName: true,
            },
          },
          performedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.conflictCheck.count({ where }),
    ]);

    return NextResponse.json({
      checks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conflict checks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflict checks' },
      { status: 500 }
    );
  }
}

// Helper function to perform the actual conflict search
async function performConflictSearch(
  organizationId: string,
  searchTerms: string[],
  scope: string,
  excludeEntityId?: string
): Promise<{ conflicts: any[] }> {
  const conflicts: any[] = [];

  // Search for matching entities
  for (const term of searchTerms) {
    const matchingEntities = await prisma.conflictEntity.findMany({
      where: {
        organizationId,
        isActive: true,
        id: excludeEntityId ? { not: excludeEntityId } : undefined,
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
          { address: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
      include: {
        relationships: {
          include: {
            toEntity: true,
          },
        },
      },
    });

    for (const entity of matchingEntities) {
      conflicts.push({
        type: 'DIRECT_MATCH',
        entity: entity,
        searchTerm: term,
        matchField: determineMatchField(entity, term),
        riskLevel: 'HIGH',
        description: `Direct match found for "${term}"`,
      });
    }

    // Search for related entities if scope includes them
    if (scope === 'RELATED_ENTITIES' || scope === 'FULL') {
      const relatedEntities = await findRelatedEntities(
        organizationId,
        matchingEntities.map((entity: { id: string }) => entity.id)
      );
      for (const related of relatedEntities) {
        conflicts.push({
          type: 'RELATED_ENTITY',
          entity: related.entity,
          relationship: related.relationship,
          searchTerm: term,
          riskLevel: related.relationship.strength === 'CRITICAL' ? 'HIGH' : 
                    related.relationship.strength === 'STRONG' ? 'MEDIUM' : 'LOW',
          description: `Related entity through ${related.relationship.type} relationship`,
        });
      }
    }

    // Search existing cases for potential conflicts
    if (scope === 'FULL') {
      const caseConflicts = await findCaseConflicts(organizationId, term, excludeEntityId);
      conflicts.push(...caseConflicts);
    }
  }

  return { conflicts };
}

// Helper function to determine match field
function determineMatchField(entity: any, term: string): string {
  const lowerTerm = term.toLowerCase();
  if (entity.name.toLowerCase().includes(lowerTerm)) return 'name';
  if (entity.email?.toLowerCase().includes(lowerTerm)) return 'email';
  if (entity.phone?.toLowerCase().includes(lowerTerm)) return 'phone';
  if (entity.address?.toLowerCase().includes(lowerTerm)) return 'address';
  if (entity.description?.toLowerCase().includes(lowerTerm)) return 'description';
  return 'unknown';
}

// Helper function to find related entities
async function findRelatedEntities(organizationId: string, entityIds: string[]): Promise<any[]> {
  const relationships = await prisma.conflictRelationship.findMany({
    where: {
      OR: [
        { fromEntityId: { in: entityIds } },
        { toEntityId: { in: entityIds } },
      ],
      isActive: true,
    },
    include: {
      fromEntity: true,
      toEntity: true,
    },
  });

  return relationships.map((rel: { fromEntityId: string; toEntity: any; fromEntity: any }) => ({
    entity: rel.fromEntityId in entityIds ? rel.toEntity : rel.fromEntity,
    relationship: rel,
  }));
}

// Helper function to find case conflicts
async function findCaseConflicts(organizationId: string, term: string, excludeEntityId?: string): Promise<any[]> {
  const cases = await prisma.case.findMany({
    where: {
      organizationId,
      OR: [
        { clientName: { contains: term, mode: 'insensitive' } },
        { clientEmail: { contains: term, mode: 'insensitive' } },
        { opposingParty: { contains: term, mode: 'insensitive' } },
        { opposingCounsel: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      caseNumber: true,
      title: true,
      clientName: true,
      opposingParty: true,
      status: true,
    },
  });

  return cases.map((case_: Record<string, unknown>) => ({
    type: 'CASE_CONFLICT',
    case: case_,
    searchTerm: term,
    riskLevel: case_.status === 'ACTIVE' ? 'HIGH' : 'MEDIUM',
    description: `Potential conflict with existing case: ${case_.caseNumber}`,
  }));
}

// Helper function to determine conflict level
function determineConflictLevel(conflicts: any[]): string {
  if (conflicts.length === 0) return 'NONE';
  
  const hasHighRisk = conflicts.some(c => c.riskLevel === 'HIGH');
  const hasMediumRisk = conflicts.some(c => c.riskLevel === 'MEDIUM');
  
  if (hasHighRisk) return 'HIGH';
  if (hasMediumRisk) return 'MEDIUM';
  return 'LOW';
}