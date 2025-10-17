import crypto from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { EmbeddingSpace, MissionObservationType, MissionStatus, SupportEdgeStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { chunkDocumentPayload } from './chunker';
import { buildMissionPlan, evaluatePassageAgainstElement } from './retrieval';
import { DEFAULT_LIMIT, MAX_SUPPORT_CANDIDATES } from './config';
import { generateEmbedding } from './embedding';
import type {
  HighlightResponse,
  MissionClaimInput,
  MissionPlan,
  MissionProfileInput,
  MissionProfileResult,
  NormalizedPassage,
  PlanMissionOptions,
  RawDocumentPayload,
  RunMissionOptions,
  SupportCandidate,
  RationaleAtom
} from './types';

function computeTokenCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function hashText(text: string): string {
  return crypto.createHash('sha1').update(text).digest('hex');
}

function toJson(value: unknown): Prisma.JsonValue {
  return value as Prisma.JsonValue;
}

function normalizePassages(payload: RawDocumentPayload): NormalizedPassage[] {
  return chunkDocumentPayload(payload);
}

function claimsSummary(claims: MissionClaimInput[]): Prisma.JsonValue {
  return claims.map(claim => ({
    claim: claim.claim,
    jurisdiction: claim.jurisdiction,
    code: claim.code,
    section: claim.section,
    weight: claim.weight ?? 1
  })) as Prisma.JsonValue;
}

export async function ingestMissionEvidence(payload: RawDocumentPayload) {
  const document = await prisma.document.findUnique({
    where: { id: payload.documentId },
    include: { organization: true }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const passages = normalizePassages(payload);
  if (passages.length === 0) {
    return {
      documentId: payload.documentId,
      created: 0,
      updated: 0,
      total: 0
    };
  }

  let created = 0;
  let updated = 0;

  await prisma.$transaction(async tx => {
    for (const passage of passages) {
      const where = {
        documentId_stableId: {
          documentId: document.id,
          stableId: passage.stableId
        }
      } satisfies Prisma.EvidencePassageWhereUniqueInput;

      const existing = await tx.evidencePassage.findUnique({ where });
      const baseData: Prisma.EvidencePassageCreateInput = {
        document: { connect: { id: document.id } },
        stableId: passage.stableId,
        passageIndex: passage.passageIndex,
        page: passage.page ?? null,
        charStart: passage.charStart ?? null,
        charEnd: passage.charEnd ?? null,
        text: passage.text,
        language: passage.language ?? payload.language ?? 'en',
        detectedDates: toJson(passage.detectedDates ?? []),
        detectedParties: toJson(passage.detectedParties ?? []),
        metadata: toJson({
          ...(passage.metadata ?? {}),
          sourceType: payload.sourceType ?? document.category
        }),
        tokenCount: computeTokenCount(passage.text),
        checksum: hashText(passage.text)
      };

      let recordId: string;
      if (existing) {
        await tx.evidencePassage.update({
          where,
          data: {
            passageIndex: passage.passageIndex,
            page: passage.page ?? null,
            charStart: passage.charStart ?? null,
            charEnd: passage.charEnd ?? null,
            text: passage.text,
            language: passage.language ?? payload.language ?? 'en',
            detectedDates: toJson(passage.detectedDates ?? []),
            detectedParties: toJson(passage.detectedParties ?? []),
            metadata: baseData.metadata,
            tokenCount: computeTokenCount(passage.text),
            checksum: hashText(passage.text)
          }
        });
        recordId = existing.id;
        updated += 1;
      } else {
        const createdRecord = await tx.evidencePassage.create({ data: baseData });
        recordId = createdRecord.id;
        created += 1;
      }

      const generalEmbedding = generateEmbedding(passage.text, EmbeddingSpace.GENERAL);
      const legalEmbedding = generateEmbedding(passage.text, EmbeddingSpace.LEGAL);

      await tx.passageEmbedding.upsert({
        where: {
          passageId_space: {
            passageId: recordId,
            space: EmbeddingSpace.GENERAL
          }
        },
        update: {
          model: generalEmbedding.model,
          dimensions: generalEmbedding.vector.length,
          vector: toJson(generalEmbedding.vector)
        },
        create: {
          passage: { connect: { id: recordId } },
          space: EmbeddingSpace.GENERAL,
          model: generalEmbedding.model,
          dimensions: generalEmbedding.vector.length,
          vector: toJson(generalEmbedding.vector)
        }
      });

      await tx.passageEmbedding.upsert({
        where: {
          passageId_space: {
            passageId: recordId,
            space: EmbeddingSpace.LEGAL
          }
        },
        update: {
          model: legalEmbedding.model,
          dimensions: legalEmbedding.vector.length,
          vector: toJson(legalEmbedding.vector)
        },
        create: {
          passage: { connect: { id: recordId } },
          space: EmbeddingSpace.LEGAL,
          model: legalEmbedding.model,
          dimensions: legalEmbedding.vector.length,
          vector: toJson(legalEmbedding.vector)
        }
      });
    }

    await tx.document.update({
      where: { id: document.id },
      data: {
        isProcessed: true,
        updatedAt: new Date()
      }
    });
  });

  return {
    documentId: payload.documentId,
    created,
    updated,
    total: created + updated
  };
}

export async function createMissionProfile(input: MissionProfileInput): Promise<MissionProfileResult> {
  const mission = await prisma.$transaction(async tx => {
    const missionRecord = await tx.mission.create({
      data: {
        organizationId: input.organizationId,
        caseId: input.caseId ?? null,
        createdById: input.createdById ?? null,
        jurisdiction: input.jurisdiction,
        narrativeTheory: input.narrativeTheory ?? null,
        weighting: input.weighting ? toJson(input.weighting) : null,
        claimsSummary: input.claims.length > 0 ? claimsSummary(input.claims) : null,
        status: MissionStatus.DRAFT
      }
    });

    if (input.claims.length > 0) {
      await tx.missionClaim.createMany({
        data: input.claims.map(claim => ({
          missionId: missionRecord.id,
          claim: claim.claim,
          jurisdiction: claim.jurisdiction ?? input.jurisdiction,
          code: claim.code ?? null,
          section: claim.section ?? null,
          weight: claim.weight ?? 1,
          metadata: claim.metadata ? toJson(claim.metadata) : null
        }))
      });
    }

    return missionRecord;
  });

  return {
    id: mission.id,
    status: mission.status
  };
}

export async function planMission({ missionId }: PlanMissionOptions): Promise<MissionPlan> {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: { missionClaims: true }
  });

  if (!mission) {
    throw new Error('Mission not found');
  }

  const claimConditions = mission.missionClaims
    .map(claim => {
      const condition: Prisma.LegalArticleWhereInput = {};
      if (claim.code) {
        condition.code = claim.code;
      }
      if (claim.section) {
        condition.section = claim.section;
      }
      return Object.keys(condition).length > 0 ? condition : null;
    })
    .filter((condition): condition is Prisma.LegalArticleWhereInput => condition !== null);

  const articleWhere: Prisma.LegalArticleWhereInput = {
    jurisdiction: mission.jurisdiction
  };

  if (claimConditions.length > 0) {
    articleWhere.OR = claimConditions;
  }

  const articles = await prisma.legalArticle.findMany({
    where: articleWhere,
    include: { elements: true }
  });

  if (articles.length === 0) {
    throw new Error('No legal articles found for mission jurisdiction');
  }

  const plan = buildMissionPlan({
    mission,
    articles,
    weighting: (mission.weighting as Record<string, number> | null) ?? null
  });

  await prisma.mission.update({
    where: { id: missionId },
    data: {
      retrievalPlan: toJson(plan),
      lastPlannedAt: new Date(),
      status: mission.status === MissionStatus.DRAFT ? MissionStatus.ACTIVE : mission.status
    }
  });

  return plan;
}

async function ensureMissionPlan(missionId: string): Promise<MissionPlan> {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId }
  });

  if (!mission) {
    throw new Error('Mission not found');
  }

  if (mission.retrievalPlan) {
    return mission.retrievalPlan as MissionPlan;
  }

  return planMission({ missionId });
}

