import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';
import {
  OffenceAutomationAction,
  OffenceAutomationTrigger,
  OffenceElementType,
  OffenceModuleCategory,
  OffenceSeverity,
  OffenceWitnessType,
  OffenceExhibitStatus
} from '@prisma/client';

const createModuleSchema = z.object({
  sectionCode: z.string().min(2).max(32),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  category: z.nativeEnum(OffenceModuleCategory),
  severity: z.nativeEnum(OffenceSeverity),
  statuteReference: z.string().optional(),
  organizationId: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).max(25).optional(),
  elements: z
    .array(
      z.object({
        label: z.string().min(1),
        description: z.string().min(1),
        elementType: z.nativeEnum(OffenceElementType),
        essential: z.boolean().optional(),
        weight: z.number().int().min(1).max(10).optional(),
        statuteReference: z.string().optional(),
        baselineScore: z.number().min(0).max(1).optional(),
        checklist: z.record(z.any()).optional()
      })
    )
    .min(1)
    .max(30),
  witnesses: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().optional(),
        witnessType: z.nativeEnum(OffenceWitnessType).optional(),
        contact: z.record(z.any()).optional(),
        notes: z.string().optional()
      })
    )
    .optional(),
  exhibits: z
    .array(
      z.object({
        label: z.string().min(1),
        description: z.string().optional(),
        exhibitType: z.string().optional(),
        storagePath: z.string().optional(),
        authenticityStatus: z.nativeEnum(OffenceExhibitStatus).optional(),
        chainOfCustody: z.record(z.any()).optional(),
        metadata: z.record(z.any()).optional()
      })
    )
    .optional(),
  automationHooks: z
    .array(
      z.object({
        trigger: z.nativeEnum(OffenceAutomationTrigger),
        action: z.nativeEnum(OffenceAutomationAction),
        isActive: z.boolean().optional(),
        payload: z.record(z.any()).optional()
      })
    )
    .optional()
});

