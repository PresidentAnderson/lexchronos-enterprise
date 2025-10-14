/**
 * OpenAI Integration Client for LexChronos
 * Handles document summarization, legal analysis, and content generation
 */

import OpenAI from 'openai';
import { createHash } from 'crypto';

export interface DocumentSummaryRequest {
  content: string;
  documentType?: 'legal' | 'medical' | 'financial' | 'correspondence' | 'procedural';
  context?: string;
  confidentialityLevel?: 'public' | 'confidential' | 'privileged';
}

export interface DocumentSummaryResponse {
  summary: string;
  keyPoints: string[];
  suggestedCategory: string;
  confidentialityFlags: string[];
  confidenceScore: number;
  processingTime: number;
}

export interface LegalAnalysisRequest {
  documents: string[];
  caseContext: string;
  analysisType: 'rebuttal' | 'strategy' | 'consistency' | 'ethical';
  targetAudience?: 'legal' | 'public' | 'expert';
}

export interface LegalAnalysisResponse {
  analysis: string;
  recommendations: string[];
  concerns: string[];
  citations?: string[];
  confidenceScore: number;
}

export interface EthicalFlag {
  type: 'privacy' | 'confidentiality' | 'privilege' | 'defamation' | 'contempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  suggestion: string;
}

class OpenAIClient {
  private client: OpenAI;
  private readonly maxTokens = 4000;
  private readonly temperature = 0.3; // Lower for more consistent legal analysis

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate comprehensive document summary
   */
  async summarizeDocument(request: DocumentSummaryRequest): Promise<DocumentSummaryResponse> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildSummaryPrompt(request);
      
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a legal document analysis expert. Provide accurate, objective summaries while identifying potential confidentiality concerns. Always maintain professional legal standards.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        summary: response.summary || '',
        keyPoints: response.keyPoints || [],
        suggestedCategory: response.suggestedCategory || 'GENERAL',
        confidentialityFlags: response.confidentialityFlags || [],
        confidenceScore: response.confidenceScore || 0.5,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error in document summarization:', error);
      throw new Error('Failed to generate document summary');
    }
  }

  /**
   * Generate legal analysis and strategy recommendations
   */
  async analyzeLegal(request: LegalAnalysisRequest): Promise<LegalAnalysisResponse> {
    try {
      const prompt = this.buildLegalAnalysisPrompt(request);
      
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a senior legal analyst specializing in case strategy and document review. Provide thorough, evidence-based analysis while identifying potential legal risks and opportunities.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        analysis: response.analysis || '',
        recommendations: response.recommendations || [],
        concerns: response.concerns || [],
        citations: response.citations || [],
        confidenceScore: response.confidenceScore || 0.5
      };
    } catch (error) {
      console.error('Error in legal analysis:', error);
      throw new Error('Failed to generate legal analysis');
    }
  }

  /**
   * Check content for ethical and confidentiality concerns
   */
  async checkEthicalConcerns(content: string): Promise<EthicalFlag[]> {
    try {
      const prompt = `
        Analyze the following content for potential ethical, privacy, and confidentiality concerns:
        
        Content: ${content}
        
        Identify any:
        - Personal identifying information
        - Attorney-client privileged communications
        - Confidential business information
        - Potential defamatory statements
        - Information that could compromise legal proceedings
        
        Return results as JSON array with format:
        {
          "flags": [
            {
              "type": "privacy|confidentiality|privilege|defamation|contempt",
              "severity": "low|medium|high|critical",
              "location": "specific text or line reference",
              "suggestion": "recommended action"
            }
          ]
        }
      `;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in legal ethics and confidentiality. Flag any content that could pose legal or ethical risks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1, // Very low for consistent flagging
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{"flags": []}');
      return response.flags || [];
    } catch (error) {
      console.error('Error in ethical analysis:', error);
      throw new Error('Failed to analyze ethical concerns');
    }
  }

  /**
   * Generate embeddings for semantic search
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Limit input length
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Transcribe audio to text using Whisper
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<{
    text: string;
    language: string;
    confidence: number;
  }> {
    try {
      // Create a file-like object from buffer
      const audioFile = new File([audioBuffer], filename);
      
      const transcription = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en', // Default to English, can be auto-detected
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      });

      return {
        text: transcription.text,
        language: transcription.language || 'en',
        confidence: 0.85 // Whisper doesn't provide confidence, using estimated value
      };
    } catch (error) {
      console.error('Error in audio transcription:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Build comprehensive summary prompt
   */
  private buildSummaryPrompt(request: DocumentSummaryRequest): string {
    const confidentialityGuidance = request.confidentialityLevel === 'public' 
      ? 'This content may be made public. Flag any sensitive information.'
      : 'This is confidential legal content. Identify privilege and privacy concerns.';

    return `
      Analyze and summarize this ${request.documentType || 'legal'} document:

      Document Content:
      ${request.content}

      Context: ${request.context || 'General legal document'}

      Instructions:
      - Provide a concise, accurate summary (2-3 paragraphs)
      - Extract 3-5 key points
      - Suggest appropriate evidence category
      - Flag potential confidentiality concerns
      - ${confidentialityGuidance}

      Return response as JSON:
      {
        "summary": "comprehensive summary text",
        "keyPoints": ["point 1", "point 2", "..."],
        "suggestedCategory": "CHRONOLOGY|MEDICAL|CORRESPONDENCE|FINANCIAL|WITNESS|PROCEDURAL|ETHICAL|PUBLIC",
        "confidentialityFlags": ["flag descriptions"],
        "confidenceScore": 0.0-1.0
      }
    `;
  }

  /**
   * Build legal analysis prompt
   */
  private buildLegalAnalysisPrompt(request: LegalAnalysisRequest): string {
    const analysisInstructions = {
      rebuttal: 'Generate a structured rebuttal addressing opposing claims with evidence-based counterarguments.',
      strategy: 'Develop legal strategy recommendations based on evidence strength and case context.',
      consistency: 'Analyze documents for internal consistency and identify any contradictions.',
      ethical: 'Review content for ethical compliance and professional responsibility concerns.'
    };

    return `
      Perform ${request.analysisType} analysis for the following case:

      Case Context: ${request.caseContext}

      Documents:
      ${request.documents.join('\n\n---\n\n')}

      Analysis Type: ${analysisInstructions[request.analysisType]}
      Target Audience: ${request.targetAudience || 'legal'}

      Return response as JSON:
      {
        "analysis": "detailed analysis text",
        "recommendations": ["recommendation 1", "recommendation 2", "..."],
        "concerns": ["concern 1", "concern 2", "..."],
        "citations": ["relevant legal precedents or authorities"],
        "confidenceScore": 0.0-1.0
      }
    `;
  }

  /**
   * Generate content hash for caching and deduplication
   */
  generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}

// Export singleton instance
export const openAIClient = new OpenAIClient();
export default openAIClient;