export async function runMission({ missionId, limit = DEFAULT_LIMIT }: RunMissionOptions) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      missionClaims: true
    }
  });

  if (!mission) {
    throw new Error('Mission not found');
  }

  const plan = await ensureMissionPlan(missionId);
  const elementIds = plan.articles.flatMap(article => article.elements.map(element => element.elementId));

  if (elementIds.length === 0) {
    return { missionId, support: [] };
  }

  const elements = await prisma.legalArticleElement.findMany({
    where: { id: { in: elementIds } },
    include: { article: true }
  });

  const passages = await prisma.evidencePassage.findMany({
    where: {
      document: {
        organizationId: mission.organizationId,
        ...(mission.caseId ? { caseId: mission.caseId } : {})
      }
    },
    include: {
      embeddings: true
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: Math.min(limit, 500)
  });

  const candidates: SupportCandidate[] = [];
  const planElementMap = new Map<string, { keywords: string[]; weight: number }>();
  plan.articles.forEach(article => {
    article.elements.forEach(element => {
      planElementMap.set(element.elementId, {
        keywords: element.keywords,
        weight: element.weight
      });
    });
  });

  for (const element of elements) {
    const planContext = planElementMap.get(element.id);
    if (!planContext) {
      continue;
    }

    const corroboration: string[] = [];

    passages.forEach(passage => {
      const evaluation = evaluatePassageAgainstElement({
        passage,
        element,
        keywords: planContext.keywords,
        corroboration
      });

      if (!evaluation) {
        return;
      }

      const weightedTotal = Math.min(1, evaluation.scores.totalScore * planContext.weight);

      candidates.push({
        passageId: passage.id,
        articleId: element.articleId,
        elementId: element.id,
        elementKey: element.key,
        missionId: mission.id,
        rationale: evaluation.rationale,
        scores: {
          ...evaluation.scores,
          totalScore: weightedTotal
        }
      });
    });
  }

  const sorted = candidates
    .sort((a, b) => b.scores.totalScore - a.scores.totalScore)
    .slice(0, MAX_SUPPORT_CANDIDATES);

  await prisma.$transaction(async tx => {
    await tx.supportEdge.deleteMany({ where: { missionId } });

    for (const candidate of sorted) {
      await tx.supportEdge.create({
        data: {
          mission: { connect: { id: missionId } },
          passage: { connect: { id: candidate.passageId } },
          article: { connect: { id: candidate.articleId } },
          element: { connect: { id: candidate.elementId } },
          elementKey: candidate.elementKey,
          lexicalScore: candidate.scores.lexicalScore,
          semanticScore: candidate.scores.semanticScore,
          coverageScore: candidate.scores.coverageScore,
          freshnessScore: candidate.scores.freshnessScore,
          credibilityScore: candidate.scores.credibilityScore,
          totalScore: candidate.scores.totalScore,
          rationale: toJson(candidate.rationale),
          status: SupportEdgeStatus.PENDING
        }
      });
    }

    await tx.mission.update({
      where: { id: missionId },
      data: {
        lastRunAt: new Date(),
        status: MissionStatus.ACTIVE
      }
    });
  });

  return {
    missionId,
    support: sorted
  };
}

