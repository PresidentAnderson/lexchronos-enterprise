import { Prisma, OffenceSeverity, OffenceRiskLevel } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en-US';

const severityStyles: Record<OffenceSeverity, string> = {
  CRITICAL: 'bg-red-600 text-white hover:bg-red-600/90',
  SERIOUS: 'bg-orange-500 text-white hover:bg-orange-500/90',
  MODERATE: 'bg-amber-500 text-white hover:bg-amber-500/90',
  LOW: 'bg-emerald-500 text-white hover:bg-emerald-500/90'
};

const riskStyles: Record<OffenceRiskLevel, string> = {
  CRITICAL: 'bg-red-700 text-white hover:bg-red-700/90',
  HIGH: 'bg-red-500 text-white hover:bg-red-500/90',
  MEDIUM: 'bg-amber-500 text-white hover:bg-amber-500/90',
  LOW: 'bg-emerald-500 text-white hover:bg-emerald-500/90'
};

const dateFormatter = new Intl.DateTimeFormat(locale, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const percentFormatter = new Intl.NumberFormat(locale, {
  style: 'percent',
  maximumFractionDigits: 0
});

const decimalFormatter = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

type PriorityOffenceModuleWithHeatmap = Prisma.PriorityOffenceModuleGetPayload<{
  include: {
    elements: {
      include: {
        heatmapEntries: {
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
}>;

interface PriorityOffenceDashboardProps {
  modules: PriorityOffenceModuleWithHeatmap[];
}

function pickLatestHeatmap(
  element: PriorityOffenceModuleWithHeatmap['elements'][number]
) {
  if (!element.heatmapEntries || element.heatmapEntries.length === 0) {
    return null;
  }

  return element.heatmapEntries.reduce((latest, entry) => {
    if (!latest) {
      return entry;
    }

    return latest.updatedAt > entry.updatedAt ? latest : entry;
  });
}

export function PriorityOffenceDashboard({ modules }: PriorityOffenceDashboardProps) {
  const orderedModules = [...modules].sort((a, b) =>
    a.sectionCode.localeCompare(b.sectionCode)
  );

  const totalElements = orderedModules.reduce(
    (sum, module) => sum + (module.elements?.length || 0),
    0
  );

  const allHeatmapEntries = orderedModules.flatMap((module) =>
    module.elements?.flatMap((element) => element.heatmapEntries ?? []) ?? []
  );

  const averageCoverage =
    allHeatmapEntries.length > 0
      ? allHeatmapEntries.reduce((sum, entry) => sum + entry.coverageScore, 0) /
        allHeatmapEntries.length
      : 0;

  const atRiskElements = allHeatmapEntries.filter((entry) =>
    entry.status === 'AT_RISK' || entry.status === 'BLOCKED'
  ).length;

  const readyElements = allHeatmapEntries.filter((entry) =>
    entry.status === 'READY' || entry.status === 'VERIFIED'
  ).length;

  const uniqueCases = new Set(
    allHeatmapEntries.map((entry) => entry.caseId)
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>G1–G12 Modules</CardTitle>
            <CardDescription>Priority offence coverage in scope</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-4xl font-semibold">{orderedModules.length}</span>
            <Badge variant="outline" className="text-xs">
              {totalElements} tracked elements
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Coverage</CardTitle>
            <CardDescription>Across all mapped elements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={Math.round(averageCoverage * 100)} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{percentFormatter.format(averageCoverage)}</span>
              <span>
                Ready {readyElements} / At-Risk {atRiskElements}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Linked Cases</CardTitle>
            <CardDescription>Cases with element heatmap activity</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-4xl font-semibold">{uniqueCases.size}</span>
            <Badge variant="secondary" className="text-xs">
              {readyElements} ready elements
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risk Surface</CardTitle>
            <CardDescription>Elements requiring escalation</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <span className="text-4xl font-semibold">{atRiskElements}</span>
            <Badge variant="destructive" className="text-xs">
              {percentFormatter.format(
                orderedModules.length > 0
                  ? atRiskElements / Math.max(totalElements, 1)
                  : 0
              )}{' '}
              at-risk ratio
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {orderedModules.map((module) => {
          const moduleHeatmapEntries = module.elements?.flatMap(
            (element) => element.heatmapEntries ?? []
          );

          const moduleAverage =
            moduleHeatmapEntries && moduleHeatmapEntries.length > 0
              ? moduleHeatmapEntries.reduce(
                  (sum, entry) => sum + entry.coverageScore,
                  0
                ) / moduleHeatmapEntries.length
              : 0;

          const moduleAtRisk = moduleHeatmapEntries
            ? moduleHeatmapEntries.filter(
                (entry) =>
                  entry.status === 'AT_RISK' || entry.status === 'BLOCKED'
              ).length
            : 0;

          const moduleReady = moduleHeatmapEntries
            ? moduleHeatmapEntries.filter(
                (entry) =>
                  entry.status === 'READY' || entry.status === 'VERIFIED'
              ).length
            : 0;

          const moduleCases = moduleHeatmapEntries
            ? new Set(moduleHeatmapEntries.map((entry) => entry.caseId)).size
            : 0;

          return (
            <Card key={module.id} className="border-muted">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      {module.sectionCode} · {module.title}
                    </CardTitle>
                    {module.subtitle && (
                      <CardDescription>{module.subtitle}</CardDescription>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs uppercase">
                      {module.category.replace(/_/g, ' ')}
                    </Badge>
                    <Badge
                      className={cn(
                        'text-xs uppercase',
                        severityStyles[module.severity]
                      )}
                    >
                      {module.severity}
                    </Badge>
                  </div>
                </div>
                {module.tags && module.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {module.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Coverage</p>
                    <p className="text-lg font-semibold">
                      {percentFormatter.format(moduleAverage)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tracked Elements</p>
                    <p className="text-lg font-semibold">
                      {module.elements?.length ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Linked Cases</p>
                    <p className="text-lg font-semibold">{moduleCases}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ready vs Risk</p>
                    <p className="text-lg font-semibold">
                      {moduleReady}:{moduleAtRisk}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {module.elements?.map((element) => {
                    const latest = pickLatestHeatmap(element);
                    const coverage = latest ? latest.coverageScore : 0;
                    const riskLevel = latest ? latest.riskLevel : 'LOW';
                    const status = latest ? latest.status : 'NOT_STARTED';
                    const baseline = element.baselineScore ?? 0;
                    const caseTitle = latest?.case
                      ? `${latest.case.caseNumber} · ${latest.case.title}`
                      : 'No case linked';
                    const updatedBy = latest?.updatedBy
                      ? `${latest.updatedBy.firstName ?? ''} ${
                          latest.updatedBy.lastName ?? ''
                        }`.trim()
                      : null;

                    return (
                      <div
                        key={element.id}
                        className="rounded-lg border border-muted bg-background/60 p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">
                              {element.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {element.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs uppercase">
                            {element.elementType.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                          <Progress value={Math.round(coverage * 100)} className="h-2 flex-1" />
                          <span className="w-12 text-right text-xs font-semibold">
                            {percentFormatter.format(coverage)}
                          </span>
                          <Badge
                            className={cn(
                              'text-xs uppercase',
                              riskStyles[riskLevel as OffenceRiskLevel]
                            )}
                          >
                            {riskLevel}
                          </Badge>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                          <span>
                            Target: {percentFormatter.format(baseline || 0)}
                          </span>
                          <span>Status: {status.replace(/_/g, ' ')}</span>
                          <span className="col-span-2">{caseTitle}</span>
                          <span>
                            {latest
                              ? `Updated ${dateFormatter.format(latest.updatedAt)}`
                              : 'Not yet updated'}
                          </span>
                          <span>
                            {updatedBy ? `By ${updatedBy}` : '—'}
                          </span>
                        </div>

                        {latest?.variance !== null && latest?.variance !== undefined && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Variance: {decimalFormatter.format(latest.variance)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
