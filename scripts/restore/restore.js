#!/usr/bin/env node

/**
 * Restoration System for LexChronos
 * @description Restore database and files from encrypted, compressed backups
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { createReadStream, createWriteStream } = require('fs');

class RestoreManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../../database/backups');
    this.tempDir = path.join(__dirname, '../../temp');
    this.s3Client = null;
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    this.s3Bucket = process.env.S3_BACKUP_BUCKET;
    
    this.init();
  }

  async init() {
    // Ensure directories exist
    await fs.mkdir(this.backupDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });

    // Initialize S3 client if configured
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && this.s3Bucket) {
      this.s3Client = new S3Client({
        region: process.env.AWS_S3_REGION || 'us-east-1'
      });
      console.log('✅ S3 restore client initialized');
    }
  }

  async restoreDatabase(backupFile, options = {}) {
    const {
      skipConfirmation = false,
      createDatabase = false,
      dropExisting = false
    } = options;

    console.log('🔄 Starting database restoration...');

    if (!skipConfirmation) {
      const confirmed = await this.confirmRestore('database');
      if (!confirmed) {
        console.log('❌ Restoration cancelled by user');
        return { success: false, message: 'Cancelled by user' };
      }
    }

    try {
      // Prepare the backup file for restoration
      const preparedFile = await this.prepareBackupFile(backupFile);
      
      // Verify backup integrity
      await this.verifyBackup(preparedFile);
      
      // Create backup of current database before restoring
      if (!skipConfirmation) {
        console.log('📦 Creating safety backup of current database...');
        const BackupManager = require('../backup/backup');
        const backupManager = new BackupManager();
        await backupManager.createDatabaseBackup({
          compress: true,
          encrypt: false,
          upload: false
        });
      }

      // Perform restoration
      await this.pgRestore(preparedFile, { createDatabase, dropExisting });
      
      // Cleanup temporary files
      await this.cleanup(preparedFile);
      
      console.log('✅ Database restoration completed successfully');
      return { success: true, message: 'Database restored successfully' };

    } catch (error) {
      console.error('❌ Database restoration failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  async restoreFiles(backupFile, targetDirectory = './', options = {}) {
    const { skipConfirmation = false } = options;

    console.log('📁 Starting files restoration...');

    if (!skipConfirmation) {
      const confirmed = await this.confirmRestore('files');
      if (!confirmed) {
        console.log('❌ Restoration cancelled by user');
        return { success: false, message: 'Cancelled by user' };
      }
    }

    try {
      // Prepare the backup file for restoration
      const preparedFile = await this.prepareBackupFile(backupFile);
      
      // Extract files
      await this.extractFiles(preparedFile, targetDirectory);
      
      // Cleanup temporary files
      await this.cleanup(preparedFile);
      
      console.log('✅ Files restoration completed successfully');
      return { success: true, message: 'Files restored successfully' };

    } catch (error) {
      console.error('❌ Files restoration failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  async prepareBackupFile(backupFile) {
    console.log('📋 Preparing backup file for restoration...');

    let currentFile = backupFile;

    // Download from S3 if it's an S3 key
    if (!path.isAbsolute(backupFile) && this.s3Client) {
      console.log('⬇️ Downloading backup from S3...');
      currentFile = await this.downloadFromS3(backupFile);
    }

    // Check if file exists
    try {
      await fs.access(currentFile);
    } catch (error) {
      throw new Error(`Backup file not found: ${currentFile}`);
    }

    // Decrypt if encrypted
    if (currentFile.endsWith('.enc')) {
      console.log('🔓 Decrypting backup file...');
      const decryptedFile = currentFile.replace('.enc', '');
      await this.decryptFile(currentFile, decryptedFile);
      currentFile = decryptedFile;
    }

    // Decompress if compressed
    if (currentFile.endsWith('.gz')) {
      console.log('📦 Decompressing backup file...');
      const decompressedFile = currentFile.replace('.gz', '');
      await this.decompressFile(currentFile, decompressedFile);
      currentFile = decompressedFile;
    }

    return currentFile;
  }

  async downloadFromS3(key) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const downloadPath = path.join(this.tempDir, path.basename(key));
    
    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: `lexchronos-backups/${key}`
    });

    const response = await this.s3Client.send(command);
    const writeStream = createWriteStream(downloadPath);
    
    return new Promise((resolve, reject) => {
      response.Body.pipe(writeStream);
      writeStream.on('finish', () => resolve(downloadPath));
      writeStream.on('error', reject);
      response.Body.on('error', reject);
    });
  }

  async decryptFile(encryptedFile, outputFile) {
    if (!this.encryptionKey) {
      throw new Error('Decryption key not provided');
    }

    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const input = createReadStream(encryptedFile);
    const output = createWriteStream(outputFile);

    // Read IV from the beginning of the file
    const ivBuffer = Buffer.alloc(16);
    await new Promise((resolve, reject) => {
      const stream = createReadStream(encryptedFile, { end: 15 });
      stream.on('data', (data) => {
        data.copy(ivBuffer);
        resolve();
      });
      stream.on('error', reject);
    });

    const decipher = crypto.createDecipher(algorithm, key, ivBuffer);
    
    // Skip IV in input stream
    const inputStream = createReadStream(encryptedFile, { start: 16 });
    
    inputStream.pipe(decipher).pipe(output);

    return new Promise((resolve, reject) => {
      output.on('finish', resolve);
      output.on('error', reject);
      inputStream.on('error', reject);
      decipher.on('error', reject);
    });
  }

  async decompressFile(compressedFile, outputFile) {
    return new Promise((resolve, reject) => {
      const gunzip = spawn('gunzip', ['-c', compressedFile], {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      const output = createWriteStream(outputFile);
      gunzip.stdout.pipe(output);

      let errorOutput = '';
      gunzip.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      gunzip.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`gunzip failed with code ${code}: ${errorOutput}`));
        }
      });

      gunzip.on('error', (error) => {
        reject(new Error(`gunzip process error: ${error.message}`));
      });
    });
  }

  async verifyBackup(backupFile) {
    console.log('🔍 Verifying backup integrity...');

    try {
      // For SQL files, try a dry-run parse
      if (backupFile.endsWith('.sql')) {
        const content = await fs.readFile(backupFile, 'utf8');
        if (!content.includes('PostgreSQL database dump')) {
          throw new Error('Invalid PostgreSQL backup format');
        }
      }

      // For custom format, use pg_restore --list
      if (backupFile.includes('.custom') || (!backupFile.endsWith('.sql') && !backupFile.endsWith('.tar'))) {
        await this.pgRestoreList(backupFile);
      }

      console.log('✅ Backup integrity verified');
    } catch (error) {
      throw new Error(`Backup verification failed: ${error.message}`);
    }
  }

  async pgRestore(backupFile, options = {}) {
    const { createDatabase = false, dropExisting = false } = options;
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('Database URL not configured');
    }

    return new Promise((resolve, reject) => {
      const args = [
        '--verbose',
        '--no-password'
      ];

      if (dropExisting) {
        args.push('--clean');
      }

      if (createDatabase) {
        args.push('--create');
      }

      // Add database connection
      args.push('--dbname', databaseUrl);

      // Add backup file
      args.push(backupFile);

      const pgRestore = spawn('pg_restore', args, {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pgRestore.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
      });

      pgRestore.stderr.on('data', (data) => {
        errorOutput += data.toString();
        // pg_restore sends informational messages to stderr
        console.log(data.toString());
      });

      pgRestore.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`pg_restore failed with code ${code}: ${errorOutput}`));
        }
      });

      pgRestore.on('error', (error) => {
        reject(new Error(`pg_restore process error: ${error.message}`));
      });
    });
  }

  async pgRestoreList(backupFile) {
    return new Promise((resolve, reject) => {
      const pgRestore = spawn('pg_restore', ['--list', backupFile], {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pgRestore.stdout.on('data', (data) => {
        output += data.toString();
      });

      pgRestore.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pgRestore.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve(output);
        } else {
          reject(new Error(`pg_restore --list failed: ${errorOutput}`));
        }
      });

      pgRestore.on('error', (error) => {
        reject(new Error(`pg_restore process error: ${error.message}`));
      });
    });
  }

  async extractFiles(backupFile, targetDirectory) {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-xf', backupFile, '-C', targetDirectory], {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let errorOutput = '';

      tar.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tar.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar extraction failed with code ${code}: ${errorOutput}`));
        }
      });

      tar.on('error', (error) => {
        reject(new Error(`tar process error: ${error.message}`));
      });
    });
  }

  async confirmRestore(type) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`⚠️  This will restore the ${type} from backup, potentially overwriting existing data. Are you sure? (yes/N): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      });
    });
  }

  async cleanup(...files) {
    for (const file of files) {
      if (file && file.startsWith(this.tempDir)) {
        try {
          await fs.unlink(file);
          console.log(`🧹 Cleaned up temporary file: ${path.basename(file)}`);
        } catch (error) {
          console.warn(`Warning: Failed to cleanup ${file}:`, error.message);
        }
      }
    }
  }

  async listManifests() {
    const files = await fs.readdir(this.backupDir);
    const manifests = files.filter(file => file.startsWith('manifest_') && file.endsWith('.json'));
    
    const manifestData = [];
    
    for (const file of manifests) {
      try {
        const content = await fs.readFile(path.join(this.backupDir, file), 'utf8');
        const manifest = JSON.parse(content);
        manifestData.push({
          file,
          ...manifest
        });
      } catch (error) {
        console.warn(`Failed to read manifest ${file}:`, error.message);
      }
    }

    return manifestData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// CLI interface
async function main() {
  const [,, command, ...args] = process.argv;
  const restoreManager = new RestoreManager();

  try {
    switch (command) {
      case 'database':
      case 'db':
        const backupFile = args[0];
        if (!backupFile) {
          console.error('❌ Please specify backup file path');
          process.exit(1);
        }
        
        const dbResult = await restoreManager.restoreDatabase(backupFile, {
          skipConfirmation: args.includes('--yes'),
          createDatabase: args.includes('--create-db'),
          dropExisting: args.includes('--clean')
        });
        
        console.log(dbResult.success ? '✅ Database restoration completed' : `❌ Restoration failed: ${dbResult.message}`);
        break;

      case 'files':
        const filesBackup = args[0];
        const targetDir = args[1] || './';
        
        if (!filesBackup) {
          console.error('❌ Please specify backup file path');
          process.exit(1);
        }
        
        const filesResult = await restoreManager.restoreFiles(filesBackup, targetDir, {
          skipConfirmation: args.includes('--yes')
        });
        
        console.log(filesResult.success ? '✅ Files restoration completed' : `❌ Restoration failed: ${filesResult.message}`);
        break;

      case 'list':
        const manifests = await restoreManager.listManifests();
        console.log('\n📋 Available Backup Manifests:');
        
        if (manifests.length === 0) {
          console.log('  No manifests found');
        } else {
          manifests.forEach(manifest => {
            console.log(`\n  📄 ${manifest.file}`);
            console.log(`     Type: ${manifest.type}`);
            console.log(`     Created: ${manifest.timestamp}`);
            console.log(`     Environment: ${manifest.environment}`);
            if (manifest.totalSize) {
              console.log(`     Size: ${restoreManager.formatBytes(manifest.totalSize)}`);
            }
          });
        }
        break;

      case 'verify':
        const verifyFile = args[0];
        if (!verifyFile) {
          console.error('❌ Please specify backup file path');
          process.exit(1);
        }
        
        const preparedFile = await restoreManager.prepareBackupFile(verifyFile);
        await restoreManager.verifyBackup(preparedFile);
        await restoreManager.cleanup(preparedFile);
        console.log('✅ Backup verification successful');
        break;

      default:
        console.log(`
LexChronos Restore Manager

Usage: node restore.js <command> [options]

Commands:
  database <file>     Restore database from backup
  files <file> [dir]  Restore files from backup to directory
  list               List available backup manifests
  verify <file>      Verify backup integrity

Database Options:
  --yes              Skip confirmation prompts
  --create-db        Create database if it doesn't exist
  --clean            Drop existing objects before restoring

Files Options:
  --yes              Skip confirmation prompts

Examples:
  node restore.js database backup_2023-01-01.sql.gz.enc
  node restore.js files files_backup.tar.gz ./restored/
  node restore.js list
  node restore.js verify backup_file.sql --yes
        `);
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Restoration operation failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = RestoreManager;