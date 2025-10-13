/**
 * Encryption Utilities for Legal Documents
 * Zero Trust Security Implementation
 * LexChronos - Legal Case Management System
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Encryption configuration
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  tagLength: 16, // 128 bits
  saltLength: 32, // 256 bits
  iterations: 100000, // PBKDF2 iterations
  hashAlgorithm: 'sha256'
};

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn('ENCRYPTION_KEY not set in environment variables. Using fallback (NOT for production)');
    return crypto.scryptSync('fallback-key-change-in-production', 'salt', 32);
  }
  
  // If key is base64 encoded
  if (key.length === 44 && /^[A-Za-z0-9+/]+=*$/.test(key)) {
    return Buffer.from(key, 'base64');
  }
  
  // If key is hex encoded
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  
  // Derive key from string
  return crypto.scryptSync(key, 'lexchronos-salt', 32);
}

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(data: string | Buffer, key?: Buffer): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const encryptionKey = key || getEncryptionKey();
  const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
  
  const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, encryptionKey, { iv });
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData: string, iv: string, tag: string, key?: Buffer): string {
  const encryptionKey = key || getEncryptionKey();
  
  const decipher = crypto.createDecipher(
    ENCRYPTION_CONFIG.algorithm,
    encryptionKey,
    { iv: Buffer.from(iv, 'hex') }
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encrypt file buffer
 */
export function encryptFile(fileBuffer: Buffer, key?: Buffer): {
  encrypted: Buffer;
  iv: string;
  tag: string;
  originalSize: number;
} {
  const encryptionKey = key || getEncryptionKey();
  const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
  
  const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, encryptionKey, { iv });
  
  const encrypted = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    originalSize: fileBuffer.length
  };
}

/**
 * Decrypt file buffer
 */
export function decryptFile(
  encryptedBuffer: Buffer, 
  iv: string, 
  tag: string, 
  key?: Buffer
): Buffer {
  const encryptionKey = key || getEncryptionKey();
  
  const decipher = crypto.createDecipher(
    ENCRYPTION_CONFIG.algorithm,
    encryptionKey,
    { iv: Buffer.from(iv, 'hex') }
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  return Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final()
  ]);
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate cryptographically secure random string
 */
export function generateSecureId(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomByte = crypto.randomBytes(1)[0];
    result += charset[randomByte % charset.length];
  }
  
  return result;
}

/**
 * Create HMAC signature
 */
export function createSignature(data: string, secret?: string): string {
  const signingKey = secret || process.env.SIGNING_SECRET || 'fallback-secret';
  return crypto
    .createHmac(ENCRYPTION_CONFIG.hashAlgorithm, signingKey)
    .update(data)
    .digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifySignature(data: string, signature: string, secret?: string): boolean {
  const expectedSignature = createSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Encrypt JSON object
 */
export function encryptJSON(obj: any, key?: Buffer): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString, key);
}

/**
 * Decrypt JSON object
 */
export function decryptJSON(encryptedData: string, iv: string, tag: string, key?: Buffer): any {
  const decryptedString = decrypt(encryptedData, iv, tag, key);
  return JSON.parse(decryptedString);
}

/**
 * Key derivation for user-specific encryption
 */
export function deriveUserKey(userId: string, masterKey?: Buffer): Buffer {
  const master = masterKey || getEncryptionKey();
  return crypto.pbkdf2Sync(
    userId,
    master,
    ENCRYPTION_CONFIG.iterations,
    ENCRYPTION_CONFIG.keyLength,
    ENCRYPTION_CONFIG.hashAlgorithm
  );
}

/**
 * Encrypt data with user-specific key
 */
export function encryptWithUserKey(data: string, userId: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const userKey = deriveUserKey(userId);
  return encrypt(data, userKey);
}

/**
 * Decrypt data with user-specific key
 */
export function decryptWithUserKey(
  encryptedData: string,
  iv: string,
  tag: string,
  userId: string
): string {
  const userKey = deriveUserKey(userId);
  return decrypt(encryptedData, iv, tag, userKey);
}

/**
 * Secure deletion - overwrite sensitive data in memory
 */
export function secureDelete(buffer: Buffer): void {
  if (buffer && Buffer.isBuffer(buffer)) {
    buffer.fill(0);
  }
}

