/**
 * OpenAI Client for LexChronos
 * Provides AI-powered document analysis, summarization, and legal intelligence
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DocumentSummaryRequest {
  content: string;
  documentType: 'legal' | 'contract' | 'evidence' | 'correspondence' | 'other';
  confidentialityLevel: 'PUBLIC' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL' | 'ATTORNEY_EYES_ONLY';
}

interface DocumentSummaryResponse {
  summary: string;
  suggestedCategory: string;
  confidentialityFlags: string[];
  keyPoints: string[];
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedTags: string[];
}

interface EthicalFlag {
  type: 'CONFLICT_OF_INTEREST' | 'PRIVILEGE_CONCERN' | 'CONFIDENTIALITY_RISK' | 'PROFESSIONAL_CONDUCT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  suggestion: string;
}

export const openAIClient = {
  /**
   * Generate document summary with legal analysis
   */
  async summarizeDocument(request: DocumentSummaryRequest): Promise<DocumentSummaryResponse> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `
You are a legal AI assistant analyzing a ${request.documentType} document with ${request.confidentialityLevel} confidentiality level.

Document Content:
${request.content.substring(0, 4000)} ${request.content.length > 4000 ? '...[truncated]' : ''}

Please provide a comprehensive analysis with the following:

1. EXECUTIVE SUMMARY (2-3 sentences max)
2. SUGGESTED CATEGORY (choose from: PLEADING, MOTION, BRIEF, EXHIBIT, CORRESPONDENCE, CONTRACT, DISCOVERY, EVIDENCE, RESEARCH, GENERAL)
3. CONFIDENTIALITY FLAGS (identify any sensitive information that requires special handling)
4. KEY POINTS (4-6 most important facts or legal points)
5. IMPORTANCE LEVEL (LOW, MEDIUM, HIGH, CRITICAL based on legal significance)
6. SUGGESTED TAGS (3-5 relevant tags for organization)

Format your response as a valid JSON object with these exact keys:
- summary
- suggestedCategory  
- confidentialityFlags (array of strings)
- keyPoints (array of strings)
- importance
- suggestedTags (array of strings)

Focus on legal relevance, accuracy, and maintaining confidentiality appropriate to the ${request.confidentialityLevel} level.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a specialized legal AI assistant focused on document analysis and legal practice management. Always maintain attorney-client privilege and confidentiality.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      try {
        const parsed = JSON.parse(response);
        return {
          summary: parsed.summary || 'No summary available',
          suggestedCategory: parsed.suggestedCategory || 'GENERAL',
          confidentialityFlags: parsed.confidentialityFlags || [],
          keyPoints: parsed.keyPoints || [],
          importance: parsed.importance || 'MEDIUM',
          suggestedTags: parsed.suggestedTags || []
        };
      } catch (parseError) {
        console.warn('Failed to parse OpenAI response as JSON, using fallback');
        return {
          summary: response.substring(0, 500),
          suggestedCategory: 'GENERAL',
          confidentialityFlags: [],
          keyPoints: [],
          importance: 'MEDIUM',
          suggestedTags: []
        };
      }
    } catch (error) {
      console.error('OpenAI document summary error:', error);
      throw new Error('Failed to generate document summary');
    }
  },

  /**
   * Generate embeddings for semantic search
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Truncate text to fit within token limits
      const truncatedText = text.substring(0, 8000);
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: truncatedText,
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('OpenAI embeddings error:', error);
      throw new Error('Failed to generate embeddings');
    }
  },

  /**
   * Check for ethical concerns in legal documents
   */
  async checkEthicalConcerns(content: string): Promise<EthicalFlag[]> {
    if (!process.env.OPENAI_API_KEY) {
      return []; // Return empty array if no API key
    }

    try {
      const prompt = `
Analyze this legal document content for potential ethical concerns:

${content.substring(0, 3000)}

Identify any potential issues related to:
1. Conflicts of interest
2. Attorney-client privilege concerns  
3. Confidentiality risks
4. Professional conduct violations

For each concern found, provide:
- type: CONFLICT_OF_INTEREST | PRIVILEGE_CONCERN | CONFIDENTIALITY_RISK | PROFESSIONAL_CONDUCT
- severity: LOW | MEDIUM | HIGH | CRITICAL
- description: Brief explanation of the concern
- suggestion: Recommended action

Return as a JSON array of objects. If no concerns are found, return an empty array.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a legal ethics AI assistant. Focus on identifying potential ethical violations and professional conduct concerns in legal documents.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      try {
        const parsed = JSON.parse(response);
        return Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.warn('Failed to parse ethical concerns response');
        return [];
      }
    } catch (error) {
      console.error('OpenAI ethical check error:', error);
      return [];
    }
  },

  /**
   * Generate case timeline from evidence
   */
  async generateTimeline(evidence: Array<{
    title: string;
    description?: string;
    dateObtained: string;
    type: string;
    content?: string;
  }>): Promise<Array<{
    date: string;
    title: string;
    description: string;
    importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sources: string[];
  }>> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const evidenceText = evidence.map(e => 
        `${e.dateObtained}: ${e.title} (${e.type}) - ${e.description || ''}`
      ).join('\n');

      const prompt = `
Based on the following evidence, create a chronological timeline of key events:

${evidenceText}

Generate a timeline with the following for each event:
- date: ISO date string
- title: Brief event title
- description: 1-2 sentence description
- importance: LOW, MEDIUM, HIGH, or CRITICAL
- sources: Array of evidence titles that support this event

Return as a JSON array sorted chronologically. Focus on legally significant events.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a legal timeline analyst. Create accurate, chronological timelines from evidence while maintaining objectivity and legal precision.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      try {
        const parsed = JSON.parse(response);
        return Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.warn('Failed to parse timeline response');
        return [];
      }
    } catch (error) {
      console.error('OpenAI timeline generation error:', error);
      throw new Error('Failed to generate timeline');
    }
  },

  /**
   * Analyze contract for key terms and risks
   */
  async analyzeContract(content: string): Promise<{
    contractType: string;
    parties: string[];
    keyTerms: Array<{ term: string; value: string; importance: string }>;
    risks: Array<{ risk: string; severity: string; mitigation: string }>;
    importantDates: Array<{ date: string; description: string; type: string }>;
    recommendations: string[];
  }> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `
Analyze this contract and provide a comprehensive legal analysis:

${content.substring(0, 5000)}

Provide analysis in the following JSON format:
{
  "contractType": "string - type of contract",
  "parties": ["array of party names"],
  "keyTerms": [{"term": "string", "value": "string", "importance": "LOW|MEDIUM|HIGH|CRITICAL"}],
  "risks": [{"risk": "string", "severity": "LOW|MEDIUM|HIGH|CRITICAL", "mitigation": "string"}],
  "importantDates": [{"date": "YYYY-MM-DD", "description": "string", "type": "deadline|milestone|expiration"}],
  "recommendations": ["array of recommendations"]
}

Focus on legal significance, potential risks, and actionable insights.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a contract analysis AI specializing in legal document review. Provide thorough, accurate analysis while maintaining professional legal standards.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(response);
      } catch (parseError) {
        throw new Error('Failed to parse contract analysis response');
      }
    } catch (error) {
      console.error('OpenAI contract analysis error:', error);
      throw new Error('Failed to analyze contract');
    }
  }
};

export default openAIClient;