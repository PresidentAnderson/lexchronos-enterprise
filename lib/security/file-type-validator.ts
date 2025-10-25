/**
 * File Type Validator using Magic Bytes
 * Validates file types by checking file signatures (magic bytes) rather than trusting MIME types
 */

export interface FileTypeResult {
  isValid: boolean;
  detectedType: string;
  detectedExtension: string;
  expectedType?: string;
  mismatch: boolean;
  error?: string;
}

export interface MagicBytesSignature {
  signature: number[];
  offset: number;
  extension: string;
  mimeType: string;
  description: string;
}

/**
 * Common file signatures (magic bytes)
 * Source: https://en.wikipedia.org/wiki/List_of_file_signatures
 */
const FILE_SIGNATURES: MagicBytesSignature[] = [
  // PDF
  { signature: [0x25, 0x50, 0x44, 0x46], offset: 0, extension: 'pdf', mimeType: 'application/pdf', description: 'PDF Document' },

  // Microsoft Office (Legacy)
  { signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], offset: 0, extension: 'doc', mimeType: 'application/msword', description: 'MS Office Document' },

  // Microsoft Office (Modern - ZIP based)
  { signature: [0x50, 0x4B, 0x03, 0x04], offset: 0, extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Office Open XML Document' },

  // Images
  { signature: [0xFF, 0xD8, 0xFF], offset: 0, extension: 'jpg', mimeType: 'image/jpeg', description: 'JPEG Image' },
  { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0, extension: 'png', mimeType: 'image/png', description: 'PNG Image' },
  { signature: [0x47, 0x49, 0x46, 0x38], offset: 0, extension: 'gif', mimeType: 'image/gif', description: 'GIF Image' },
  { signature: [0x42, 0x4D], offset: 0, extension: 'bmp', mimeType: 'image/bmp', description: 'BMP Image' },
  { signature: [0x49, 0x49, 0x2A, 0x00], offset: 0, extension: 'tif', mimeType: 'image/tiff', description: 'TIFF Image (Little Endian)' },
  { signature: [0x4D, 0x4D, 0x00, 0x2A], offset: 0, extension: 'tif', mimeType: 'image/tiff', description: 'TIFF Image (Big Endian)' },
  { signature: [0x52, 0x49, 0x46, 0x46], offset: 0, extension: 'webp', mimeType: 'image/webp', description: 'WebP Image' },

  // Archives
  { signature: [0x50, 0x4B, 0x03, 0x04], offset: 0, extension: 'zip', mimeType: 'application/zip', description: 'ZIP Archive' },
  { signature: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07], offset: 0, extension: 'rar', mimeType: 'application/x-rar-compressed', description: 'RAR Archive' },
  { signature: [0x1F, 0x8B], offset: 0, extension: 'gz', mimeType: 'application/gzip', description: 'GZIP Archive' },
  { signature: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], offset: 0, extension: '7z', mimeType: 'application/x-7z-compressed', description: '7-Zip Archive' },

  // Video
  { signature: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], offset: 0, extension: 'mp4', mimeType: 'video/mp4', description: 'MP4 Video' },
  { signature: [0x1A, 0x45, 0xDF, 0xA3], offset: 0, extension: 'mkv', mimeType: 'video/x-matroska', description: 'Matroska Video' },
  { signature: [0x46, 0x4C, 0x56], offset: 0, extension: 'flv', mimeType: 'video/x-flv', description: 'Flash Video' },

  // Audio
  { signature: [0x49, 0x44, 0x33], offset: 0, extension: 'mp3', mimeType: 'audio/mpeg', description: 'MP3 Audio' },
  { signature: [0xFF, 0xFB], offset: 0, extension: 'mp3', mimeType: 'audio/mpeg', description: 'MP3 Audio (Alt)' },
  { signature: [0x52, 0x49, 0x46, 0x46], offset: 0, extension: 'wav', mimeType: 'audio/wav', description: 'WAV Audio' },

  // Executables (BLOCK THESE)
  { signature: [0x4D, 0x5A], offset: 0, extension: 'exe', mimeType: 'application/x-msdownload', description: 'Windows Executable' },
  { signature: [0x7F, 0x45, 0x4C, 0x46], offset: 0, extension: 'elf', mimeType: 'application/x-executable', description: 'Linux Executable' },
  { signature: [0xCA, 0xFE, 0xBA, 0xBE], offset: 0, extension: 'macho', mimeType: 'application/x-mach-binary', description: 'Mach-O Executable' },
  { signature: [0xFE, 0xED, 0xFA, 0xCE], offset: 0, extension: 'macho', mimeType: 'application/x-mach-binary', description: 'Mach-O Executable (32-bit)' },
  { signature: [0xFE, 0xED, 0xFA, 0xCF], offset: 0, extension: 'macho', mimeType: 'application/x-mach-binary', description: 'Mach-O Executable (64-bit)' },

  // Text files (no specific signature, checked separately)
  // HTML, XML, JSON, TXT, CSV, etc. will be validated differently
];

/**
 * Blocked file extensions that should never be uploaded
 */
const BLOCKED_EXTENSIONS = [
  'exe', 'dll', 'bat', 'cmd', 'com', 'scr', 'vbs', 'js', 'jar',
  'app', 'deb', 'rpm', 'dmg', 'pkg', 'sh', 'bash', 'csh',
  'elf', 'macho', 'bin', 'run', 'out'
];

