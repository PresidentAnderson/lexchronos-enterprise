/**
 * Virus Scanner Utility for LexChronos
 * Provides virus scanning capabilities using ClamAV or fallback to pattern-based detection
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ScanResult {
  isClean: boolean;
  threats: string[];
  scanEngine: 'clamav' | 'pattern-based' | 'none';
  scanTime: number;
  error?: string;
}

export class VirusScanner {
  private clamAvailable: boolean | null = null;

  /**
   * Check if ClamAV is available on the system
   */
  private async checkClamAVAvailability(): Promise<boolean> {
    if (this.clamAvailable !== null) {
      return this.clamAvailable;
    }

    try {
      await execAsync('which clamscan');
      this.clamAvailable = true;
      return true;
    } catch {
      this.clamAvailable = false;
      return false;
    }
  }

  /**
   * Scan file using ClamAV
   */
  private async scanWithClamAV(filePath: string): Promise<ScanResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(`clamscan --no-summary "${filePath}"`, {
        timeout: 30000 // 30 second timeout
      });

      const scanTime = Date.now() - startTime;
      const output = stdout + stderr;

      if (output.includes('FOUND')) {
        const threatMatch = output.match(/: (.+) FOUND/);
        const threat = threatMatch ? threatMatch[1] : 'Unknown threat';

        return {
          isClean: false,
          threats: [threat],
          scanEngine: 'clamav',
          scanTime
        };
      }

      return {
        isClean: true,
        threats: [],
        scanEngine: 'clamav',
        scanTime
      };
    } catch (error: any) {
      // ClamAV returns exit code 1 when virus is found
      if (error.code === 1) {
        const output = error.stdout + error.stderr;
        const threatMatch = output.match(/: (.+) FOUND/);
        const threat = threatMatch ? threatMatch[1] : 'Unknown threat';

        return {
          isClean: false,
          threats: [threat],
          scanEngine: 'clamav',
          scanTime: Date.now() - startTime
        };
      }

      throw error;
    }
  }

  /**
   * Pattern-based malware detection (fallback when ClamAV is not available)
   * Checks for common malware signatures and suspicious patterns
   */
  private async scanWithPatterns(buffer: Buffer): Promise<ScanResult> {
    const startTime = Date.now();
    const threats: string[] = [];

    // Convert buffer to string for pattern matching
    const content = buffer.toString('binary');
    const hexContent = buffer.toString('hex');

    // Check for EICAR test signature (standard antivirus test file)
    if (content.includes('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')) {
      threats.push('EICAR-Test-File');
    }

    // Check for executable signatures
    const executableSignatures = [
      { pattern: /^MZ/, name: 'Windows Executable (PE)' },
      { pattern: /^\\x7FELF/, name: 'Linux Executable (ELF)' },
      { pattern: /^\\xCA\\xFE\\xBA\\xBE/, name: 'Mach-O Executable' },
    ];

    for (const sig of executableSignatures) {
      if (sig.pattern.test(content)) {
        threats.push(`Suspicious: ${sig.name}`);
      }
    }

    // Check for script injection patterns
    const scriptPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /onerror\s*=/gi,
      /onload\s*=/gi,
      /<iframe[^>]*>/gi,
      /eval\s*\(/gi,
      /document\.write/gi,
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(content)) {
        threats.push('Suspicious: Script injection pattern detected');
        break;
      }
    }

    // Check for shell command patterns
    const shellPatterns = [
      /rm\s+-rf/gi,
      /wget\s+http/gi,
      /curl\s+http/gi,
      /bash\s+-c/gi,
      /sh\s+-c/gi,
      /nc\s+-e/gi, // netcat reverse shell
      /\/bin\/bash/gi,
      /\/bin\/sh/gi,
    ];

    for (const pattern of shellPatterns) {
      if (pattern.test(content)) {
        threats.push('Suspicious: Shell command pattern detected');
        break;
      }
    }

    // Check for macro-enabled Office documents (can contain malware)
    if (hexContent.includes('4d616372') || hexContent.includes('566261')) { // "Macr" or "Vba"
      threats.push('Warning: Macro-enabled document detected');
    }

    // Check for suspicious PHP patterns
    const phpPatterns = [
      /eval\s*\(\s*base64_decode/gi,
      /system\s*\(/gi,
      /exec\s*\(/gi,
      /passthru\s*\(/gi,
      /shell_exec\s*\(/gi,
    ];

    for (const pattern of phpPatterns) {
      if (pattern.test(content)) {
        threats.push('Suspicious: PHP code execution pattern detected');
        break;
      }
    }

    const scanTime = Date.now() - startTime;

    return {
      isClean: threats.length === 0,
      threats,
      scanEngine: 'pattern-based',
      scanTime
    };
  }

  /**
   * Scan a file for viruses and malware
   * @param filePath - Path to the file to scan
   * @param buffer - Optional buffer of file content for pattern-based scanning
   */
  async scanFile(filePath: string, buffer?: Buffer): Promise<ScanResult> {
    try {
      // Try ClamAV first if available
      const hasClamAV = await this.checkClamAVAvailability();

      if (hasClamAV) {
        return await this.scanWithClamAV(filePath);
      }

      // Fallback to pattern-based scanning
      console.warn('ClamAV not available, using pattern-based virus detection');

      if (!buffer) {
        const fs = await import('fs/promises');
        buffer = await fs.readFile(filePath);
      }

      return await this.scanWithPatterns(buffer);
    } catch (error) {
      console.error('Virus scan error:', error);

      return {
        isClean: false,
        threats: ['Scan failed'],
        scanEngine: 'none',
        scanTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Scan a buffer for viruses and malware
   */
  async scanBuffer(buffer: Buffer): Promise<ScanResult> {
    return this.scanWithPatterns(buffer);
  }
}

// Export singleton instance
export const virusScanner = new VirusScanner();
