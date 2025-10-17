import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/jwt';

// GET /api/conflicts/stats - Get conflict dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all statistics in parallel
    const [
      totalChecks,
      pendingChecks,
      conflictsIdentified,
      waiversPending,
      entitiesCount,
      recentActivity
    ] = await Promise.all([
      // Total conflict checks
      prisma.conflictCheck.count({
        where: { organizationId: user.organizationId }
      }),

      // Pending checks (requiring review)
      prisma.conflictCheck.count({
        where: {
          organizationId: user.organizationId,
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        }
      }),

      // Conflicts identified (high risk cases)
      prisma.conflictCheck.count({
        where: {
          organizationId: user.organizationId,
          status: 'CONFLICT_IDENTIFIED'
        }
      }),

      // Waivers pending
      prisma.conflictCheck.count({
        where: {
          organizationId: user.organizationId,
          status: 'WAIVER_REQUIRED'
        }
      }),

      // Total entities in database
      prisma.conflictEntity.count({
        where: {
          organizationId: user.organizationId,
          isActive: true
        }
      }),

      // Recent activity (last 30 days)
      prisma.conflictCheck.findMany({
        where: {
          organizationId: user.organizationId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        },
        include: {
          case: {
            select: {
              caseNumber: true,
              title: true,
              clientName: true
            }
          },
          entity: {
            select: {
              name: true,
              type: true
            }
          },
          performedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Calculate additional metrics
    const checksThisMonth = await prisma.conflictCheck.count({
      where: {
        organizationId: user.organizationId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    const conflictRate = totalChecks > 0 
      ? ((conflictsIdentified / totalChecks) * 100).toFixed(1)
      : '0.0';

    // Get conflict level distribution
    const conflictLevels = await prisma.conflictCheck.groupBy({
      by: ['conflictLevel'],
      where: {
        organizationId: user.organizationId
      },
      _count: {
        conflictLevel: true
      }
    });

    // Get check types distribution
    const checkTypes = await prisma.conflictCheck.groupBy({
      by: ['checkType'],
      where: {
        organizationId: user.organizationId
      },
      _count: {
        checkType: true
      }
    });

    // Get entity types distribution
    const entityTypes = await prisma.conflictEntity.groupBy({
      by: ['type'],
      where: {
        organizationId: user.organizationId,
        isActive: true
      },
      _count: {
        type: true
      }
    });

    return NextResponse.json({
      totalChecks,
      pendingChecks,
      conflictsIdentified,
      waiversPending,
      entitiesCount,
      checksThisMonth,
      conflictRate: parseFloat(conflictRate),
      recentActivity,
      distributions: {
        conflictLevels: conflictLevels.reduce((
          acc: Record<string, number>,
          item: { conflictLevel: string; _count: { conflictLevel: number } }
        ) => {
          acc[item.conflictLevel] = item._count.conflictLevel;
          return acc;
        }, {} as Record<string, number>),
        checkTypes: checkTypes.reduce((
          acc: Record<string, number>,
          item: { checkType: string; _count: { checkType: number } }
        ) => {
          acc[item.checkType] = item._count.checkType;
          return acc;
        }, {} as Record<string, number>),
        entityTypes: entityTypes.reduce((
          acc: Record<string, number>,
          item: { type: string; _count: { type: number } }
        ) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error fetching conflict stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflict statistics' },
      { status: 500 }
    );
  }
}