function buildInclude(options: {
  includeElements: boolean;
  includeHeatmap: boolean;
  includeWitnesses: boolean;
  includeExhibits: boolean;
  includeAutomation: boolean;
}) {
  const include: Record<string, unknown> = {};

  if (options.includeElements || options.includeHeatmap) {
    include.elements = {
      orderBy: { weight: 'desc' as const },
      include: options.includeHeatmap
        ? {
            heatmapEntries: {
              orderBy: { updatedAt: 'desc' as const },
              include: {
                case: {
                  select: {
                    id: true,
                    caseNumber: true,
                    title: true,
                    status: true
                  }
                },
                updatedBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        : undefined
    };
  }

  if (options.includeWitnesses) {
    include.witnesses = {
      include: {
        elementLinks: options.includeElements || options.includeHeatmap
          ? {
              include: {
                element: {
                  select: {
                    id: true,
                    label: true,
                    elementType: true
                  }
                }
              }
            }
          : undefined
      }
    };
  }

  if (options.includeExhibits) {
    include.exhibits = {
      include: {
        elementLinks: options.includeElements || options.includeHeatmap
          ? {
              include: {
                element: {
                  select: {
                    id: true,
                    label: true,
                    elementType: true
                  }
                }
              }
            }
          : undefined
      }
    };
  }

  if (options.includeAutomation) {
    include.automationHooks = true;
  }

  return include;
}

export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url);
    const sectionCode = searchParams.get('sectionCode') ?? undefined;

    // SECURITY: Use authenticated user's organization for filtering
    const userOrganizationId = user.organizationId;
    const category = searchParams.get('category') ?? undefined;
    const severity = searchParams.get('severity') ?? undefined;
    const search = searchParams.get('search') ?? undefined;
    const includeElements = searchParams.get('includeElements') === 'true';
    const includeWitnesses = searchParams.get('includeWitnesses') === 'true';
    const includeExhibits = searchParams.get('includeExhibits') === 'true';
    const includeHeatmap = searchParams.get('includeHeatmap') === 'true';
    const includeAutomation = searchParams.get('includeAutomation') === 'true';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '25', 10), 1),
      100
    );

    const where: Record<string, unknown> = {};

    if (sectionCode) {
      where.sectionCode = sectionCode;
    }

    // SECURITY: Filter by user's organization or show only public modules
    if (userOrganizationId) {
      where.OR = [
        { organizationId: userOrganizationId },
        { organizationId: null } // Public/global modules
      ];
    } else {
      where.organizationId = null; // Only public modules if no org
    }

    if (category) {
      where.category = category;
    }

    if (severity) {
      where.severity = severity;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const include = buildInclude({
      includeElements,
      includeHeatmap,
      includeWitnesses,
      includeExhibits,
      includeAutomation
    });

    const [modules, total] = await Promise.all([
      prisma.priorityOffenceModule.findMany({
        where,
        include: Object.keys(include).length > 0 ? (include as any) : undefined,
        orderBy: { sectionCode: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.priorityOffenceModule.count({ where })
    ]);

    const moduleSummaries = modules.map((module) => {
      const elements = module.elements ?? [];
      const heatmapEntries = elements.flatMap((element: any) => element.heatmapEntries ?? []);

      const averageCoverage =
        heatmapEntries.length > 0
          ? heatmapEntries.reduce(
              (sum: number, entry: { coverageScore: number }) =>
                sum + entry.coverageScore,
              0
            ) / heatmapEntries.length
          : 0;

      const atRisk = heatmapEntries.filter(
        (entry: { status: string }) => entry.status === 'AT_RISK' || entry.status === 'BLOCKED'
      ).length;

      const ready = heatmapEntries.filter(
        (entry: { status: string }) => entry.status === 'READY' || entry.status === 'VERIFIED'
      ).length;

      return {
        moduleId: module.id,
        sectionCode: module.sectionCode,
        trackedElements: elements.length,
        averageCoverage,
        atRiskElements: atRisk,
        readyElements: ready
      };
    });

    return NextResponse.json({
      success: true,
      data: modules,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summaries: moduleSummaries
      }
    });
  } catch (error) {
    console.error('Error fetching priority offence modules:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    // SECURITY: Only admins can create priority offence modules
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can create priority offence modules' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createModuleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      elements,
      witnesses,
      exhibits,
      automationHooks,
      tags,
      organizationId,
      ...moduleData
    } = parsed.data;

    // SECURITY: Use authenticated user's organization unless creating a public module
    const finalOrganizationId = organizationId || user.organizationId;

    const uniqueWhere = {
      sectionCode_organizationId: {
        sectionCode: moduleData.sectionCode,
        organizationId: finalOrganizationId ?? null
      }
    } as const;

    const existing = await prisma.priorityOffenceModule.findUnique({
      where: uniqueWhere
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Module with this section code already exists for the organization' },
        { status: 409 }
      );
    }

    const createdModule = await prisma.priorityOffenceModule.create({
      data: {
        ...moduleData,
        organizationId: finalOrganizationId ?? null,
        tags: tags ?? [],
        elements: {
          create: elements.map((element) => ({
            ...element,
            essential: element.essential ?? true,
            weight: element.weight ?? 3
          }))
        },
        witnesses: witnesses && witnesses.length > 0 ? { create: witnesses } : undefined,
        exhibits: exhibits && exhibits.length > 0 ? { create: exhibits } : undefined,
        automationHooks:
          automationHooks && automationHooks.length > 0
            ? {
                create: automationHooks.map((hook) => ({
                  ...hook,
                  isActive: hook.isActive ?? true
                }))
              }
            : undefined
      },
      include: {
        elements: true,
        witnesses: true,
        exhibits: true,
        automationHooks: true
      }
    });

    return NextResponse.json(
      { success: true, data: createdModule },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating priority offence module:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
