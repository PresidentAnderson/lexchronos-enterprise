import type { EvidencePassage, LegalArticle, LegalArticleElement, Mission, PassageEmbedding as PassageEmbeddingModel } from '@prisma/client';
import { EmbeddingSpace } from '@prisma/client';
import type { MissionPlan, MissionArticlePlan, MissionElementPlan, MissionSupportScore, RationaleAtom, ArticleElementContext } from './types';
import { RETRIEVAL_WEIGHTS } from './config';
import { keywordCoverage, detectElementKeywords } from './rule-engine';
import { cosineSimilarity, generateEmbedding } from './embedding';
import { buildRationaleAtoms } from './rationale';
import type { EmbeddingVector } from './types';

interface BuildMissionPlanArgs {
  mission: Mission;
  articles: (LegalArticle & { elements: LegalArticleElement[] })[];
  weighting?: Record<string, number> | null;
}

function parseJsonArray(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean);
  }

  return [];
}

function collectKeywords(element: LegalArticleElement): string[] {
  const synonyms = parseJsonArray(element.synonyms as unknown);
  const proofRequirements = parseJsonArray(element.proofRequirements as unknown);
  const derived = detectElementKeywords(`${element.label} ${element.description ?? ''}`);
  const derivedKeywords = Object.values(derived).flat();

  return Array.from(new Set([element.label, element.key, ...synonyms, ...proofRequirements, ...derivedKeywords]))
    .map(keyword => keyword.toLowerCase())
    .filter(Boolean);
}

export function buildMissionPlan({ mission, articles, weighting }: BuildMissionPlanArgs): MissionPlan {
  const planArticles: MissionArticlePlan[] = articles.map(article => {
    const elements: MissionElementPlan[] = article.elements.map(element => {
      const keywords = collectKeywords(element);
      const weight = weighting?.[element.key] ?? 1;
      const prompts = [
        `Evidence that ${element.label.toLowerCase()}`,
        element.canonicalText ?? element.description ?? element.label
      ].filter(Boolean) as string[];

      return {
        elementId: element.id,
        elementKey: element.key,
        keywords,
        prompts,
        weight
      };
    });

    return {
      articleId: article.id,
      title: article.title,
      jurisdiction: article.jurisdiction,
      section: article.section,
      elements
    };
  });

  return {
    missionId: mission.id,
    generatedAt: new Date().toISOString(),
    narrativeTheory: mission.narrativeTheory,
    articles: planArticles
  };
}

function getEmbeddingVector(embeddings: PassageEmbeddingModel[], space: EmbeddingSpace): EmbeddingVector | null {
  const embedding = embeddings.find(item => item.space === space);
  if (!embedding) {
    return null;
  }

  if (Array.isArray(embedding.vector)) {
    return embedding.vector as number[];
  }

  return null;
}

function scoreFreshness(dates: string[]): number {
  if (dates.length === 0) {
    return 0.4;
  }

  const now = Date.now();
  const parsedDates = dates
    .map(value => {
      const timestamp = Date.parse(value);
      return Number.isNaN(timestamp) ? null : timestamp;
    })
    .filter((value): value is number => value !== null);

  if (parsedDates.length === 0) {
    return 0.45;
  }

  const latest = Math.max(...parsedDates);
  const diffDays = Math.abs(now - latest) / (1000 * 60 * 60 * 24);

  if (diffDays <= 30) {
    return 0.95;
  }

  if (diffDays <= 180) {
    return 0.75;
  }

  if (diffDays <= 365) {
    return 0.6;
  }

  return 0.4;
}

function scoreCredibility(metadata: unknown): number {
  if (!metadata || typeof metadata !== 'object') {
    return 0.55;
  }

  const record = metadata as Record<string, unknown>;
  if (typeof record.credibility === 'number') {
    return Math.max(0.2, Math.min(1, record.credibility));
  }

  if (typeof record.source === 'string') {
    const value = record.source.toLowerCase();
    if (value.includes('police') || value.includes('court') || value.includes('sworn')) {
      return 0.85;
    }
    if (value.includes('email') || value.includes('text')) {
      return 0.65;
    }
  }

  return 0.55;
}

function computeScores(params: {
  passage: EvidencePassage & { embeddings: PassageEmbeddingModel[] };
  keywords: string[];
  queryVector: EmbeddingVector;
  queryLegalVector: EmbeddingVector;
}): MissionSupportScore {
  const { passage, keywords, queryVector, queryLegalVector } = params;

  const lexicalScore = keywordCoverage(passage.text, keywords);
  const passageLegalEmbedding = getEmbeddingVector(passage.embeddings, EmbeddingSpace.LEGAL) ?? [];
  const passageGeneralEmbedding = getEmbeddingVector(passage.embeddings, EmbeddingSpace.GENERAL) ?? passageLegalEmbedding;

  const semanticScore = passageLegalEmbedding.length > 0
    ? cosineSimilarity(passageLegalEmbedding, queryLegalVector)
    : cosineSimilarity(passageGeneralEmbedding, queryVector);

  const coverageScore = lexicalScore;
  const freshnessScore = scoreFreshness(Array.isArray(passage.detectedDates) ? (passage.detectedDates as string[]) : []);
  const credibilityScore = scoreCredibility(passage.metadata);

  const totalScore =
    lexicalScore * RETRIEVAL_WEIGHTS.lexical +
    semanticScore * RETRIEVAL_WEIGHTS.semantic +
    coverageScore * RETRIEVAL_WEIGHTS.coverage +
    freshnessScore * RETRIEVAL_WEIGHTS.freshness +
    credibilityScore * RETRIEVAL_WEIGHTS.credibility;

  return {
    lexicalScore,
    semanticScore,
    coverageScore,
    freshnessScore,
    credibilityScore,
    totalScore
  };
}

export function evaluatePassageAgainstElement(params: {
  passage: EvidencePassage & { embeddings: PassageEmbeddingModel[] };
  element: LegalArticleElement;
  keywords: string[];
  corroboration?: string[];
}): { scores: MissionSupportScore; rationale: RationaleAtom[] } | null {
  const { passage, element, keywords, corroboration } = params;
  const prompt = element.canonicalText ?? element.description ?? element.label;
  const queryGeneral = generateEmbedding(prompt, EmbeddingSpace.GENERAL);
  const queryLegal = generateEmbedding(prompt, EmbeddingSpace.LEGAL);

  const scores = computeScores({
    passage,
    keywords,
    queryVector: queryGeneral.vector,
    queryLegalVector: queryLegal.vector
  });

  if (scores.totalScore < RETRIEVAL_WEIGHTS.threshold) {
    return null;
  }

  const detected = detectElementKeywords(passage.text);
  const matched = new Set<string>([...keywords.filter(keyword => passage.text.toLowerCase().includes(keyword)), ...(detected[element.key] || [])]);
  const coverage = matched.size > 0 ? matched.size / Math.max(keywords.length, 1) : scores.coverageScore;

  const rationale = buildRationaleAtoms({
    elementLabel: element.label,
    passageText: passage.text,
    matchedPhrases: Array.from(matched),
    coverage,
    corroboration
  });

  return { scores, rationale };
}

export function buildElementContext(element: LegalArticleElement): ArticleElementContext {
  return {
    articleId: element.articleId,
    elementId: element.id,
    elementKey: element.key,
    canonicalText: element.canonicalText,
    synonyms: parseJsonArray(element.synonyms as unknown),
    proofRequirements: parseJsonArray(element.proofRequirements as unknown)
  };
}
