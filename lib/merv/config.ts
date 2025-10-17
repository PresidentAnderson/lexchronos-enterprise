import { ChunkingOptions, EmbeddingConfig, RetrievalWeights } from './types';

export const CHUNKING_CONFIG: ChunkingOptions = {
  minSentences: 2,
  maxSentences: 8,
  minCharacters: 300,
  maxCharacters: 1200
};

export const EMBEDDING_CONFIG: EmbeddingConfig = {
  generalDimensions: 256,
  legalDimensions: 384,
  generalModel: 'lexchronos-embed-general-stub',
  legalModel: 'lexchronos-embed-legal-stub'
};

export const RETRIEVAL_WEIGHTS: RetrievalWeights = {
  lexical: 0.32,
  semantic: 0.32,
  coverage: 0.2,
  freshness: 0.08,
  credibility: 0.08,
  threshold: 0.35
};

export const MAX_SUPPORT_CANDIDATES = 50;
export const DEFAULT_LIMIT = 100;
