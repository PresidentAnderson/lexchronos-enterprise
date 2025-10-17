import crypto from 'node:crypto';
import { EMBEDDING_CONFIG } from './config';
import { EmbeddingSpace } from '@prisma/client';
import type { EmbeddingVector } from './types';

function hashBuffer(text: string, seed: string): Buffer {
  return crypto.createHash('sha256').update(seed).update(text).digest();
}

function bufferToFloat(buffer: Buffer, offset: number): number {
  const slice = buffer.subarray(offset, offset + 4);
  const int = slice.readInt32BE(0);
  return int / 0x7fffffff;
}

export function generateDeterministicVector(text: string, dimensions: number, seed: string): EmbeddingVector {
  const vector: EmbeddingVector = [];
  const normalized = text.normalize('NFKC');

  for (let i = 0; i < dimensions; i += 8) {
    const blockSeed = `${seed}-${i}`;
    const hash = hashBuffer(normalized, blockSeed);

    for (let j = 0; j < 8 && i + j < dimensions; j++) {
      vector[i + j] = bufferToFloat(hash, j * 4);
    }
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }

  return vector.map(value => value / magnitude);
}

export function generateEmbedding(text: string, space: EmbeddingSpace): { vector: EmbeddingVector; model: string } {
  if (space === EmbeddingSpace.LEGAL) {
    return {
      vector: generateDeterministicVector(text, EMBEDDING_CONFIG.legalDimensions, 'legal'),
      model: EMBEDDING_CONFIG.legalModel
    };
  }

  return {
    vector: generateDeterministicVector(text, EMBEDDING_CONFIG.generalDimensions, 'general'),
    model: EMBEDDING_CONFIG.generalModel
  };
}

export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / Math.sqrt(normA * normB);
}

export function vectorChecksum(vector: EmbeddingVector): string {
  const buffer = Buffer.from(Float32Array.from(vector).buffer);
  return crypto.createHash('sha1').update(buffer).digest('hex');
}
