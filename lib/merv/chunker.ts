import crypto from 'node:crypto';
import { CHUNKING_CONFIG } from './config';
import { NormalizedPassage, RawDocumentPayload } from './types';
import { extractDates, extractParties } from './rule-engine';

const sentenceSplitter = /(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý"\[])/g;

function sanitize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function estimateLanguage(text: string): string {
  const asciiRatio = text
    .split('')
    .filter(char => char.charCodeAt(0) < 128)
    .length / Math.max(text.length, 1);

  if (asciiRatio < 0.4) {
    return 'non-latin';
  }

  const hasFrenchAccents = /[éàèùâêîôûëïüç]/i.test(text);
  if (hasFrenchAccents) {
    return 'fr';
  }

  const hasSpanishAccents = /[áéíóúñü]/i.test(text);
  if (hasSpanishAccents) {
    return 'es';
  }

  return 'en';
}

function buildStableId(documentId: string, index: number, text: string): string {
  const hash = crypto.createHash('sha1').update(`${documentId}:${index}:${text}`).digest('hex');
  return `${documentId}-${index}-${hash.slice(0, 8)}`;
}

export function chunkDocumentPayload(payload: RawDocumentPayload): NormalizedPassage[] {
  if (payload.passages && payload.passages.length > 0) {
    return payload.passages.map((passage, index) => ({
      ...passage,
      passageIndex: passage.passageIndex ?? index,
      stableId: passage.stableId || buildStableId(payload.documentId, index, passage.text),
      language: passage.language || payload.language || estimateLanguage(passage.text),
      detectedDates: passage.detectedDates || extractDates(passage.text),
      detectedParties: passage.detectedParties || extractParties(passage.text)
    }));
  }

  if (!payload.text) {
    return [];
  }

  const sanitized = sanitize(payload.text);
  if (!sanitized) {
    return [];
  }

  const sentences = sanitized.split(sentenceSplitter).map(sentence => sentence.trim()).filter(Boolean);
  const passages: NormalizedPassage[] = [];
  let buffer: string[] = [];
  let charCount = 0;

  const commitBuffer = (index: number) => {
    if (buffer.length === 0) {
      return;
    }

    const text = buffer.join(' ').trim();
    const passageIndex = passages.length;
    passages.push({
      stableId: buildStableId(payload.documentId, passageIndex, text),
      passageIndex,
      text,
      language: payload.language || estimateLanguage(text),
      detectedDates: extractDates(text),
      detectedParties: extractParties(text),
      metadata: {}
    });

    buffer = [];
    charCount = 0;
  };

  sentences.forEach(sentence => {
    const length = sentence.length;
    const isBufferEmpty = buffer.length === 0;
    const shouldCommit =
      (!isBufferEmpty &&
        (buffer.length >= CHUNKING_CONFIG.maxSentences ||
          charCount + length > CHUNKING_CONFIG.maxCharacters)) ||
      (!isBufferEmpty && buffer.length >= CHUNKING_CONFIG.minSentences &&
        charCount + length >= CHUNKING_CONFIG.minCharacters);

    if (shouldCommit) {
      commitBuffer(passages.length);
    }

    buffer.push(sentence);
    charCount += length + 1;
  });

  commitBuffer(passages.length);

  if (buffer.length > 0) {
    commitBuffer(passages.length);
  }

  return passages;
}