/**
 * Legal document encryption with metadata
 */
export interface EncryptedDocument {
  id: string;
  encrypted: string;
  iv: string;
  tag: string;
  metadata: {
    algorithm: string;
    keyVersion: string;
    encryptedAt: Date;
    checksum: string;
  };
  access: {
    userId: string;
    permissions: string[];
    expiresAt?: Date;
  };
}

/**
 * Encrypt legal document with full metadata
 */
export function encryptLegalDocument(
  content: string | Buffer,
  userId: string,
  permissions: string[] = ['read'],
  expiresAt?: Date
): EncryptedDocument {
  const documentId = generateSecureId(32);
  const userKey = deriveUserKey(userId);
  
  // Convert content to string if it's a buffer
  const contentString = Buffer.isBuffer(content) ? content.toString('utf8') : content;
  
  // Encrypt the content
  const { encrypted, iv, tag } = encrypt(contentString, userKey);
  
  // Create checksum for integrity verification
  const checksum = crypto
    .createHash('sha256')
    .update(contentString)
    .digest('hex');
  
  return {
    id: documentId,
    encrypted,
    iv,
    tag,
    metadata: {
      algorithm: ENCRYPTION_CONFIG.algorithm,
      keyVersion: '1.0',
      encryptedAt: new Date(),
      checksum
    },
    access: {
      userId,
      permissions,
      expiresAt
    }
  };
}

/**
 * Decrypt legal document with verification
 */
export function decryptLegalDocument(
  encryptedDoc: EncryptedDocument,
  requestingUserId: string
): {
  content: string;
  verified: boolean;
  error?: string;
} {
  try {
    // Check access permissions
    if (encryptedDoc.access.userId !== requestingUserId) {
      return {
        content: '',
        verified: false,
        error: 'Access denied: User not authorized to decrypt this document'
      };
    }
    
    // Check expiration
    if (encryptedDoc.access.expiresAt && new Date() > encryptedDoc.access.expiresAt) {
      return {
        content: '',
        verified: false,
        error: 'Access denied: Document access has expired'
      };
    }
    
    // Decrypt content
    const userKey = deriveUserKey(requestingUserId);
    const content = decrypt(encryptedDoc.encrypted, encryptedDoc.iv, encryptedDoc.tag, userKey);
    
    // Verify integrity
    const contentChecksum = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
    
    const verified = contentChecksum === encryptedDoc.metadata.checksum;
    
    return {
      content,
      verified,
      error: verified ? undefined : 'Document integrity verification failed'
    };
  } catch (error) {
    return {
      content: '',
      verified: false,
      error: `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Encrypt sensitive database fields
 */
export class FieldEncryption {
  private static fieldKey: Buffer | null = null;
  
  private static getFieldKey(): Buffer {
    if (!FieldEncryption.fieldKey) {
      const key = process.env.FIELD_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
      if (!key) {
        throw new Error('Field encryption key not configured');
      }
      FieldEncryption.fieldKey = crypto.scryptSync(key, 'field-encryption-salt', 32);
    }
    return FieldEncryption.fieldKey;
  }
  
  /**
   * Encrypt a database field value
   */
  static encryptField(value: string): string {
    if (!value) return value;
    
    const key = FieldEncryption.getFieldKey();
    const { encrypted, iv, tag } = encrypt(value, key);
    
    // Return base64 encoded combined result
    const combined = JSON.stringify({ encrypted, iv, tag });
    return Buffer.from(combined).toString('base64');
  }
  
  /**
   * Decrypt a database field value
   */
  static decryptField(encryptedValue: string): string {
    if (!encryptedValue) return encryptedValue;
    
    try {
      const key = FieldEncryption.getFieldKey();
      const combined = JSON.parse(Buffer.from(encryptedValue, 'base64').toString('utf8'));
      
      return decrypt(combined.encrypted, combined.iv, combined.tag, key);
    } catch (error) {
      console.error('Field decryption failed:', error);
      return encryptedValue; // Return as-is if decryption fails
    }
  }
  
  /**
   * Check if a field value is encrypted
   */
  static isEncrypted(value: string): boolean {
    if (!value) return false;
    
    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      return typeof parsed === 'object' && 'encrypted' in parsed && 'iv' in parsed && 'tag' in parsed;
    } catch {
      return false;
    }
  }
}