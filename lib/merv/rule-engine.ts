const DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b\d{2}\/\d{2}\/\d{4}\b/g,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b/gi
];

const PARTY_PATTERNS = [
  /\b(Mr\.|Ms\.|Mrs\.|Dr\.|Officer|Detective|Judge)\s+[A-Z][a-z]+\b/g,
  /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g
];

const ELEMENT_KEYWORDS: Record<string, string[]> = {
  intent: ['intent', 'intended', 'knowingly', 'purpose'],
  knowledge: ['knew', 'aware', 'knowledge', 'knew or ought to have known'],
  harassment: ['harass', 'threat', 'fear', 'intimidate', 'stalking'],
  communication: ['message', 'call', 'email', 'texted', 'contacted'],
  repetition: ['repeated', 'multiple times', 'again', 'continued']
};

export function extractDates(text: string): string[] {
  const matches = new Set<string>();
  DATE_PATTERNS.forEach(pattern => {
    const found = text.match(pattern) || [];
    found.forEach(match => matches.add(match));
  });
  return Array.from(matches);
}

export function extractParties(text: string): string[] {
  const matches = new Set<string>();
  PARTY_PATTERNS.forEach(pattern => {
    const found = text.match(pattern) || [];
    found
      .filter(value => value.split(' ').length <= 3)
      .forEach(match => matches.add(match.trim()));
  });
  return Array.from(matches).slice(0, 10);
}

export function detectElementKeywords(text: string): Record<string, string[]> {
  const lower = text.toLowerCase();
  const results: Record<string, string[]> = {};

  Object.entries(ELEMENT_KEYWORDS).forEach(([elementKey, keywords]) => {
    const hits = keywords.filter(keyword => lower.includes(keyword));
    if (hits.length > 0) {
      results[elementKey] = hits;
    }
  });

  return results;
}

export function keywordCoverage(text: string, keywords: string[]): number {
  if (keywords.length === 0) {
    return 0;
  }

  const lower = text.toLowerCase();
  const matches = keywords.filter(keyword => lower.includes(keyword.toLowerCase()));
  return matches.length / keywords.length;
}
