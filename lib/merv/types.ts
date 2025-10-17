import { EmbeddingSpace, MissionObservationType, MissionStatus } from '@prisma/client';

export interface RawDocumentPayload {
  documentId: string;
  organizationId?: string;
  caseId?: string | null;
  createdById?: string | null;
  language?: string;
  sourceType?: string;
  createdAt?: string | Date;
  text?: string;
  passages?: NormalizedPassage[];
  metadata?: Record<string, unknown>;
}

export interface NormalizedPassage {
  stableId: string;
  passageIndex: number;
  text: string;
  page?: number | null;
  charStart?: number | null;
  charEnd?: number | null;
  language?: string | null;
  detectedDates?: string[];
  detectedParties?: string[];
  metadata?: Record<string, unknown>;
}

export interface ChunkingOptions {
  minSentences: number;
  maxSentences: number;
  minCharacters: number;
  maxCharacters: number;
}

export interface EmbeddingConfig {
  generalDimensions: number;
  legalDimensions: number;
  generalModel: string;
  legalModel: string;
}

export interface RetrievalWeights {
  lexical: number;
  semantic: number;
  coverage: number;
  freshness: number;
  credibility: number;
  threshold: number;
}

export interface MissionElementPlan {
  elementId: string;
  elementKey: string;
  prompts: string[];
  keywords: string[];
  weight: number;
}

export interface MissionArticlePlan {
  articleId: string;
  title: string;
  jurisdiction: string;
  section: string;
  elements: MissionElementPlan[];
}

export interface MissionPlan {
  missionId: string;
  generatedAt: string;
  narrativeTheory?: string | null;
  articles: MissionArticlePlan[];
}

export interface MissionSupportScore {
  lexicalScore: number;
  semanticScore: number;
  coverageScore: number;
  freshnessScore: number;
  credibilityScore: number;
  totalScore: number;
}

export interface SupportCandidate {
  passageId: string;
  articleId: string;
  elementId: string;
  elementKey: string;
  missionId: string;
  rationale: RationaleAtom[];
  scores: MissionSupportScore;
}

export interface RationaleAtom {
  element: string;
  evidence: string;
  why: string;
  corroboration?: string[];
}

export interface MissionObservationPayload {
  missionId: string;
  userId?: string;
  passageId?: string;
  articleId?: string;
  elementId?: string;
  type: MissionObservationType;
  payload?: Record<string, unknown>;
  effect?: Record<string, unknown>;
}

export interface MissionProfileInput {
  organizationId: string;
  caseId?: string | null;
  jurisdiction: string;
  claims: MissionClaimInput[];
  narrativeTheory?: string | null;
  weighting?: Record<string, number>;
  createdById?: string | null;
}

export interface MissionClaimInput {
  claim: string;
  jurisdiction?: string;
  code?: string;
  section?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

export interface MissionProfileResult {
  id: string;
  status: MissionStatus;
}

export interface PlanMissionOptions {
  missionId: string;
}

export interface RunMissionOptions {
  missionId: string;
  limit?: number;
}

export interface HighlightRange {
  passageId: string;
  articleId: string;
  elementId?: string | null;
  elementKey: string;
  page?: number | null;
  charStart?: number | null;
  charEnd?: number | null;
  score: MissionSupportScore;
  rationale: RationaleAtom[];
}

export interface HighlightResponse {
  documentId: string;
  missionId?: string;
  passages: HighlightRange[];
}

export type EmbeddingVector = number[];

export interface PassageEmbeddingPayload {
  passageId: string;
  space: EmbeddingSpace;
  model: string;
  vector: EmbeddingVector;
}

export interface ArticleElementContext {
  articleId: string;
  elementId: string;
  elementKey: string;
  canonicalText?: string | null;
  synonyms?: string[];
  proofRequirements?: string[];
}

export interface PassageEvaluationResult {
  passageId: string;
  elementId: string;
  elementKey: string;
  lexicalScore: number;
  semanticScore: number;
  coverageScore: number;
  freshnessScore: number;
  credibilityScore: number;
  rationale: RationaleAtom[];
}

