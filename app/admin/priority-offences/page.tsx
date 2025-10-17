import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { PriorityOffenceDashboard } from '@/components/priority-offences/priority-offence-dashboard';

export const metadata: Metadata = {
  title: 'Priority Offence Modules',
  description:
    'Real-time oversight of G1–G12 priority offence modules, coverage scores, and risk signals.'
};

export default async function PriorityOffenceModulesPage() {
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
}
