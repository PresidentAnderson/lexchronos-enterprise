import type { RationaleAtom } from './types';

interface RationaleInput {
  elementLabel: string;
  passageText: string;
  matchedPhrases: string[];
  coverage: number;
  corroboration?: string[];
}

export function buildRationaleAtoms(input: RationaleInput): RationaleAtom[] {
  const phrases = input.matchedPhrases.slice(0, 3);
  const whyParts = [] as string[];

  if (phrases.length > 0) {
    whyParts.push(`Matches phrases: ${phrases.join(', ')}`);
  }

  whyParts.push(`Coverage ${(input.coverage * 100).toFixed(0)}%`);

  return [
    {
      element: input.elementLabel,
      evidence: input.passageText.length > 200 ? `${input.passageText.slice(0, 200)}…` : input.passageText,
      why: whyParts.join(' · '),
      corroboration: input.corroboration && input.corroboration.length > 0 ? input.corroboration : undefined
    }
  ];
}
