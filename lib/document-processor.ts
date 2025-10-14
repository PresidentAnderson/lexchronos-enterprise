/**
 * Document Processing Utilities
 * Handles text extraction from various file formats
 */

import { readFile } from 'fs/promises';
import { extname } from 'path';

/**
 * Extract text content from uploaded files
 */
export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  const extension = extname(filePath).toLowerCase();
  
  try {
    switch (true) {
      case mimeType.includes('text/'):
        return extractFromTextFile(filePath);
        
      case mimeType.includes('application/pdf'):
        return extractFromPDF(filePath);
        
      case mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document'):
      case mimeType.includes('application/msword'):
        return extractFromWord(filePath);
        
      case mimeType.includes('application/json'):
        return extractFromJSON(filePath);
        
      case extension === '.md':
        return extractFromTextFile(filePath);
        
      default:
        console.warn(`Unsupported file type for text extraction: ${mimeType}`);
        return '';
    }
  } catch (error) {
    console.error(`Failed to extract text from ${filePath}:`, error);
    throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from plain text files
 */
async function extractFromTextFile(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return buffer.toString('utf-8');
}

/**
 * Extract text from PDF files
 */
async function extractFromPDF(filePath: string): Promise<string> {
  try {
    // Using pdf-parse for PDF text extraction
    const pdfParse = await import('pdf-parse');
    const buffer = await readFile(filePath);
    const data = await pdfParse.default(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    // Fallback: return basic file info
    return `[PDF Document - Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

/**
 * Extract text from Word documents
 */
async function extractFromWord(filePath: string): Promise<string> {
  try {
    // Using mammoth for Word document extraction
    const mammoth = await import('mammoth');
    const buffer = await readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Word document parsing error:', error);
    // Fallback: return basic file info
    return `[Word Document - Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

/**
 * Extract text from JSON files
 */
async function extractFromJSON(filePath: string): Promise<string> {
  const content = await extractFromTextFile(filePath);
  try {
    const json = JSON.parse(content);
    return JSON.stringify(json, null, 2);
  } catch {
    return content; // Return as-is if not valid JSON
  }
}

/**
 * Get document metadata without full text extraction
 */
export async function getDocumentMetadata(filePath: string, mimeType: string): Promise<{
  pageCount?: number;
  wordCount?: number;
  hasText: boolean;
  language?: string;
}> {
  try {
    const text = await extractTextFromFile(filePath, mimeType);
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      wordCount,
      hasText: text.length > 0,
      language: 'en' // Could be enhanced with language detection
    };
  } catch (error) {
    return {
      hasText: false
    };
  }
}

/**
 * Validate file for processing
 */
export function canProcessFile(mimeType: string): boolean {
  const supportedTypes = [
    'text/',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/json'
  ];
  
  return supportedTypes.some(type => mimeType.includes(type));
}

/**
 * Get file processing priority (higher = more important to process)
 */
export function getProcessingPriority(mimeType: string, fileSize: number): number {
  let priority = 1;
  
  // Prioritize text-based documents
  if (mimeType.includes('text/') || mimeType.includes('application/json')) {
    priority += 3;
  }
  
  // Prioritize PDFs and Word documents
  if (mimeType.includes('pdf') || mimeType.includes('word')) {
    priority += 2;
  }
  
  // Prioritize smaller files for faster processing
  if (fileSize < 1024 * 1024) { // < 1MB
    priority += 1;
  } else if (fileSize > 10 * 1024 * 1024) { // > 10MB
    priority -= 1;
  }
  
  return Math.max(1, priority);
}