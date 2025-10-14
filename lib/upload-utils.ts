/**
 * File Upload Utilities
 * Validation, sanitization, and security functions for file uploads
 */

import { extname, basename } from 'path';

export interface UploadValidation {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validate uploaded file
 */
export function validateUpload(file: File): UploadValidation {
  const warnings: string[] = [];

  // Check file size (50MB limit)
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty'
    };
  }

  // Validate file type
  const allowedMimeTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/json',
    
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    
    // Audio/Video
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'video/mp4',
    'video/quicktime',
    
    // Archives
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type '${file.type}' is not supported`
    };
  }

  // Validate file extension matches MIME type
  const extension = extname(file.name).toLowerCase();
  const expectedExtensions = getMimeTypeExtensions(file.type);
  
  if (expectedExtensions.length > 0 && !expectedExtensions.includes(extension)) {
    warnings.push(`File extension '${extension}' doesn't match MIME type '${file.type}'`);
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs', '.ps1'];
  if (dangerousExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension '${extension}' is not allowed for security reasons`
    };
  }

  // Warn about large files that might be slow to process
  if (file.size > 10 * 1024 * 1024) {
    warnings.push('Large files may take longer to process and analyze');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  const sanitized = filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase();

  // Ensure filename isn't too long
  const maxLength = 100;
  const extension = extname(sanitized);
  const nameWithoutExt = basename(sanitized, extension);

  if (sanitized.length > maxLength) {
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length);
    return truncatedName + extension;
  }

  return sanitized || 'unnamed_file';
}

/**
 * Get expected file extensions for MIME type
 */
function getMimeTypeExtensions(mimeType: string): string[] {
  const mimeToExtensions: { [key: string]: string[] } = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md'],
    'application/json': ['.json'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/mp4': ['.m4a'],
    'video/mp4': ['.mp4'],
    'video/quicktime': ['.mov'],
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar']
  };

  return mimeToExtensions[mimeType] || [];
}

/**
 * Format file size for human reading
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Generate secure upload path
 */
export function generateUploadPath(organizationId: string, filename: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  return `uploads/${organizationId}/${year}/${month}/${filename}`;
}

/**
 * Check if file is likely to contain sensitive information
 */
export function checkSensitivityIndicators(filename: string, fileSize: number): {
  likelySensitive: boolean;
  indicators: string[];
} {
  const indicators: string[] = [];
  const lowerName = filename.toLowerCase();

  // Check filename for sensitive keywords
  const sensitiveKeywords = [
    'confidential', 'private', 'secret', 'privileged',
    'ssn', 'social_security', 'passport', 'license',
    'medical', 'health', 'patient', 'diagnosis',
    'financial', 'bank', 'credit', 'tax',
    'legal', 'attorney', 'lawyer', 'counsel'
  ];

  for (const keyword of sensitiveKeywords) {
    if (lowerName.includes(keyword)) {
      indicators.push(`Filename contains sensitive keyword: ${keyword}`);
    }
  }

  // Large files might contain more sensitive data
  if (fileSize > 5 * 1024 * 1024) {
    indicators.push('Large file size may indicate extensive sensitive content');
  }

  return {
    likelySensitive: indicators.length > 0,
    indicators
  };
}

/**
 * Generate file checksum for integrity verification
 */
export async function generateChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');
}

/**
 * Validate file integrity using checksum
 */
export async function validateFileIntegrity(filePath: string, expectedChecksum: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises');
    const crypto = await import('crypto');
    
    const buffer = await fs.readFile(filePath);
    const actualChecksum = crypto.createHash('sha256').update(buffer).digest('hex');
    
    return actualChecksum === expectedChecksum;
  } catch (error) {
    console.error('File integrity validation failed:', error);
    return false;
  }
}