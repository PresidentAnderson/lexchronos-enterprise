import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { PriorityOffenceDashboard } from '@/components/priority-offences/priority-offence-dashboard';

export const metadata: Metadata = {
  title: 'Priority Offence Modules',
  description:
    'Real-time oversight of G1–G12 priority offence modules, coverage scores, and risk signals.'
};

const DEMO_PRIORITY_MODULES: any[] = [
  {
    id: 'module-demo-1',
    sectionCode: 'G1',
    title: 'Serious Violent Felonies',
    subtitle: 'Rapid intake triage benchmarks',
    category: 'CRIMINAL',
    severity: 'CRITICAL',
    riskLevel: 'HIGH',
    tags: ['demo', 'high-priority'],
    updatedAt: new Date(),
    elements: [
      {
        id: 'element-demo-1',
        label: 'Probable Cause Assessment',
        description: 'Ensure probable cause memo is complete with required attachments.',
        elementType: 'EVIDENCE',
        baselineScore: 0.6,
        heatmapEntries: [
          {
            id: 'heatmap-demo-1',
            coverageScore: 0.82,
            riskLevel: 'MEDIUM',
            status: 'READY',
            updatedAt: new Date(),
            caseId: 'case-demo',
            case: {
              id: 'case-demo',
              caseNumber: '2024-LEX-001',
              title: 'LexChronos v. Demo',
              status: 'ACTIVE'
            },
            updatedById: 'user-demo',
            updatedBy: {
              id: 'user-demo',
              firstName: 'Riley',
              lastName: 'Chen',
              email: 'riley.chen@example.com'
            }
          }
        ]
      },
      {
        id: 'element-demo-2',
        label: 'Victim Communication Plan',
        description: 'Outline notification cadence and victim support resources.',
        elementType: 'WORKFLOW',
        baselineScore: 0.4,
        heatmapEntries: [
          {
            id: 'heatmap-demo-2',
            coverageScore: 0.64,
            riskLevel: 'LOW',
            status: 'IN_PROGRESS',
            updatedAt: new Date(),
            caseId: 'case-demo',
            case: {
              id: 'case-demo',
              caseNumber: '2024-LEX-001',
              title: 'LexChronos v. Demo',
              status: 'ACTIVE'
            },
            updatedById: 'user-demo',
            updatedBy: {
              id: 'user-demo',
              firstName: 'Morgan',
              lastName: 'Lee',
              email: 'morgan.lee@example.com'
            }
          }
        ]
      }
    ]
  }
];

export default async function PriorityOffenceModulesPage() {
  const demoMode =
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.DISABLE_DATABASE === 'true';

  if (demoMode) {
    return (
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Priority Offence Modules</h1>
          <p className="text-sm text-muted-foreground">
            Monitor element coverage, automation responses, and risk posture for sections G1–G12.
          </p>
        </div>

        <PriorityOffenceDashboard modules={DEMO_PRIORITY_MODULES} />
      </div>
    );
  }

  try {
    const modules = await prisma.priorityOffenceModule.findMany({
      orderBy: { sectionCode: 'asc' },
      include: {
        elements: {
          orderBy: { weight: 'desc' },
          include: {
            heatmapEntries: {
              orderBy: { updatedAt: 'desc' },
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
        }
      }
    });

    return (
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Priority Offence Modules</h1>
          <p className="text-sm text-muted-foreground">
            Monitor element coverage, automation responses, and risk posture for sections G1–G12.
          </p>
        </div>

        <PriorityOffenceDashboard modules={modules} />
      </div>
    );
  } catch (error) {
    console.error('Failed to load priority offence modules:', error);
    return (
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Priority Offence Modules</h1>
          <p className="text-sm text-muted-foreground">
            Monitor element coverage, automation responses, and risk posture for sections G1–G12.
          </p>
        </div>

        <PriorityOffenceDashboard modules={DEMO_PRIORITY_MODULES} />
      </div>
    );
  }
}