/**
 * Allowed file extensions for legal documents
 */
const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
  'txt', 'rtf', 'csv', 'html', 'xml', 'json',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff', 'webp', 'svg',
  'mp3', 'wav', 'ogg', 'm4a', 'flac',
  'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv',
  'zip', 'rar', 'tar', 'gz', '7z'
];

export class FileTypeValidator {
  /**
   * Check if buffer matches a signature
   */
  private matchesSignature(buffer: Buffer, signature: MagicBytesSignature): boolean {
    if (buffer.length < signature.offset + signature.signature.length) {
      return false;
    }

    for (let i = 0; i < signature.signature.length; i++) {
      if (buffer[signature.offset + i] !== signature.signature[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Detect file type from magic bytes
   */
  private detectFileType(buffer: Buffer): { extension: string; mimeType: string; description: string } | null {
    for (const signature of FILE_SIGNATURES) {
      if (this.matchesSignature(buffer, signature)) {
        return {
          extension: signature.extension,
          mimeType: signature.mimeType,
          description: signature.description
        };
      }
    }

    // Check if it's a text file (UTF-8 or ASCII)
    const isText = this.isTextFile(buffer);
    if (isText) {
      return {
        extension: 'txt',
        mimeType: 'text/plain',
        description: 'Text File'
      };
    }

    return null;
  }

  /**
   * Check if buffer contains text (UTF-8 or ASCII)
   */
  private isTextFile(buffer: Buffer): boolean {
    const sample = buffer.slice(0, Math.min(512, buffer.length));

    // Check for null bytes (binary indicator)
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0) {
        return false;
      }
    }

    // Check for printable ASCII and common control characters
    let printableCount = 0;
    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];
      if ((byte >= 0x20 && byte <= 0x7E) || byte === 0x09 || byte === 0x0A || byte === 0x0D) {
        printableCount++;
      }
    }

    // If more than 90% of bytes are printable, it's likely text
    return (printableCount / sample.length) > 0.9;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Validate file type using magic bytes
   * @param buffer - File buffer
   * @param filename - Original filename
   * @param declaredMimeType - MIME type from upload
   */
  validateFileType(buffer: Buffer, filename: string, declaredMimeType?: string): FileTypeResult {
    try {
      const fileExtension = this.getFileExtension(filename);

      // Check if extension is blocked
      if (BLOCKED_EXTENSIONS.includes(fileExtension)) {
        return {
          isValid: false,
          detectedType: 'blocked',
          detectedExtension: fileExtension,
          mismatch: true,
          error: `File type '${fileExtension}' is not allowed for security reasons`
        };
      }

      // Check if extension is in allowed list
      if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        return {
          isValid: false,
          detectedType: 'unknown',
          detectedExtension: fileExtension,
          mismatch: true,
          error: `File extension '${fileExtension}' is not in the allowed list`
        };
      }

      // Detect actual file type from magic bytes
      const detected = this.detectFileType(buffer);

      if (!detected) {
        return {
          isValid: false,
          detectedType: 'unknown',
          detectedExtension: 'unknown',
          expectedType: fileExtension,
          mismatch: true,
          error: 'Unable to detect file type from content'
        };
      }

      // Check for extension mismatch
      const isMismatch = detected.extension !== fileExtension;

      // Special case: Office Open XML formats (docx, xlsx, pptx) all have ZIP signature
      const isOfficeXML = ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'].includes(fileExtension);
      const isZipDetected = detected.extension === 'zip' || detected.extension === 'docx';

      if (isOfficeXML && isZipDetected) {
        // Office XML formats are ZIP-based, this is expected
        return {
          isValid: true,
          detectedType: detected.mimeType,
          detectedExtension: fileExtension, // Use declared extension
          expectedType: fileExtension,
          mismatch: false
        };
      }

      // Check for dangerous mismatch (executable disguised as document)
      if (BLOCKED_EXTENSIONS.includes(detected.extension)) {
        return {
          isValid: false,
          detectedType: detected.mimeType,
          detectedExtension: detected.extension,
          expectedType: fileExtension,
          mismatch: true,
          error: `File appears to be '${detected.extension}' but is named '${filename}'. Possible malware.`
        };
      }

      return {
        isValid: !isMismatch || (isOfficeXML && isZipDetected),
        detectedType: detected.mimeType,
        detectedExtension: detected.extension,
        expectedType: fileExtension,
        mismatch: isMismatch && !(isOfficeXML && isZipDetected),
        error: isMismatch ? `File extension '${fileExtension}' doesn't match detected type '${detected.extension}'` : undefined
      };

    } catch (error) {
      return {
        isValid: false,
        detectedType: 'error',
        detectedExtension: 'error',
        mismatch: true,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Quick check if file extension is allowed
   */
  isExtensionAllowed(extension: string): boolean {
    return ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
  }

  /**
   * Quick check if file extension is blocked
   */
  isExtensionBlocked(extension: string): boolean {
    return BLOCKED_EXTENSIONS.includes(extension.toLowerCase());
  }
}

// Export singleton instance
export const fileTypeValidator = new FileTypeValidator();