export async function fetchDocumentHighlights(documentId: string, missionId?: string): Promise<HighlightResponse> {
  const edges = await prisma.supportEdge.findMany({
    where: {
      passage: {
        documentId
      },
      ...(missionId ? { missionId } : {})
    },
    include: {
      passage: true,
      article: true,
      element: true
    },
    orderBy: {
      totalScore: 'desc'
    }
  });

  return {
    documentId,
    missionId,
    passages: edges.map(edge => ({
      passageId: edge.passageId,
      articleId: edge.articleId,
      elementId: edge.elementId,
      elementKey: edge.elementKey,
      page: edge.passage.page,
      charStart: edge.passage.charStart,
      charEnd: edge.passage.charEnd,
      score: {
        lexicalScore: edge.lexicalScore ?? 0,
        semanticScore: edge.semanticScore ?? 0,
        coverageScore: edge.coverageScore ?? 0,
        freshnessScore: edge.freshnessScore ?? 0,
        credibilityScore: edge.credibilityScore ?? 0,
        totalScore: edge.totalScore
      },
      rationale: Array.isArray(edge.rationale) ? (edge.rationale as RationaleAtom[]) : []
    }))
  };
}

export async function recordMissionObservation(params: {
  missionId: string;
  userId?: string;
  passageId?: string;
  articleId?: string;
  elementId?: string;
  type: MissionObservationType;
  payload?: Record<string, unknown>;
  effect?: Record<string, unknown>;
}) {
  return prisma.missionObservation.create({
    data: {
      missionId: params.missionId,
      userId: params.userId ?? null,
      passageId: params.passageId ?? null,
      articleId: params.articleId ?? null,
      elementId: params.elementId ?? null,
      type: params.type,
      payload: params.payload ? toJson(params.payload) : null,
      effect: params.effect ? toJson(params.effect) : null
    }
  });
}
